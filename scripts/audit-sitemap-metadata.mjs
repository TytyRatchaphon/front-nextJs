#!/usr/bin/env node

const SITEMAP_URL_LIMIT = 50_000;
const DYNAMIC_ROUTE_PATTERNS = {
  articles: /^\/article\/\d+$/,
  books: /^\/book\/\d+$/,
  categories: /^\/cat\/\d+$/,
  writers: /^\/wprofile\/\d+$/,
};

const args = process.argv.slice(2);
const option = (name) => args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
const baseUrlValue = option('--base-url') || process.env.SITEMAP_AUDIT_BASE_URL;
const fullCheck = args.includes('--full');
const sampleSize = Number(option('--sample-size') || 25);

if (!baseUrlValue) {
  console.error('HARD PROTOCOL FAILURE: provide --base-url=https://example.com or SITEMAP_AUDIT_BASE_URL');
  process.exit(2);
}

const baseUrl = new URL(baseUrlValue);
const baseOrigin = baseUrl.origin;
const isLocalOrigin = ['localhost', '127.0.0.1', '::1'].includes(baseUrl.hostname);
const hardFailures = [];
const coverageFailures = [];

const normalizeUrl = (value) => {
  const url = new URL(value);
  url.hash = '';
  return url.pathname === '/' && !url.search
    ? url.origin
    : url.toString().replace(/\/$/, '');
};

const decodeXml = (value) => value
  .replace(/&#x([\dA-F]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'");

const assertWellFormedXml = (xml) => {
  const withoutDeclarations = xml
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const tokens = [...withoutDeclarations.matchAll(/<\/?([A-Za-z_][\w:.-]*)(?:\s[^<>]*?)?\s*\/?>/g)];
  const markupOnly = withoutDeclarations.replace(/<\/?([A-Za-z_][\w:.-]*)(?:\s[^<>]*?)?\s*\/?>/g, '');
  if (markupOnly.includes('<') || markupOnly.includes('>')) throw new Error('malformed XML markup');
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\dA-F]+;)/i.test(xml)) {
    throw new Error('invalid XML entity');
  }

  const stack = [];
  for (const token of tokens) {
    const raw = token[0];
    const name = token[1];
    if (raw.startsWith('</')) {
      if (stack.pop() !== name) throw new Error(`mismatched closing tag ${name}`);
    } else if (!raw.endsWith('/>')) {
      stack.push(name);
    }
  }
  if (stack.length > 0) throw new Error(`unclosed tag ${stack.at(-1)}`);
};

const parseSitemapLocations = (xml) => {
  assertWellFormedXml(xml);
  const documentWithoutPreamble = xml
    .replace(/^\s*<\?[\s\S]*?\?>\s*/, '')
    .replace(/^\s*<!--[\s\S]*?-->\s*/, '')
    .trim();
  if (!/^<urlset(?:\s[^>]*)?>[\s\S]*<\/urlset>$/i.test(documentWithoutPreamble)) {
    throw new Error('root element is not urlset');
  }
  const rootTag = documentWithoutPreamble.match(/^<urlset(?:\s[^>]*)?>/i)?.[0] || '';
  if (!/\sxmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/i.test(rootTag)) {
    throw new Error('urlset has no sitemap namespace');
  }

  const urlEntries = [...xml.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/gi)];
  return urlEntries.map((entry) => {
    const locations = [...entry[1].matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)];
    if (locations.length !== 1) throw new Error('every url entry must contain exactly one loc');
    return decodeXml(locations[0][1].trim());
  });
};

const extractSitemapUrl = (robotsText) => robotsText
  .match(/^Sitemap:\s*(\S+)\s*$/im)?.[1];

const parseHtmlAttributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)]
    .map((match) => [match[1].toLowerCase(), match[2]]),
);

