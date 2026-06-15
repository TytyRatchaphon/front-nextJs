const BLOCKED_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "svg",
  "math",
]);

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "div",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);

const ALLOWED_ATTRS_BY_TAG: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title", "id"]),
  img: new Set(["src", "alt", "title", "width", "height", "id"]),
  h1: new Set(["id"]),
  h2: new Set(["id"]),
  h3: new Set(["id"]),
  h4: new Set(["id"]),
  h5: new Set(["id"]),
  h6: new Set(["id"]),
  div: new Set(["id"]),
  span: new Set(["id"]),
  p: new Set(["id"]),
};

const SAFE_URL_PROTOCOL = /^(https?:\/\/|\/|#)/i;
const SAFE_IMAGE_DATA_URI = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i;

const isSafeUrl = (value: string, allowDataImage: boolean): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (SAFE_URL_PROTOCOL.test(trimmed)) return true;
  if (allowDataImage && SAFE_IMAGE_DATA_URI.test(trimmed)) return true;
  return false;
};

const sanitizeElementAttributes = (element: Element, tagName: string) => {
  const allowedAttrs = ALLOWED_ATTRS_BY_TAG[tagName] ?? new Set<string>();
  if (tagName === "img") {
    const style = element.getAttribute("style") || "";
    const widthMatch = style.match(/width\s*:\s*(\d{1,4})px/i);
    const heightMatch = style.match(/height\s*:\s*(\d{1,4})px/i);
    if (widthMatch && !element.getAttribute("width")) {
      element.setAttribute("width", widthMatch[1]);
    }
    if (heightMatch && !element.getAttribute("height")) {
      element.setAttribute("height", heightMatch[1]);
    }
  }
  const attrs = Array.from(element.attributes);

  attrs.forEach((attr) => {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (name.startsWith("on") || name === "style") {
      element.removeAttribute(attr.name);
      return;
    }

    if (!allowedAttrs.has(name)) {
      element.removeAttribute(attr.name);
      return;
    }

    if (name === "href" && !isSafeUrl(value, false)) {
      element.removeAttribute(attr.name);
      return;
    }

    if (name === "src" && !isSafeUrl(value, true)) {
      element.removeAttribute(attr.name);
      return;
    }
  });

  if (tagName === "a") {
    const href = element.getAttribute("href");
    if (!href) {
      element.removeAttribute("target");
      element.removeAttribute("rel");
      return;
    }

    if (element.getAttribute("target") === "_blank") {
      const rel = element.getAttribute("rel") || "";
      const relSet = new Set(rel.split(/\s+/).filter(Boolean));
      relSet.add("noopener");
      relSet.add("noreferrer");
      element.setAttribute("rel", Array.from(relSet).join(" "));
    }
  }

  if (tagName === "img" && !element.getAttribute("src")) {
    element.remove();
  }
};

const sanitizeWithDomParser = (input: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const allElements = Array.from(doc.body.querySelectorAll("*"));

  for (let index = allElements.length - 1; index >= 0; index -= 1) {
    const element = allElements[index];
    const tagName = element.tagName.toLowerCase();

    if (BLOCKED_TAGS.has(tagName)) {
      element.remove();
      continue;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      const parent = element.parentNode;
      if (!parent) {
        element.remove();
        continue;
      }

      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      continue;
    }

    sanitizeElementAttributes(element, tagName);
  }

  return doc.body.innerHTML;
};

const sanitizeFallback = (input: string): string => {
  return input
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|svg|math)[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s+style\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "");
};

export const sanitizeUserGeneratedHtml = (html: unknown): string => {
  if (typeof html !== "string" || !html.trim()) return "";

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    return sanitizeWithDomParser(html);
  }

  return sanitizeFallback(html);
};
