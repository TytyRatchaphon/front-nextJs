import { beforeEach, describe, expect, it } from "vitest";

import { useUIStore } from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      isLoginModalOpen: false,
      isRegisterModalOpen: false,
      isDailyPopupOpen: false,
      isDuplicateLoginModalOpen: false,
      loginAnimationClass: "fade-in",
      registerAnimationClass: "fade-in",
      loginViewMode: "login",
      isDailyPopupProcessComplete: false,
      isBlockedUserModalOpen: false,
      isCheckinModalOpen: false,
    });
  });

  it("opens and closes login/register modals", () => {
    useUIStore.getState().openLoginModal();
    expect(useUIStore.getState().isLoginModalOpen).toBe(true);
    useUIStore.getState().closeLoginModal();
    expect(useUIStore.getState().isLoginModalOpen).toBe(false);

    useUIStore.getState().openRegisterModal();
    expect(useUIStore.getState().isRegisterModalOpen).toBe(true);
    useUIStore.getState().closeRegisterModal();
    expect(useUIStore.getState().isRegisterModalOpen).toBe(false);
  });

  it("updates login mode and animation classes", () => {
    useUIStore.getState().setLoginViewMode("forgot-password");
    useUIStore.getState().setLoginAnimation("slide-in");
    useUIStore.getState().setRegisterAnimation("zoom-in");

    const state = useUIStore.getState();
    expect(state.loginViewMode).toBe("forgot-password");
    expect(state.loginAnimationClass).toBe("slide-in");
    expect(state.registerAnimationClass).toBe("zoom-in");
  });

  it("handles daily popup and process completion", () => {
    useUIStore.getState().openDailyPopup();
    expect(useUIStore.getState().isDailyPopupOpen).toBe(true);
    expect(useUIStore.getState().isDailyPopupProcessComplete).toBe(false);

    useUIStore.getState().setDailyPopupProcessComplete(false);
    useUIStore.getState().closeDailyPopup();

    expect(useUIStore.getState().isDailyPopupOpen).toBe(false);
    expect(useUIStore.getState().isDailyPopupProcessComplete).toBe(true);
  });

  it("handles duplicate login, blocked user, and checkin modals", () => {
    useUIStore.getState().openDuplicateLoginModal();
    useUIStore.getState().openBlockedUserModal();
    useUIStore.getState().openCheckinModal();

    expect(useUIStore.getState().isDuplicateLoginModalOpen).toBe(true);
    expect(useUIStore.getState().isBlockedUserModalOpen).toBe(true);
    expect(useUIStore.getState().isCheckinModalOpen).toBe(true);

    useUIStore.getState().closeDuplicateLoginModal();
    useUIStore.getState().closeBlockedUserModal();
    useUIStore.getState().closeCheckinModal();

    expect(useUIStore.getState().isDuplicateLoginModalOpen).toBe(false);
    expect(useUIStore.getState().isBlockedUserModalOpen).toBe(false);
    expect(useUIStore.getState().isCheckinModalOpen).toBe(false);
  });
});
