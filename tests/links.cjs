'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const pages = [path.join(root, 'index.html'), ...fs.readdirSync(path.join(root, 'produto'))
  .filter(name => name.endsWith('.html')).map(name => path.join(root, 'produto', name))];
const attrRe = /(?:^|\s)(src|href|srcset|imagesrcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const broken = [];
let localUrls = 0;
function htmlDecode(value) { return value.replace(/&amp;/gi, '&').replace(/&#x2f;/gi, '/').replace(/&#47;/g, '/'); }
function candidates(value, isSet) {
  value = htmlDecode(value.trim());
  if (!isSet) return [value];
  return value.split(',').map(part => part.trim().split(/\s+/)[0]).filter(Boolean);
}
function check(page, attr, value, isSet) {
  for (let url of candidates(value, isSet)) {
    url = url.trim();
    if (!url || /^(?:https?:)?\/\//i.test(url) || /^(?:#|mailto:|tel:|javascript:|data:|blob:)/i.test(url)) continue;
    const localPath = url.split(/[?#]/, 1)[0];
    if (!localPath) continue;
    let decoded = localPath;
    try { decoded = decodeURIComponent(localPath); } catch {}
    const target = decoded.startsWith('/') || decoded.startsWith('\\')
      ? path.resolve(root, decoded.replace(/^[/\\]+/, ''))
      : path.resolve(path.dirname(page), decoded);
    localUrls++;
    if (!fs.existsSync(target)) broken.push({ page: path.relative(root, page), attr, url, target: path.relative(root, target) });
  }
}
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  for (const tag of html.matchAll(/<[a-z][^>]*>/gi)) {
    attrRe.lastIndex = 0;
    for (const a of tag[0].matchAll(attrRe)) {
      const name = a[1].toLowerCase();
      const value = a[2] ?? a[3] ?? a[4] ?? '';
      check(page, name, value, name === 'srcset' || name === 'imagesrcset');
    }
  }
  // The home page builds its preload link in an inline script.
  for (const a of html.matchAll(/setAttribute\(\s*['"]imagesrcset['"]\s*,\s*(['"])(.*?)\1\s*\)/gi)) {
    check(page, 'imagesrcset', a[2], true);
  }
}
if (broken.length) {
  console.error(`${broken.length} caminho(s) local(is) quebrado(s):`);
  for (const item of broken) console.error(`  ${item.page} [${item.attr}] ${item.url} -> ${item.target}`);
  process.exit(1);
}
console.log(`${localUrls} caminho(s) local(is) conferido(s); 0 quebrados em ${pages.length} páginas.`);
