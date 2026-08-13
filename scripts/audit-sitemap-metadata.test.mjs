import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';

let server;
let origin;
let scenario = 'complete';

const sitemapXml = (locations) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locations.map((location) => `<url><loc>${location.replaceAll('&', '&amp;')}</loc></url>`).join('\n')}
</urlset>`;

const completeLocations = () => [
  origin,
  `${origin}/article/1`,
  `${origin}/cat/1`,
  `${origin}/book/1`,
  `${origin}/wprofile/1`,
];

const runAudit = (...args) => new Promise((resolve) => {
  const child = spawn(process.execPath, [
    'scripts/audit-sitemap-metadata.mjs',
    `--base-url=${origin}`,
    '--full',
    ...args,
  ], { cwd: process.cwd() });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('close', (code) => resolve({ code, stdout, stderr }));
});

before(async () => {
  server = createServer((request, response) => {
    const url = new URL(request.url, origin || 'http://127.0.0.1');
    if (url.pathname === '/robots.txt') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      const sitemapPath = scenario === 'obsolete-sitemap-path' ? '/sitemap/0.xml' : '/sitemap.xml';
      response.end(`User-agent: *\nSitemap: ${origin}${sitemapPath}\n`);
      return;
    }

    if (url.pathname === '/sitemap.xml' || url.pathname === '/sitemap/0.xml') {
      if (scenario === 'sitemap-404') {
        response.writeHead(404).end('missing');
        return;
      }
      response.writeHead(200, {
        'content-type': scenario === 'wrong-content-type' ? 'text/html' : 'application/xml',
      });
      if (scenario === 'empty') response.end(sitemapXml([]));
      else if (scenario === 'malformed') response.end('<urlset><url><loc>broken</urlset>');
      else if (scenario === 'malformed-entity') {
        response.end(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/book/1?left=1&right=2</loc></url></urlset>`);
      }
      else if (scenario === 'missing-namespace') response.end(sitemapXml(completeLocations()).replace(' xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', ''));
      else if (scenario === 'invalid-url-entry') {
        response.end(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}</loc><loc>${origin}/book/1</loc></url><url></url></urlset>`);
      }
      else if (scenario === 'multiple-roots') response.end(`<ignored></ignored>${sitemapXml(completeLocations())}`);
      else if (scenario === 'duplicate') response.end(sitemapXml([...completeLocations(), origin]));
      else if (scenario === 'cross-origin') response.end(sitemapXml([...completeLocations(), 'https://evil.example/page']));
      else if (scenario === 'url-limit') {
        response.end(sitemapXml(Array.from({ length: 50_000 }, (_, index) => `${origin}/book/${index + 1}`)));
      }
      else if (scenario === 'degraded') response.end(sitemapXml([origin]));
      else if (scenario === 'bad-page') response.end(sitemapXml([...completeLocations(), `${origin}/redirected`, `${origin}/noindex`, `${origin}/wrong-canonical`, `${origin}/missing`]));
      else response.end(sitemapXml(completeLocations()));
      return;
    }

    if (url.pathname === '/redirected') {
      response.writeHead(308, { location: '/' }).end();
      return;
    }
    if (url.pathname === '/missing') {
      response.writeHead(404).end('missing');
      return;
    }

    const robots = url.pathname === '/noindex' ? '<meta name="robots" content="noindex,follow">' : '';
    const canonical = url.pathname === '/wrong-canonical' ? origin : `${origin}${url.pathname === '/' ? '' : url.pathname}`;
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(`<html><head>${robots}<link rel="canonical" href="${canonical}"></head></html>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('passes the robots-advertised complete sitemap and recognizes the homepage', async () => {
  scenario = 'complete';
  const result = await runAudit();
  assert.equal(result.code, 0);
  assert.match(result.stdout, /COMPLETE COVERAGE/);
  assert.doesNotMatch(result.stderr, /homepage|missing canonical/);
});

for (const [name, expected] of [
  ['sitemap-404', /advertised sitemap returned HTTP 404/],
  ['empty', /advertised sitemap is empty/],
  ['malformed', /advertised sitemap is malformed/],
  ['malformed-entity', /advertised sitemap is malformed/],
  ['missing-namespace', /advertised sitemap is malformed/],
  ['invalid-url-entry', /exactly one loc/],
  ['multiple-roots', /advertised sitemap is malformed/],
  ['obsolete-sitemap-path', /must advertise .*\/sitemap\.xml/],
  ['wrong-content-type', /advertised sitemap content type/],
  ['duplicate', /duplicate sitemap location/],
  ['cross-origin', /cross-origin sitemap location/],
  ['url-limit', /must stay below 50000/],
]) {
  test(`fails hard for ${name}`, async () => {
    scenario = name;
    const result = await runAudit();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /HARD PROTOCOL FAILURE/);
    assert.match(result.stderr, expected);
  });
}

test('distinguishes degraded dynamic coverage', async () => {
  scenario = 'degraded';
  const result = await runAudit();
  assert.equal(result.code, 1);
  assert.match(result.stderr, /DEGRADED DYNAMIC-SOURCE COVERAGE/);
  assert.match(result.stderr, /missing dynamic route families/);
});

test('reports redirected, noindexed, non-canonical, and non-200 entries', async () => {
  scenario = 'bad-page';
  const result = await runAudit();
  assert.equal(result.code, 1);
  assert.match(result.stderr, /redirected: HTTP 308/);
  assert.match(result.stderr, /noindex: noindex/);
  assert.match(result.stderr, /wrong-canonical: non-canonical/);
  assert.match(result.stderr, /missing: HTTP 404/);
});
