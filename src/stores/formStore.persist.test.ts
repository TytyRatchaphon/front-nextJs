import { beforeEach, describe, expect, it, vi } from "vitest";

const persistCapture = vi.hoisted(() => ({
  options: null as
    | {
        migrate?: (state: unknown) => { userProfileForm: Record<string, unknown> };
        partialize?: (state: unknown) => { userProfileForm: Record<string, unknown> };
      }
    | null,
}));

vi.mock("zustand/middleware", async () => {
  const actual = await vi.importActual<typeof import("zustand/middleware")>("zustand/middleware");

  return {
    ...actual,
    persist: ((config: unknown, options: unknown) => {
      persistCapture.options = options as typeof persistCapture.options;
      return config;
    }) as typeof actual.persist,
  };
});

describe("formStore persist options", () => {
  beforeEach(async () => {
    persistCapture.options = null;
    vi.resetModules();
    await import("./formStore");
  });

  it("migrate returns initial profile when persisted state is missing", async () => {
    const options = persistCapture.options;
    expect(options?.migrate).toBeTypeOf("function");

    const { initialUserProfile } = await import("./formStore");
    const migrated = options?.migrate?.(undefined) as { userProfileForm: typeof initialUserProfile };

    expect(migrated.userProfileForm).toEqual(initialUserProfile);
  });

  it("migrate merges only allowed profile fields", async () => {
    const options = persistCapture.options;
    expect(options?.migrate).toBeTypeOf("function");

    const { initialUserProfile } = await import("./formStore");
    const migrated = options?.migrate?.({
      userProfileForm: {
        ...initialUserProfile,
        fullname: "ignore me",
        birthday: "1990-01-01",
        gender: "female",
        cat1: "2",
        cat2: "3",
        des: "bio",
        facebook: "fb",
        twitter: "tw",
        frame_id: 7,
        aka_id: 8,
      },
    }) as { userProfileForm: typeof initialUserProfile };

    expect(migrated.userProfileForm).toEqual({
      ...initialUserProfile,
      gender: "female",
      cat1: "2",
      cat2: "3",
      des: "bio",
      facebook: "fb",
      twitter: "tw",
      frame_id: 7,
      aka_id: 8,
    });
  });

  it("partialize keeps only persisted user profile fields", () => {
    const options = persistCapture.options;
    expect(options?.partialize).toBeTypeOf("function");

    const partialized = options?.partialize?.({
      userProfileForm: {
        fullname: "ignore me",
        birthday: "1990-01-01",
        gender: "female",
        cat1: "2",
        cat2: "3",
        des: "bio",
        address_main: "Bangkok",
        phone: "0800000000",
        facebook: "fb",
        twitter: "tw",
        frame_id: 7,
        aka_id: 8,
      },
    }) as { userProfileForm: Record<string, unknown> };

    expect(partialized).toEqual({
      userProfileForm: {
        gender: "female",
        cat1: "2",
        cat2: "3",
        des: "bio",
        facebook: "fb",
        twitter: "tw",
        frame_id: 7,
        aka_id: 8,
      },
    });
    expect("fullname" in partialized.userProfileForm).toBe(false);
    expect("birthday" in partialized.userProfileForm).toBe(false);
    expect("address_main" in partialized.userProfileForm).toBe(false);
    expect("phone" in partialized.userProfileForm).toBe(false);
  });
});

