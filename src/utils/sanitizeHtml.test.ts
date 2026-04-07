import { describe, expect, it } from "vitest";
import { sanitizeUserGeneratedHtml } from "./sanitizeHtml";

describe("sanitizeHtml fallback behavior", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeUserGeneratedHtml(null)).toBe("");
    expect(sanitizeUserGeneratedHtml(undefined)).toBe("");
    expect(sanitizeUserGeneratedHtml(123)).toBe("");
  });

  it("removes dangerous tags and inline event handlers", () => {
    const input = `<script>alert(1)</script><p onclick="evil()">Hello</p><img src="javascript:alert(1)" onerror="evil()" />`;
    const output = sanitizeUserGeneratedHtml(input);

    expect(output).not.toContain("<script");
    expect(output).not.toContain("onclick=");
    expect(output).not.toContain("onerror=");
    expect(output).not.toContain("javascript:");
    expect(output).toContain("<p>Hello</p>");
  });

  it("keeps safe href/src urls", () => {
    const input = `<a href="https://enjoybook.co">link</a><img src="/images/a.png" alt="a" />`;
    const output = sanitizeUserGeneratedHtml(input);

    expect(output).toContain(`href="https://enjoybook.co"`);
    expect(output).toContain(`src="/images/a.png"`);
  });
});

