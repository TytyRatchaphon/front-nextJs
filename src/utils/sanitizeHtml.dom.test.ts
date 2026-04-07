import { afterEach, describe, expect, it } from "vitest";
import { sanitizeUserGeneratedHtml } from "./sanitizeHtml";

type FakeNode = FakeElement | FakeTextNode;

class FakeTextNode {
  public parentNode: FakeElement | null = null;
  constructor(public text: string) {}
}

class FakeElement {
  public parentNode: FakeElement | null = null;
  public children: FakeNode[] = [];
  private readonly attrs = new Map<string, string>();

  constructor(tagName: string, attrs: Record<string, string> = {}, children: FakeNode[] = []) {
    this.tagName = tagName.toUpperCase();
    Object.entries(attrs).forEach(([key, value]) => this.attrs.set(key, value));
    children.forEach((child) => this.appendChild(child));
  }

  public readonly tagName: string;

  get attributes() {
    return Array.from(this.attrs.entries()).map(([name, value]) => ({ name, value }));
  }

  get firstChild(): FakeNode | null {
    return this.children[0] ?? null;
  }

  get innerHTML(): string {
    return this.children.map(renderNode).join("");
  }

  public querySelectorAll(selector: string): FakeElement[] {
    if (selector !== "*") return [];
    const result: FakeElement[] = [];
    const walk = (node: FakeElement) => {
      node.children.forEach((child) => {
        if (child instanceof FakeElement) {
          result.push(child);
          walk(child);
        }
      });
    };
    walk(this);
    return result;
  }

  public appendChild(node: FakeNode) {
    node.parentNode = this;
    this.children.push(node);
  }

  public insertBefore(node: FakeNode, referenceNode: FakeNode | null) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    const index = referenceNode ? this.children.indexOf(referenceNode) : -1;
    if (index < 0) {
      this.children.push(node);
    } else {
      this.children.splice(index, 0, node);
    }
    node.parentNode = this;
  }

  public removeChild(node: FakeNode) {
    const index = this.children.indexOf(node);
    if (index >= 0) {
      this.children.splice(index, 1);
      node.parentNode = null;
    }
  }

  public remove() {
    this.parentNode?.removeChild(this);
  }

  public getAttribute(name: string): string | null {
    return this.attrs.has(name) ? this.attrs.get(name)! : null;
  }

  public setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }

  public removeAttribute(name: string) {
    this.attrs.delete(name);
  }
}

const renderNode = (node: FakeNode): string => {
  if (node instanceof FakeTextNode) return node.text;
  const tag = node.tagName.toLowerCase();
  const attrs = node.attributes
    .map((attr) => ` ${attr.name}="${attr.value}"`)
    .join("");
  return `<${tag}${attrs}>${node.children.map(renderNode).join("")}</${tag}>`;
};

const originalWindow = (globalThis as any).window;
const originalDOMParser = (globalThis as any).DOMParser;

const withDomParser = (body: FakeElement) => {
  (globalThis as any).window = {};
  (globalThis as any).DOMParser = class {
    parseFromString() {
      return { body };
    }
  };
};

afterEach(() => {
  if (originalWindow === undefined) {
    delete (globalThis as any).window;
  } else {
    (globalThis as any).window = originalWindow;
  }

  if (originalDOMParser === undefined) {
    delete (globalThis as any).DOMParser;
  } else {
    (globalThis as any).DOMParser = originalDOMParser;
  }
});

describe("sanitizeHtml DOMParser behavior", () => {
  it("removes blocked tags and keeps allowed tags", () => {
    const body = new FakeElement("body", {}, [
      new FakeElement("script", {}, [new FakeTextNode("alert(1)")]),
      new FakeElement("p", {}, [new FakeTextNode("safe")]),
      new FakeElement("style", {}, [new FakeTextNode(".x{color:red}")]),
    ]);
    withDomParser(body);

    const result = sanitizeUserGeneratedHtml("ignored");
    expect(result).toContain("<p>safe</p>");
    expect(result).not.toContain("<script");
    expect(result).not.toContain("<style");
  });

  it("unwraps non-allowed tags but preserves their children", () => {
    const body = new FakeElement("body", {}, [
      new FakeElement("custom-wrap", {}, [
        new FakeElement("span", {}, [new FakeTextNode("inside")]),
      ]),
    ]);
    withDomParser(body);

    const result = sanitizeUserGeneratedHtml("ignored");
    expect(result).toContain("<span>inside</span>");
    expect(result).not.toContain("custom-wrap");
  });

  it("sanitizes link attributes and adds rel for target=_blank", () => {
    const body = new FakeElement("body", {}, [
      new FakeElement(
        "a",
        {
          href: "https://enjoybook.co",
          target: "_blank",
          rel: "nofollow",
          onclick: "evil()",
        },
        [new FakeTextNode("link")]
      ),
      new FakeElement(
        "a",
        {
          href: "javascript:alert(1)",
          target: "_blank",
          rel: "nofollow",
        },
        [new FakeTextNode("bad")]
      ),
    ]);
    withDomParser(body);

    const result = sanitizeUserGeneratedHtml("ignored");
    expect(result).toContain(`href="https://enjoybook.co"`);
    expect(result).toContain(`target="_blank"`);
    expect(result).toContain(`rel="nofollow noopener noreferrer"`);
    expect(result).not.toContain("onclick=");

    // Unsafe href should be removed, and target/rel removed with it.
    expect(result).toContain("<a>bad</a>");
    expect(result).not.toContain(`javascript:`);
  });

  it("sanitizes img attributes, converts style width/height, and removes unsafe imgs", () => {
    const body = new FakeElement("body", {}, [
      new FakeElement("img", {
        src: "/safe.png",
        style: "width: 120px; height: 80px;",
        onclick: "evil()",
      }),
      new FakeElement("img", {
        src: "javascript:alert(1)",
        style: "width: 90px; height: 30px;",
      }),
    ]);
    withDomParser(body);

    const result = sanitizeUserGeneratedHtml("ignored");
    expect(result).toContain(`src="/safe.png"`);
    expect(result).toContain(`width="120"`);
    expect(result).toContain(`height="80"`);
    expect(result).not.toContain("onclick=");
    expect(result).not.toContain("javascript:");
  });
});
