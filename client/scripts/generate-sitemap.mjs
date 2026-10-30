import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tools } from '../src/services/toolDefinitions.js';

const siteOrigin = 'https://ialksng.me/work/projects/filewiz/app';
const typeForCategory = { PDF: 'pdf', Image: 'image', Utilities: 'utility' };
const canonicalPathFor = (tool) => tool.category === 'Convert'
  ? `/convert/${tool.id}`
  : `/tools/${typeForCategory[tool.category]}/${tool.engine || tool.id}`;
const staticPaths = [
  '/',
  '/pricing',
  '/tools',
  '/tools/pdf',
  '/tools/image',
  '/tools/utility',
  '/tools/convert',
  '/tools/word',
  '/tools/excel',
  '/tools/ppt',
  '/convert',
  '/privacy',
  '/terms',
];
const sitemapPaths = [...staticPaths, ...tools.map(canonicalPathFor)];
const supportedAliases = [
  ['/tools/pdf/organize-pdf', '/tools/pdf/reorder-pdf'],
  ['/tools/pdf/extract-pages', '/tools/pdf/split-pdf'],
  ['/tools/pdf/jpg-to-pdf', '/tools/pdf/images-to-pdf'],
  ['/tools/image/jpg-to-png', '/tools/image/convert-image'],
  ['/tools/image/png-to-jpg', '/tools/image/convert-image'],
  ['/tools/image/webp-to-png', '/tools/image/convert-image'],
  ['/tools/image/favicon-generator', '/tools/image/create-favicon'],
  ['/tools/utility/character-counter', '/tools/utility/word-counter'],
  ['/tools/utility/json-validator', '/tools/utility/json-formatter'],
  ['/tools/utility/base64-encode', '/tools/utility/base64-converter'],
  ['/tools/utility/base64-decode', '/tools/utility/base64-converter'],
  ['/tools/utility/uuid-generator', '/tools/utility/password-generator'],
  ['/tools/utility/qr-code', '/tools/utility/qr-generator'],
  ['/utility/word-to-powerpoint', '/convert/word-to-powerpoint'],
  ['/tools/utility/word-to-powerpoint', '/convert/word-to-powerpoint'],
  ['/utility/csv-to-excel', '/convert/csv-to-excel'],
  ['/tools/utility/csv-to-excel', '/convert/csv-to-excel'],
  ['/utility/excel-to-csv', '/convert/excel-to-csv'],
  ['/tools/utility/excel-to-csv', '/convert/excel-to-csv'],
  ['/convert/srt-vtt', '/convert/srt-vtt-converter'],
  ['/convert/csv-tsv', '/convert/csv-tsv-converter'],
  ['/convert/xml-json', '/convert/xml-json-converter'],
];

if (new Set(sitemapPaths).size !== sitemapPaths.length) {
  throw new Error('Sitemap paths must be unique.');
}

const locations = sitemapPaths.map((path) => {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`Invalid sitemap path: ${path}`);
  }
  return `${siteOrigin}${path === '/' ? '/' : path}`;
});

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...locations.map((location) => `  <url><loc>${escapeXml(location)}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

await writeFile(resolve('public/sitemap.xml'), xml, 'utf8');

