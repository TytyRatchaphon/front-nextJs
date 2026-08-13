import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

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

const parseSitemap = (page: Page, xml: string) => page.evaluate((source) => {
  const document = new DOMParser().parseFromString(source, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error("Sitemap response is not valid XML");
  }

  return {
    locations: [...document.querySelectorAll("url > loc")].map((node) => node.textContent || ""),
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

  const { locations } = await parseSitemap(page, await response.text());
  expect(locations).toEqual(expect.arrayContaining([
    "https://enjoybook.co",
    "https://enjoybook.co/faq",
  ]));
  expect(locations).not.toContain("https://enjoybook.co/article/101");
  expect(locations).not.toContain("https://enjoybook.co/cat/7");

  const diagnostic = (await readFile(diagnosticFile, "utf8")).slice(existingDiagnostic.length);
  expect(diagnostic).toContain(
    "[sitemap] Article inventory unavailable; serving static URLs only: Request failed with status code 503",
  );
  expect(diagnostic).toContain(
    "[sitemap] Category inventory unavailable; serving static URLs only: Category inventory returned no URLs",
  );
});

test("robots leads to the complete canonical root sitemap", async ({ request, page }) => {
  await setDynamicFailure(request, false);

  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.status()).toBe(200);

  const robots = await robotsResponse.text();
  const advertisedUrl = robots.match(/^Sitemap:\s*(\S+)$/im)?.[1];
  expect(advertisedUrl).toBe("https://enjoybook.co/sitemap.xml");

  const sitemapResponse = await request.get(new URL(advertisedUrl!).pathname);
  expect(sitemapResponse.status()).toBe(200);
  expect(sitemapResponse.headers()["content-type"]).toContain("application/xml");

  const sitemap = await parseSitemap(page, await sitemapResponse.text());
  const { locations } = sitemap;

  expect(locations).toEqual(expect.arrayContaining([
    "https://enjoybook.co",
    "https://enjoybook.co/faq",
    "https://enjoybook.co/about-us",
    "https://enjoybook.co/article/101",
    "https://enjoybook.co/article/102",
    "https://enjoybook.co/cat/7",
    "https://enjoybook.co/cat/8",
  ]));
  expect(locations).not.toContain("https://enjoybook.co/search");
  expect(new Set(locations).size).toBe(locations.length);
  expect(locations.every((location) => location.startsWith("https://enjoybook.co"))).toBe(true);
  expect(locations.length).toBeLessThan(50_000);

  expect(sitemap.hasPriority).toBe(false);
  expect(sitemap.hasChangeFrequency).toBe(false);
  expect(sitemap.lastModified).toEqual(expect.arrayContaining([
    "2026-08-01T00:00:00.000Z",
    "2026-08-02T00:00:00.000Z",
  ]));
});
