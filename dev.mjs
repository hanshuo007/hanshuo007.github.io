// 本地预览：node dev.mjs —— 构建一次后起一个静态服务，改动会自动重建。
// 只给自己看，不要拿去部署（线上用 Cloudflare Pages）。
import http from 'node:http';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function runBuild() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'build.mjs')], { stdio: 'inherit' });
    child.on('close', resolve);
  });
}

async function serve(urlPath, res) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  let target = path.join(DIST, clean);
  if (!target.startsWith(DIST)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) target = path.join(target, 'index.html');
  } catch (err) {
    target = path.join(DIST, '404.html');
    const body = await fs.readFile(target).catch(() => Buffer.from('404'));
    res.writeHead(404, { 'Content-Type': MIME['.html'] }).end(body);
    return;
  }
  const body = await fs.readFile(target).catch(() => null);
  if (!body) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(target)] || 'application/octet-stream' }).end(body);
}

await runBuild();

http
  .createServer((req, res) => {
    serve(req.url || '/', res).catch((err) => {
      res.writeHead(500).end(String(err));
    });
  })
  .listen(PORT, () => {
    console.log('\n本地预览： http://localhost:' + PORT + '\n（Ctrl+C 退出）');
  });

let timer = null;
const watched = ['content', 'src', 'public', 'site.config.mjs', 'build.mjs'];
for (const entry of watched) {
  const full = path.join(ROOT, entry);
  const stat = fssync.existsSync(full) ? fssync.statSync(full) : null;
  if (!stat) continue;
  fssync.watch(full, { recursive: stat.isDirectory() }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('检测到改动，重新构建…');
      runBuild();
    }, 250);
  });
}
