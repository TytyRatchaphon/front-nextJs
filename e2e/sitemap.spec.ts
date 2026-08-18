import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const writerProfileLocations = [
  46404, 71792, 68444, 55, 17578, 61815, 46403, 8321, 28094,
  23208, 23031, 23207, 24208, 17966, 53, 16113, 23206,
].map((writerId) => `https://enjoybook.co/wprofile/${writerId}`);

const staticLocations = [
  "https://enjoybook.co",
  "https://enjoybook.co/faq",
  "https://enjoybook.co/about-us",
  "https://enjoybook.co/article",
  "https://enjoybook.co/campaign",
  "https://enjoybook.co/ranking",
  "https://enjoybook.co/how-payment",
  "https://enjoybook.co/writer-nc-policy",
  "https://enjoybook.co/events",
  "https://enjoybook.co/news",
  "https://enjoybook.co/novel-pack",
  "https://enjoybook.co/fiction-novel",
  "https://enjoybook.co/translated-novel",
  "https://enjoybook.co/book-updates",
];

const setDynamicFailure = async (
  request: APIRequestContext,
  enabled: boolean,
) => {
  const apiPort = process.env.SITEMAP_API_PORT || "3101";
  const response = await request.post(
    `http://127.0.0.1:${apiPort}/__control/dynamic-failure?enabled=${enabled}`,
  );
  expect(response.status()).toBe(200);
};

const setFailedBookPage = async (
  request: APIRequestContext,
  page?: number,
) => {
  const apiPort = process.env.SITEMAP_API_PORT || "3101";
  const response = await request.post(
    `http://127.0.0.1:${apiPort}/__control/book-page-failure?page=${page ?? 0}`,
  );
  expect(response.status()).toBe(200);
};

const parseSitemap = (page: Page, xml: string) => page.evaluate((source) => {
  const document = new DOMParser().parseFromString(source, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error("Sitemap response is not valid XML");
  }

  return {
    entries: [...document.querySelectorAll("url")].map((node) => ({
      location: node.querySelector("loc")?.textContent || "",
      lastModified: node.querySelector("lastmod")?.textContent,
    })),
    lastModified: [...document.querySelectorAll("url > lastmod")].map((node) => node.textContent || ""),
    hasPriority: document.querySelector("priority") !== null,
    hasChangeFrequency: document.querySelector("changefreq") !== null,
  };
}, xml);

test("sitemap remains valid with static URLs during a cold dynamic-source failure", async ({ request, page }) => {
  const diagnosticFile = process.env.SITEMAP_DIAGNOSTIC_FILE!;
  const existingDiagnostic = await readFile(diagnosticFile, "utf8").catch(() => "");
  await setDynamicFailure(request, true);

  const response = await request.get("/sitemap.xml?cold-dynamic-failure=true");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/xml");

  const { entries } = await parseSitemap(page, await response.text());
  const locations = entries.map((entry) => entry.location);
  expect(locations.slice(0, staticLocations.length)).toEqual(staticLocations);
  expect(locations).not.toContain("https://enjoybook.co/article/101");
  expect(locations).not.toContain("https://enjoybook.co/cat/7");
  expect(locations).not.toContain("https://enjoybook.co/book/201");
  expect(locations).toEqual(expect.arrayContaining(writerProfileLocations));
  expect(locations).not.toContain("https://enjoybook.co/wprofile/31");

  const diagnostic = (await readFile(diagnosticFile, "utf8")).slice(existingDiagnostic.length);
  expect(diagnostic).toContain(
    "[sitemap] Article inventory unavailable; serving static URLs only: Request failed with status code 503",
  );
  expect(diagnostic).toContain(
    "[sitemap] Category inventory unavailable; serving static URLs only: Category inventory returned no URLs",
  );
  expect(diagnostic).toContain(
    "[sitemap] Published-book inventory unavailable; serving static URLs only: Request failed with status code 503",
  );
});

