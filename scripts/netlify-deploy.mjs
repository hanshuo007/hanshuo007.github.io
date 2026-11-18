// 部署到 Netlify：NETLIFY_TOKEN=xxx node _tools/netlify-deploy.mjs [站点名]
// 走官方 REST API：先确保站点存在，再把 dist 打包成 zip 上传。
import fs from 'node:fs/promises';
import path from 'node:path';

const TOKEN = process.env.NETLIFY_TOKEN;
const NAME = process.argv[2] || 'dadaohuifu';
const API = 'https://api.netlify.com/api/v1';
const ROOT = path.resolve(process.cwd());
const DIST = path.join(ROOT, 'dist');
const ZIP = path.join(ROOT, '.deploy.zip');

if (!TOKEN) {
  console.error('缺少 NETLIFY_TOKEN 环境变量');
  process.exit(1);
}

const auth = { Authorization: 'Bearer ' + TOKEN };

async function api(pathname, init) {
  const res = await fetch(API + pathname, { ...init, headers: { ...auth, ...(init && init.headers) } });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    data = text;
  }
  if (!res.ok) {
    throw new Error('Netlify API ' + pathname + ' 失败：' + res.status + ' ' + (typeof data === 'string' ? data : JSON.stringify(data)));
  }
  return data;
}

// 1. 站点：存在就复用，不存在就建
const sites = await api('/sites?per_page=100');
let site = sites.find((item) => item.name === NAME);
if (!site) {
  site = await api('/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: NAME }),
  });
  console.log('已创建站点：' + site.name);
} else {
  console.log('复用已有站点：' + site.name);
}

// 2. 打包 dist（zip 根目录必须是站点根目录）
await fs.access(path.join(DIST, 'index.html'));
await fs.rm(ZIP, { force: true });
const { zipDirectory } = await import('./zip.mjs');
const { buffer: zipBuffer, count } = await zipDirectory(DIST);
await fs.writeFile(ZIP, zipBuffer);
console.log('打包完成：' + count + ' 个文件，' + (zipBuffer.length / 1024).toFixed(0) + ' KB');

// 3. 上传部署
const deploy = await api('/sites/' + site.id + '/deploys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/zip' },
  body: zipBuffer,
});
console.log('部署已提交：' + deploy.id + '（状态 ' + deploy.state + '）');

// 4. 等它变成 ready
let final = deploy;
for (let i = 0; i < 40; i += 1) {
  if (final.state === 'ready' || final.state === 'error') break;
  await new Promise((r) => setTimeout(r, 3000));
  final = await api('/sites/' + site.id + '/deploys/' + deploy.id);
  process.stdout.write('.');
}
console.log('');

if (final.state !== 'ready') {
  console.error('部署未完成，最终状态：' + final.state);
  process.exit(1);
}

console.log('站点地址：' + (site.ssl_url || site.url));
console.log('本次部署预览：' + final.deploy_ssl_url);
