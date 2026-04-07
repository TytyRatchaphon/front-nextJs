import { describe, expect, it } from "vitest";
import { getReviewPreviewText, toPlainReviewText, toSafeReviewPreviewHtml } from "./reviewText";

describe("reviewText utils", () => {
  it("toPlainReviewText strips spoiler tags, html tags and decodes entities", () => {
    const input = `<p>Hello&nbsp;<strong>World</strong><br/>[SPOILER]twist[/SPOILER] &amp; more</p>`;
    expect(toPlainReviewText(input)).toBe("Hello World twist & more");
  });

  it("getReviewPreviewText truncates long text with ellipsis", () => {
    const input = "A".repeat(30);
    expect(getReviewPreviewText(input, 10)).toBe("AAAAAAAAAA...");
  });

  it("getReviewPreviewText returns empty string for empty input", () => {
    expect(getReviewPreviewText(null)).toBe("");
    expect(getReviewPreviewText("   ")).toBe("");
  });

  it("toSafeReviewPreviewHtml converts list items to prefixed lines and removes images", () => {
    const input = `<ul><li>One</li><li>Two</li></ul><p>Line<br/>Break</p><img src="https://x.test/a.png" />`;
    const output = toSafeReviewPreviewHtml(input);

    expect(output).toContain("- One");
    expect(output).toContain("- Two");
    expect(output).toContain("Line Break");
    expect(output).not.toContain("<img");
  });

  it("toSafeReviewPreviewHtml strips spoiler markers", () => {
    const input = `<p>[SPOILER]Hidden[/SPOILER] text</p>`;
    expect(toSafeReviewPreviewHtml(input)).toBe("Hidden text");
  });
});

