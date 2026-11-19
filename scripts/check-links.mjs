// 上线前自检：node scripts/check-links.mjs
// 检查 dist/ 里所有内部链接与静态资源是否真的存在，顺带看每页有没有 title/description。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');

async function walk(dir, out) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

const { site } = await import('../site.config.mjs');
const BASE = (site.basePath || '').replace(/\/$/, '');

const files = await walk(DIST, []);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const problems = [];

const resolveTarget = (url) => {
  let clean = url.split('#')[0].split('?')[0];
  if (!clean.startsWith('/')) return null;
  if (BASE && clean.startsWith(BASE)) clean = clean.slice(BASE.length) || '/';
  if (clean === '/') return path.join(DIST, 'index.html');
  if (clean.endsWith('/')) return path.join(DIST, clean, 'index.html');
  return path.join(DIST, clean);
};

for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const rel = path.relative(DIST, file);

  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(rel + '：缺少 <title>');
  if (!/<meta name="description" content="[^"]+"/.test(html)) problems.push(rel + '：缺少 meta description');

  const urls = new Set();
  const re = /(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) urls.add(m[1]);

  for (const url of urls) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(url)) continue;
    const target = resolveTarget(url);
    if (!target) continue;
    try {
      await fs.access(target);
    } catch (err) {
      problems.push(rel + '：链接指向不存在的文件 ' + url);
    }
  }
}

if (problems.length) {
  console.error('发现 ' + problems.length + ' 个问题：');
  problems.forEach((line) => console.error('  - ' + line));
  process.exit(1);
}
console.log('自检通过：' + htmlFiles.length + ' 个页面，内部链接与静态资源全部存在。');