const inspectPage = async (location) => {
  const response = await fetch(location, { redirect: 'manual' });
  if (response.status !== 200) return `HTTP ${response.status}`;

  const html = await response.text();
  const xRobotsTag = response.headers.get('x-robots-tag') || '';
  const metaRobots = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => parseHtmlAttributes(match[0]))
    .filter((attrs) => ['robots', 'googlebot'].includes((attrs.name || '').toLowerCase()))
    .map((attrs) => attrs.content || '')
    .join(',');
  if (/\bnoindex\b/i.test(`${xRobotsTag},${metaRobots}`)) return 'noindex';

  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => parseHtmlAttributes(match[0]))
    .find((attrs) => (attrs.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
  if (!canonicalTag?.href) return 'missing canonical';

  const canonical = normalizeUrl(new URL(canonicalTag.href, location).toString());
  if (canonical !== normalizeUrl(location)) return `non-canonical (${canonical})`;
  return null;
};

const audit = async () => {
  const robotsUrl = new URL('/robots.txt', baseOrigin);
  const robotsResponse = await fetch(robotsUrl, { redirect: 'manual' });
  if (robotsResponse.status !== 200) {
    hardFailures.push(`robots.txt returned HTTP ${robotsResponse.status}`);
    return;
  }

  const advertisedValue = extractSitemapUrl(await robotsResponse.text());
  if (!advertisedValue) {
    hardFailures.push('robots.txt does not advertise a sitemap');
    return;
  }

  const sitemapUrl = new URL(advertisedValue, baseOrigin);
  if (sitemapUrl.origin !== baseOrigin) {
    hardFailures.push(`robots.txt advertises a cross-origin sitemap: ${sitemapUrl}`);
    return;
  }
  const requiredSitemapUrl = new URL('/sitemap.xml', baseOrigin);
  if (sitemapUrl.toString() !== requiredSitemapUrl.toString()) {
    hardFailures.push(`robots.txt must advertise ${requiredSitemapUrl}, received ${sitemapUrl}`);
    return;
  }

  const sitemapResponse = await fetch(sitemapUrl, { redirect: 'manual' });
  if (sitemapResponse.status !== 200) {
    hardFailures.push(`advertised sitemap returned HTTP ${sitemapResponse.status}`);
    return;
  }
  const sitemapContentType = sitemapResponse.headers.get('content-type') || '';
  if (!/^(?:application|text)\/xml(?:\s*;|$)/i.test(sitemapContentType)) {
    hardFailures.push(`advertised sitemap content type is not XML: ${sitemapContentType || '(missing)'}`);
    return;
  }

  let locations;
  try {
    locations = parseSitemapLocations(await sitemapResponse.text());
  } catch (error) {
    hardFailures.push(`advertised sitemap is malformed: ${error.message}`);
    return;
  }

  if (locations.length === 0) hardFailures.push('advertised sitemap is empty');
  if (locations.length >= SITEMAP_URL_LIMIT) {
    hardFailures.push(`sitemap has ${locations.length} URLs; it must stay below ${SITEMAP_URL_LIMIT}`);
  }

  const normalizedLocations = [];
  for (const location of locations) {
    try {
      const parsed = new URL(location);
      if (!isLocalOrigin && parsed.protocol !== 'https:') {
        hardFailures.push(`non-HTTPS sitemap location: ${location}`);
      }
      if (parsed.origin !== baseOrigin) hardFailures.push(`cross-origin sitemap location: ${location}`);
      normalizedLocations.push(normalizeUrl(location));
    } catch {
      hardFailures.push(`invalid sitemap location: ${location}`);
    }
  }

  const duplicates = normalizedLocations.filter((location, index) => normalizedLocations.indexOf(location) !== index);
  if (duplicates.length > 0) hardFailures.push(`duplicate sitemap location: ${duplicates[0]}`);
  if (hardFailures.length > 0) return;

  const routeFamilies = Object.entries(DYNAMIC_ROUTE_PATTERNS)
    .filter(([, pattern]) => normalizedLocations.some((location) => pattern.test(new URL(location).pathname)))
    .map(([family]) => family);
  const missingFamilies = Object.keys(DYNAMIC_ROUTE_PATTERNS).filter((family) => !routeFamilies.includes(family));
  if (missingFamilies.length > 0) {
    coverageFailures.push(`missing dynamic route families: ${missingFamilies.join(', ')}`);
  }

  const locationsToCheck = fullCheck
    ? normalizedLocations
    : normalizedLocations.slice(0, Number.isFinite(sampleSize) && sampleSize > 0 ? sampleSize : 25);
  for (const location of locationsToCheck) {
    const issue = await inspectPage(location);
    if (issue) coverageFailures.push(`${location}: ${issue}`);
  }

  console.log(`robots: ${robotsUrl}`);
  console.log(`sitemap: ${sitemapUrl}`);
  console.log(`URLs: ${normalizedLocations.length}; checked pages: ${locationsToCheck.length}`);
};

try {
  await audit();
} catch (error) {
  hardFailures.push(`audit request failed: ${error.message}`);
}

const exitWithFailures = (heading, failures) => {
  if (failures.length === 0) return;
  console.error(heading);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
};

exitWithFailures('HARD PROTOCOL FAILURE', hardFailures);
exitWithFailures('DEGRADED DYNAMIC-SOURCE COVERAGE', coverageFailures);

console.log('COMPLETE COVERAGE');
