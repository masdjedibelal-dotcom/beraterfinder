#!/usr/bin/env node
/**
 * Extrahiert Beraterdaten aus maps_research HTML-Export
 * Unterstützt alte (keyword...) und neue (id, role, insurance_areas...) Struktur
 *
 * Aufruf: node scripts/extract-advisors.js
 * Neue Quelle: ~/Downloads/Unbenannte Tabelle (1)/maps_research_enriched.html
 * Fallback: ~/Downloads/Unbenannte Tabelle/maps_research.html
 */

const fs = require('fs');
const path = require('path');

const SOURCES = [
  path.join(process.env.HOME || '', 'Downloads/Unbenannte Tabelle (1)/maps_research_enriched.html'),
  path.join(process.env.HOME || '', 'Downloads/Unbenannte Tabelle/maps_research.html')
];
const OUT_JSON = path.join(__dirname, '../assets/data/advisors.json');

function extractText(html) {
  if (!html || !html.trim()) return '';
  const linkMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/);
  if (linkMatch) return { href: linkMatch[1].trim(), text: (linkMatch[2] || '').trim() };
  const inner = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return inner || '';
}

function toString(v) {
  if (typeof v === 'object' && v !== null) return v.text || v.href || '';
  return String(v || '').trim();
}

/** Neue enriched-Struktur: id, name, city, address, role, role_label, insurance_areas, ..., place_id */
function parseRowEnriched(trHtml) {
  const cells = [];
  const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let m;
  while ((m = tdRegex.exec(trHtml)) !== null) cells.push(m[1]);
  if (cells.length < 18) return null; // th + A..Q = 18
  const d = cells.slice(1, 18);

  const id = toString(extractText(d[0]));
  const name = toString(extractText(d[1]));
  const city = toString(extractText(d[2]));
  const address = toString(extractText(d[3]));
  const role = toString(extractText(d[4]));
  const roleLabel = toString(extractText(d[5]));
  let insuranceAreas = toString(extractText(d[6]));
  if (insuranceAreas) insuranceAreas = insuranceAreas.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  const websiteEl = extractText(d[8]);
  const phone = toString(extractText(d[9]));
  const rating = toString(extractText(d[10]));
  const ratingCount = toString(extractText(d[11]));
  const mapsEl = extractText(d[12]);
  const placeId = toString(extractText(d[13]));
  const source = toString(extractText(d[14]));

  if (id === 'id' && name === 'name') return null;
  if (/^[A-Z]$/i.test(id)) return null; // thead column letters
  if (!name) return null;

  return {
    id: id || undefined,
    keyword: role || 'Beratung',
    role,
    role_label: roleLabel || undefined,
    insurance_areas: insuranceAreas || undefined,
    city,
    name,
    address,
    website: typeof websiteEl === 'object' ? websiteEl.href : websiteEl,
    phone,
    google_maps_url: typeof mapsEl === 'object' ? mapsEl.href : mapsEl,
    rating,
    rating_count: ratingCount,
    place_id: placeId,
    source
  };
}

/** Alte Struktur: keyword, city, name, address, website, phone, ... */
function parseRowLegacy(trHtml) {
  const cells = [];
  const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let m;
  while ((m = tdRegex.exec(trHtml)) !== null) cells.push(m[1]);
  if (cells.length < 12) return null;
  const data = cells.slice(1, 12);

  const keyword = toString(extractText(data[0]));
  const city = toString(extractText(data[1]));
  const name = toString(extractText(data[2]));
  const address = toString(extractText(data[3]));
  const websiteEl = extractText(data[4]);
  const phone = toString(extractText(data[5]));
  const mapsEl = extractText(data[6]);
  const rating = toString(extractText(data[7]));
  const ratingCount = toString(extractText(data[8]));
  const placeId = toString(extractText(data[9]));
  const source = toString(extractText(data[10]));

  if (keyword === 'keyword' && city === 'city') return null;
  if (/^[A-Z]$/i.test(keyword) && /^[A-Z]$/i.test(city)) return null;
  if (!name) return null;

  return {
    keyword,
    city,
    name,
    address,
    website: typeof websiteEl === 'object' ? websiteEl.href : websiteEl,
    phone,
    google_maps_url: typeof mapsEl === 'object' ? mapsEl.href : mapsEl,
    rating,
    rating_count: ratingCount,
    place_id: placeId,
    source
  };
}

function detectFormat(html) {
  const trs = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (let i = 0; i < Math.min(5, trs.length); i++) {
    const cells = [];
    const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let m;
    while ((m = tdRe.exec(trs[i])) !== null) cells.push(m[1]);
    const first = (cells[1] || '').replace(/<[^>]+>/g, ' ').trim();
    if (/^[a-f0-9-]{36}$/i.test(first)) return 'enriched';
  }
  return 'legacy';
}

function main() {
  let SOURCE = SOURCES.find(p => fs.existsSync(p));
  if (!SOURCE) {
    console.error('Keine Quelldatei gefunden. Gesucht in:', SOURCES);
    process.exit(1);
  }

  const html = fs.readFileSync(SOURCE, 'utf8');
  const format = detectFormat(html);
  console.log('Quelle:', SOURCE);
  console.log('Format:', format);

  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const advisors = [];
  let m;
  const parseRow = format === 'enriched' ? parseRowEnriched : parseRowLegacy;
  while ((m = trRegex.exec(html)) !== null) {
    const row = parseRow(m[0]);
    if (row) advisors.push(row);
  }

  const outDir = path.dirname(OUT_JSON);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(advisors, null, 2), 'utf8');

  const OUT_BERATER = path.join(__dirname, '../assets/js/berater.js');
  fs.writeFileSync(OUT_BERATER, 'const ADVISORS_DATA = ' + JSON.stringify(advisors) + ';\nwindow.ADVISORS_DATA = ADVISORS_DATA;\n', 'utf8');

  const sample = advisors[0];
  const newFields = sample?.role_label ? ` role, role_label, insurance_areas` : '';
  console.log('Exportiert:', advisors.length, 'Berater →', OUT_JSON, ', berater.js');
  if (newFields) console.log('Neue Felder:', newFields.trim());
}

main();
