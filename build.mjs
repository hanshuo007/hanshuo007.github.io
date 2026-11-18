// 构建：node build.mjs —— 把 content/ 里的 Markdown 数据变成 dist/ 里的静态站。
// 零第三方依赖，Node 18+ 就能跑。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { site, contact, nav } from './site.config.mjs';
import { renderMarkdown, escapeHtml } from './src/markdown.mjs';
import { logoFile } from './src/brand.mjs';
import {
  renderHome,
  renderFaq,
  renderAsk,
  renderResources,
  renderNewsList,
  renderNewsPost,
  renderAbout,
  renderNotFound,
} from './src/templates.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');

const p = (...parts) => path.join(...parts);

async function readText(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    return null;
  }
}

async function listMarkdown(dir) {
  let names = [];
  try {
    names = await fs.readdir(dir);
  } catch (err) {
    return [];
  }
  return names.filter((name) => name.endsWith('.md')).sort();
}

function parseFrontMatter(raw) {
  const text = String(raw).replace(/\r\n?/g, '\n');
  if (!text.startsWith('---\n')) return { data: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: text };
  const head = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n+/, '');
  const data = {};
  head.split('\n').forEach((line) => {
    const matched = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!matched) return;
    const key = matched[1];
    const raw = matched[2].trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[key] = raw
        .slice(1, -1)
        .split(',')
        .map((part) => part.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      data[key] = raw.replace(/^["']|["']$/g, '');
    }
  });
  return { data, body };
}

function formatDate(dateISO) {
  const [y, m, d] = dateISO.split('-');
  if (!y || !m || !d) return dateISO;
  return y + ' 年 ' + Number(m) + ' 月 ' + Number(d) + ' 日';
}

const slugify = (text) =>
  String(text)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'item';

// ---------- 内容加载 ----------
async function loadNews() {
  const dir = p(CONTENT, 'news');
  const files = await listMarkdown(dir);
  const posts = [];
  for (const file of files) {
    const raw = await readText(p(dir, file));
    if (!raw) continue;
    const { data, body } = parseFrontMatter(raw);
    const dateISO = data.date || '1970-01-01';
    posts.push({
      slug: file.replace(/\.md$/, ''),
      title: data.title || file.replace(/\.md$/, ''),
      dateISO,
      dateText: formatDate(dateISO),
      dateShort: dateISO.replace(/-/g, '.'),
      summary: data.summary || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      html: renderMarkdown(body),
    });
  }
  posts.sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0));
  return posts;
}

