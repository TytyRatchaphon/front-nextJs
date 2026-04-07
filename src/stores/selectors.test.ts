import { describe, expect, it, vi } from "vitest";

vi.mock("./authStore", () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from "./authStore";
import { useIsAuthenticated } from "./selectors";

const mockedUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

describe("selectors - useIsAuthenticated", () => {
  it("returns true only when logged in + user + token are present", () => {
    mockedUseAuthStore.mockImplementationOnce((selector: any) =>
      selector({ isLoggedIn: true, user: { user_id: 1 }, token: "tk" })
    );
    expect(useIsAuthenticated()).toBe(true);
  });

  it("returns false when any auth piece is missing", () => {
    mockedUseAuthStore.mockImplementationOnce((selector: any) =>
      selector({ isLoggedIn: false, user: { user_id: 1 }, token: "tk" })
    );
    expect(useIsAuthenticated()).toBe(false);

    mockedUseAuthStore.mockImplementationOnce((selector: any) =>
      selector({ isLoggedIn: true, user: null, token: "tk" })
    );
    expect(useIsAuthenticated()).toBe(false);

    mockedUseAuthStore.mockImplementationOnce((selector: any) =>
      selector({ isLoggedIn: true, user: { user_id: 1 }, token: null })
    );
    expect(useIsAuthenticated()).toBe(false);
  });
});
