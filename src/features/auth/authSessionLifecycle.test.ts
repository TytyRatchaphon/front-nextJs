import { describe, expect, it, vi } from "vitest";

import { createAuthSessionLifecycle } from "./authSessionLifecycle";

const encode = (value: object) => btoa(JSON.stringify(value))
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");

const tokenFor = (userId: number, expiresAt = Math.floor(Date.now() / 1000) + 3_600) =>
  `${encode({ alg: "none", typ: "JWT" })}.${encode({ userId, exp: expiresAt, fullname: `User ${userId}` })}.signature`;

interface TestUser {
  user_id: number;
  fullname: string;
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

const createFixture = () => {
  let persistedToken: string | null = null;
  const persistence = {
    read: vi.fn(async () => persistedToken),
    write: vi.fn(async (token: string) => {
      persistedToken = token;
    }),
    clear: vi.fn(async () => {
      persistedToken = null;
    }),
  };
  const lifecycle = createAuthSessionLifecycle<TestUser>({
    persistence,
    mapUser: (_token, fallback) => fallback ?? { user_id: 7, fullname: "User 7" },
  });
  return { lifecycle, persistence };
};

describe("AuthSessionLifecycle", () => {
  it("covers login, reload hydration, refresh, and logout through one public lifecycle", async () => {
    const { lifecycle, persistence } = createFixture();
    const user = { user_id: 7, fullname: "User 7" };
    expect(await lifecycle.completeLogin(user, tokenFor(7))).toBe(true);

    const reloadedLifecycle = createAuthSessionLifecycle<TestUser>({
      persistence,
      mapUser: (_token, fallback) => fallback ?? user,
    });
    await reloadedLifecycle.hydrate();
    expect(reloadedLifecycle.getState().status).toBe("authenticated");

    const refreshedToken = tokenFor(7, Math.floor(Date.now() / 1000) + 7_200);
    expect(await reloadedLifecycle.refresh(async () => refreshedToken)).toBe(true);
    expect(reloadedLifecycle.getState().token).toBe(refreshedToken);

    await reloadedLifecycle.logout();
    expect(reloadedLifecycle.getState()).toMatchObject({ status: "guest", user: null, token: null });
    expect(persistence.read).toHaveBeenCalledOnce();
    expect(persistence.write).toHaveBeenCalledTimes(2);
    expect(persistence.clear).toHaveBeenCalledOnce();
  });

  it("publishes authenticated only after one successful session persistence", async () => {
    const { lifecycle, persistence } = createFixture();
    const user = { user_id: 7, fullname: "User 7" };

    const completed = await lifecycle.completeLogin(user, tokenFor(7));

    expect(completed).toBe(true);
    expect(persistence.write).toHaveBeenCalledOnce();
    expect(lifecycle.getState()).toMatchObject({
      status: "authenticated",
      user,
      hasHydrated: true,
    });
  });

  it("coalesces duplicate completion for the same provider result", async () => {
    const { lifecycle, persistence } = createFixture();
    const pendingWrite = deferred<void>();
    persistence.write.mockReturnValue(pendingWrite.promise);
    const user = { user_id: 7, fullname: "User 7" };
    const token = tokenFor(7);

    const first = lifecycle.completeLogin(user, token);
    const replay = lifecycle.completeLogin(user, token);
    pendingWrite.resolve();

    await expect(Promise.all([first, replay])).resolves.toEqual([true, true]);
    expect(persistence.write).toHaveBeenCalledOnce();
  });

  it("coalesces concurrent hydration into one authoritative session read", async () => {
    const { lifecycle, persistence } = createFixture();
    const pendingSession = deferred<string | null>();
    persistence.read.mockReturnValue(pendingSession.promise);

    const firstHydration = lifecycle.hydrate();
    const secondHydration = lifecycle.hydrate();
    pendingSession.resolve(tokenFor(7));
    await Promise.all([firstHydration, secondHydration]);

    expect(persistence.read).toHaveBeenCalledOnce();
    expect(lifecycle.getState()).toMatchObject({
      status: "authenticated",
      user: { user_id: 7 },
      hasHydrated: true,
    });
  });

  it("makes Logout terminal across stale hydration and repeated cleanup requests", async () => {
    const { lifecycle, persistence } = createFixture();
    const pendingSession = deferred<string | null>();
    const pendingClear = deferred<void>();
    persistence.read.mockReturnValue(pendingSession.promise);
    persistence.clear.mockReturnValue(pendingClear.promise);
    const hydration = lifecycle.hydrate();

    const firstLogout = lifecycle.logout();
    const secondLogout = lifecycle.logout();
    expect(lifecycle.getState()).toMatchObject({
      status: "logging_out",
      user: null,
      token: null,
    });
    pendingSession.resolve(tokenFor(7));
    pendingClear.resolve();
    await Promise.all([hydration, firstLogout, secondLogout]);

    expect(persistence.clear).toHaveBeenCalledOnce();
    expect(lifecycle.getState()).toMatchObject({
      status: "guest",
      user: null,
      token: null,
      hasHydrated: true,
    });
  });

  it("coalesces refresh and ignores its result after Logout", async () => {
    const { lifecycle, persistence } = createFixture();
    await lifecycle.completeLogin({ user_id: 7, fullname: "User 7" }, tokenFor(7));
    const pendingRefresh = deferred<string>();
    const loadRefresh = vi.fn(() => pendingRefresh.promise);

    const firstRefresh = lifecycle.refresh(loadRefresh);
    const secondRefresh = lifecycle.refresh(loadRefresh);
    await lifecycle.logout();
    pendingRefresh.resolve(tokenFor(7, Math.floor(Date.now() / 1000) + 7_200));
    await Promise.all([firstRefresh, secondRefresh]);

    expect(loadRefresh).toHaveBeenCalledOnce();
    expect(persistence.write).toHaveBeenCalledOnce();
    expect(lifecycle.getState()).toMatchObject({ status: "guest", user: null, token: null });
  });

  it("does not let an old account refresh swallow the replacement account refresh", async () => {
    const { lifecycle } = createFixture();
    await lifecycle.completeLogin({ user_id: 7, fullname: "User 7" }, tokenFor(7));
    const pendingOldRefresh = deferred<string>();
    const oldRefresh = lifecycle.refresh(() => pendingOldRefresh.promise);

    await lifecycle.completeLogin({ user_id: 8, fullname: "User 8" }, tokenFor(8));
    const replacementToken = tokenFor(8, Math.floor(Date.now() / 1000) + 7_200);
    const replacementLoader = vi.fn(async () => replacementToken);
    expect(await lifecycle.refresh(replacementLoader)).toBe(true);

    pendingOldRefresh.resolve(tokenFor(7));
    expect(await oldRefresh).toBe(false);
    expect(replacementLoader).toHaveBeenCalledOnce();
    expect(lifecycle.getState()).toMatchObject({
      status: "authenticated",
      user: { user_id: 8 },
      token: replacementToken,
    });
  });

  it("accepts only same-identity token updates for the active session", async () => {
    const { lifecycle, persistence } = createFixture();
    await lifecycle.completeLogin({ user_id: 7, fullname: "User 7" }, tokenFor(7));

    expect(await lifecycle.applyCredential(tokenFor(8))).toBe(false);
    expect(await lifecycle.applyCredential(tokenFor(7, Math.floor(Date.now() / 1000) + 7_200))).toBe(true);

    expect(persistence.write).toHaveBeenCalledTimes(2);
    expect(lifecycle.getState()).toMatchObject({ status: "authenticated", user: { user_id: 7 } });
  });

  it("settles safely when persistence, hydration, or cleanup fails", async () => {
    const loginFixture = createFixture();
    loginFixture.persistence.write.mockRejectedValueOnce(new Error("write failed"));
    expect(await loginFixture.lifecycle.completeLogin(
      { user_id: 7, fullname: "User 7" },
      tokenFor(7),
    )).toBe(false);
    expect(loginFixture.lifecycle.getState()).toMatchObject({ status: "guest", error: "SESSION_PERSIST_FAILED" });

    const hydrationFixture = createFixture();
    hydrationFixture.persistence.read.mockRejectedValueOnce(new Error("read failed"));
    await hydrationFixture.lifecycle.hydrate();
    expect(hydrationFixture.lifecycle.getState()).toMatchObject({ status: "guest", hasHydrated: true });

    const logoutFixture = createFixture();
    await logoutFixture.lifecycle.completeLogin({ user_id: 7, fullname: "User 7" }, tokenFor(7));
    logoutFixture.persistence.clear.mockRejectedValueOnce(new Error("clear failed"));
    await logoutFixture.lifecycle.logout();
    expect(logoutFixture.lifecycle.getState()).toMatchObject({ status: "guest", user: null, token: null });
  });
});