async function loadFaq() {
  const dir = p(CONTENT, 'faq');
  const files = await listMarkdown(dir);
  const groups = [];
  for (const file of files) {
    const raw = await readText(p(dir, file));
    if (!raw) continue;
    const { data, body } = parseFrontMatter(raw);
    const category = data.category || file.replace(/\.md$/, '');
    const order = Number(data.order) || 99;
    const items = [];
    body
      .split(/\n(?=### )/)
      .forEach((chunk) => {
        const matched = chunk.match(/^###\s+(.+?)\n([\s\S]*)$/);
        if (!matched) return;
        items.push({ q: matched[1].trim(), html: renderMarkdown(matched[2].trim()) });
      });
    groups.push({ category, order, slug: 'cat-' + order, items });
  }
  groups.sort((a, b) => a.order - b.order);
  return groups;
}

async function loadResources() {
  const file = p(CONTENT, 'resources.json');
  const raw = await readText(file);
  if (!raw) return [];
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error('content/resources.json 不是合法 JSON：' + err.message);
  }
  const categories = Array.isArray(data.categories) ? data.categories : [];
  return categories
    .map((group, index) => ({
      category: group.name || '资料',
      slug: 'res-' + (index + 1),
      items: Array.isArray(group.items) ? group.items : [],
    }))
    .filter((group) => group.items.length > 0);
}

async function loadAbout() {
  const raw = await readText(p(CONTENT, 'about.md'));
  if (!raw) return '<p>关于页还在写。</p>';
  return renderMarkdown(raw);
}

// ---------- 输出工具 ----------
async function writePage(route, html) {
  const isFile = route.endsWith('.html');
  const target = isFile ? p(DIST, route) : p(DIST, route, 'index.html');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, html, 'utf8');
}

async function copyDir(from, to) {
  let entries = [];
  try {
    entries = await fs.readdir(from, { withFileTypes: true });
  } catch (err) {
    return;
  }
  await fs.mkdir(to, { recursive: true });
  for (const entry of entries) {
    const src = p(from, entry.name);
    const dest = p(to, entry.name);
    if (entry.isDirectory()) {
      await copyDir(src, dest);
    } else {
      await fs.copyFile(src, dest);
    }
  }
}

function xmlEscape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rssFeed(posts, build) {
  const items = posts
    .map((post) => {
      const url = site.url + '/news/' + post.slug + '/';
      const pub = new Date(post.dateISO + 'T09:00:00Z').toUTCString();
      return (
        '    <item>\n' +
        '      <title>' + xmlEscape(post.title) + '</title>\n' +
        '      <link>' + xmlEscape(url) + '</link>\n' +
        '      <guid isPermaLink="true">' + xmlEscape(url) + '</guid>\n' +
        '      <pubDate>' + pub + '</pubDate>\n' +
        '      <description>' + xmlEscape(post.summary || post.title) + '</description>\n' +
        post.tags
          .map((tag) => '      <category>' + xmlEscape(tag) + '</category>\n')
          .join('') +
        '    </item>\n'
      );
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    '  <channel>\n' +
    '    <title>' + xmlEscape(site.team + ' · 公告') + '</title>\n' +
    '    <link>' + xmlEscape(site.url + '/news/') + '</link>\n' +
    '    <atom:link href="' + xmlEscape(site.url + '/rss.xml') + '" rel="self" type="application/rss+xml"/>\n' +
    '    <description>' + xmlEscape(site.description) + '</description>\n' +
    '    <language>zh-cn</language>\n' +
    '    <lastBuildDate>' + build.date.toUTCString() + '</lastBuildDate>\n' +
    items +
    '  </channel>\n' +
    '</rss>\n'
  );
}

function sitemap(routes, build) {
  const lastmod = build.isoDate;
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes
      .map(
        (route) =>
          '  <url><loc>' + xmlEscape(site.url + route) + '</loc><lastmod>' + lastmod + '</lastmod></url>\n',
      )
      .join('') +
    '</urlset>\n'
  );
}

async function countPending() {
  const files = [];
  for (const file of await listMarkdown(p(CONTENT, 'faq'))) files.push(p(CONTENT, 'faq', file));
  for (const file of await listMarkdown(p(CONTENT, 'news'))) files.push(p(CONTENT, 'news', file));
  files.push(p(CONTENT, 'about.md'), p(CONTENT, 'resources.json'));
  let total = 0;
  for (const file of files) {
    const raw = await readText(file);
    if (!raw) continue;
    const hits = raw.match(/【待[^】]*】/g);
    if (hits) total += hits.length;
  }
  return total;
}

// ---------- 主流程 ----------
async function build() {
  const started = Date.now();
  const now = new Date();
  const buildInfo = {
    date: now,
    isoDate: now.toISOString().slice(0, 10),
    dateText: now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日',
  };

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  const [news, faq, resources, aboutHtml] = await Promise.all([
    loadNews(),
    loadFaq(),
    loadResources(),
    loadAbout(),
  ]);

  // 联系方式的二维码图片只有真的放进 public/ 才显示，否则页面上是「待上传」占位
  const publicFile = (rel) => p(ROOT, 'public', String(rel || '').replace(/^\//, ''));
  const exists = async (rel) => {
    if (!rel) return false;
    try {
      await fs.access(publicFile(rel));
      return true;
    } catch (err) {
      return false;
    }
  };
  contact.readyQrs = [];
  if (await exists(contact.formQr)) contact.readyQrs.push(contact.formQr);
  if (await exists(contact.wechatQr)) contact.readyQrs.push(contact.wechatQr);

  const ctx = {
    site,
    contact,
    nav,
    build: buildInfo,
    news,
    faq,
    resources,
    stats: {
      faqCount: faq.reduce((sum, group) => sum + group.items.length, 0),
      resourceCount: resources.reduce((sum, group) => sum + group.items.length, 0),
      newsCount: news.length,
    },
  };

  const routes = ['/', '/faq/', '/ask/', '/resources/', '/news/', '/about/'];

  await writePage('/', renderHome(ctx));
  await writePage('/faq/', renderFaq(ctx));
  await writePage('/ask/', renderAsk(ctx));
  await writePage('/resources/', renderResources(ctx));
  await writePage('/news/', renderNewsList(ctx));
  await writePage('/about/', renderAbout(ctx, aboutHtml));
  await writePage('404.html', renderNotFound(ctx));

  for (const post of news) {
    const route = '/news/' + post.slug + '/';
    await writePage(route, renderNewsPost(ctx, post));
    routes.push(route);
  }

  // 静态资源
  await copyDir(p(ROOT, 'public'), DIST);
  await fs.mkdir(p(DIST, 'assets'), { recursive: true });
  await fs.copyFile(p(ROOT, 'src', 'styles', 'main.css'), p(DIST, 'assets', 'styles.css'));
  await fs.copyFile(p(ROOT, 'src', 'client', 'app.js'), p(DIST, 'assets', 'app.js'));
  await fs.writeFile(p(DIST, 'favicon.svg'), logoFile(), 'utf8');
  await fs.mkdir(p(DIST, 'brand'), { recursive: true });
  await fs.writeFile(p(DIST, 'brand/logo.svg'), logoFile(), 'utf8');

  // 订阅与索引
  await fs.writeFile(p(DIST, 'rss.xml'), rssFeed(news, buildInfo), 'utf8');
  await fs.writeFile(p(DIST, 'sitemap.xml'), sitemap(routes, buildInfo), 'utf8');
  await fs.writeFile(
    p(DIST, 'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: ' + site.url + '/sitemap.xml\n',
    'utf8',
  );

  // Cloudflare Pages 的响应头配置
  await fs.writeFile(
    p(DIST, '_headers'),
    [
      '/assets/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      '/*',
      '  X-Content-Type-Options: nosniff',
      '  X-Frame-Options: SAMEORIGIN',
      '  Referrer-Policy: strict-origin-when-cross-origin',
      '',
    ].join('\n'),
    'utf8',
  );

  const pending = await countPending();
  const ms = Date.now() - started;
  console.log(
    '构建完成：' +
      routes.length +
      ' 个页面（答疑 ' +
      ctx.stats.faqCount +
      ' 条 / 资料 ' +
      ctx.stats.resourceCount +
      ' 份 / 公告 ' +
      ctx.stats.newsCount +
      ' 篇，另有 ' +
      pending +
      ' 处内容待填，搜索「【待」就能找到' +
      '），用时 ' +
      ms +
      'ms -> ' +
      path.relative(process.cwd(), DIST),
  );
}

build().catch((err) => {
  console.error('构建失败：', err);
  process.exit(1);
});