test("a later published-book page failure cannot expose or cache a partial catalog", async ({ request, page }) => {
  const diagnosticFile = process.env.SITEMAP_DIAGNOSTIC_FILE!;
  const existingDiagnostic = await readFile(diagnosticFile, "utf8").catch(() => "");
  await setDynamicFailure(request, false);
  await setFailedBookPage(request, 2);

  const response = await request.get("/sitemap.xml?book-page-2-failure=true");
  expect(response.status()).toBe(200);

  const { entries } = await parseSitemap(page, await response.text());
  const locations = entries.map((entry) => entry.location);
  expect(locations).toContain("https://enjoybook.co/article/101");
  expect(locations).not.toContain("https://enjoybook.co/book/201");
  expect(locations).toEqual(expect.arrayContaining(writerProfileLocations));
  expect(locations).not.toContain("https://enjoybook.co/wprofile/31");

  const diagnostic = (await readFile(diagnosticFile, "utf8")).slice(existingDiagnostic.length);
  expect(diagnostic).toContain(
    "[sitemap] Published-book inventory unavailable; serving static URLs only: Request failed with status code 503",
  );
});

test("robots leads to the complete canonical root sitemap", async ({ request, page }) => {
  await setDynamicFailure(request, false);
  await setFailedBookPage(request);

  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.status()).toBe(200);

  const robots = await robotsResponse.text();
  const advertisedUrl = robots.match(/^Sitemap:\s*(\S+)$/im)?.[1];
  expect(advertisedUrl).toBe("https://enjoybook.co/sitemap.xml");

  const sitemapResponse = await request.get(new URL(advertisedUrl!).pathname);
  expect(sitemapResponse.status()).toBe(200);
  expect(sitemapResponse.headers()["content-type"]).toContain("application/xml");

  const sitemap = await parseSitemap(page, await sitemapResponse.text());
  const locations = sitemap.entries.map((entry) => entry.location);

  expect(locations.slice(0, staticLocations.length)).toEqual(staticLocations);
  expect(locations).toEqual(expect.arrayContaining([
    "https://enjoybook.co/article/101",
    "https://enjoybook.co/article/102",
    "https://enjoybook.co/cat/7",
    "https://enjoybook.co/cat/8",
    "https://enjoybook.co/book/201",
    "https://enjoybook.co/book/202",
    "https://enjoybook.co/book/205",
    ...writerProfileLocations,
  ]));
  expect(locations).not.toEqual(expect.arrayContaining([
    "https://enjoybook.co/search",
    "https://enjoybook.co/policy-conditions",
    "https://enjoybook.co/policy-privacy",
    "https://enjoybook.co/other-policy",
    "https://enjoybook.co/contact",
    "https://enjoybook.co/store",
    "https://enjoybook.co/howto/regis",
    "https://enjoybook.co/howto/howincome",
    "https://enjoybook.co/howto/howwithdraw",
    "https://enjoybook.co/howto/novelevent",
    "https://enjoybook.co/campaign-discount",
  ]));
  expect(new Set(locations).size).toBe(locations.length);
  expect(locations.every((location) => location.startsWith("https://enjoybook.co"))).toBe(true);
  expect(locations.length).toBeLessThan(50_000);
  expect(locations).not.toEqual(expect.arrayContaining([
    "https://enjoybook.co/book/203",
    "https://enjoybook.co/book/204",
    "https://enjoybook.co/book/bad",
    "https://enjoybook.co/wprofile/33",
  ]));

  expect(sitemap.hasPriority).toBe(false);
  expect(sitemap.hasChangeFrequency).toBe(false);
  expect(sitemap.lastModified).toEqual(expect.arrayContaining([
    "2026-08-01T00:00:00.000Z",
    "2026-08-02T00:00:00.000Z",
    "2026-07-01T00:00:00.000Z",
  ]));
  expect(sitemap.entries.find((entry) => entry.location === "https://enjoybook.co/book/201")?.lastModified)
    .toBe("2026-07-01T00:00:00.000Z");
  expect(sitemap.entries.find((entry) => entry.location === "https://enjoybook.co/book/202")?.lastModified)
    .toBeUndefined();
  expect(locations.filter((location) => location.startsWith("https://enjoybook.co/wprofile/")))
    .toEqual(writerProfileLocations);
});
