import { beforeEach, describe, expect, it } from "vitest";

import { initialUserProfile, useFormStore } from "./formStore";

describe("formStore", () => {
  beforeEach(() => {
    useFormStore.setState({
      userProfileForm: { ...initialUserProfile },
      formErrors: {},
    });
  });

  it("has expected initial state", () => {
    const state = useFormStore.getState();
    expect(state.userProfileForm).toEqual(initialUserProfile);
    expect(state.formErrors).toEqual({});
  });

  it("updates user profile fields", () => {
    useFormStore.getState().updateUserProfile("fullname", "New Name");
    useFormStore.getState().updateUserProfile("facebook", "fb.com/new");

    const form = useFormStore.getState().userProfileForm;
    expect(form.fullname).toBe("New Name");
    expect(form.facebook).toBe("fb.com/new");
  });

  it("sets and clears form errors", () => {
    useFormStore.getState().setFormErrors({
      fullname: "required",
      cat1: "required",
    });
    expect(useFormStore.getState().formErrors).toEqual({
      fullname: "required",
      cat1: "required",
    });

    useFormStore.getState().clearFormErrors();
    expect(useFormStore.getState().formErrors).toEqual({});
  });

  it("resets profile and errors to initial values", () => {
    useFormStore.getState().updateUserProfile("fullname", "Edited");
    useFormStore.getState().setFormErrors({ fullname: "error" });

    useFormStore.getState().resetUserProfile();

    const state = useFormStore.getState();
    expect(state.userProfileForm).toEqual(initialUserProfile);
    expect(state.formErrors).toEqual({});
  });

  it("supports updating optional profile fields used by settings UI", () => {
    useFormStore.getState().updateUserProfile("des", "writer bio");
    useFormStore.getState().updateUserProfile("twitter", "@writer");
    useFormStore.getState().updateUserProfile("cat1", "2");
    useFormStore.getState().updateUserProfile("cat2", "3");

    const form = useFormStore.getState().userProfileForm;
    expect(form.des).toBe("writer bio");
    expect(form.twitter).toBe("@writer");
    expect(form.cat1).toBe("2");
    expect(form.cat2).toBe("3");
  });

});
