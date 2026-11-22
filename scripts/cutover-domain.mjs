// 域名切换：node scripts/cutover-domain.mjs [--dry-run]
// 前提：dadaohuifu.cn 已在注册局委派、A 记录指向 GitHub Pages。
// 做四件事：确认 DNS → GitHub Pages 设自定义域名 → 改 site.config.mjs 并提交 → 验证新域名全站。
import fs from 'node:fs/promises';

const DOMAIN = process.env.DOMAIN || 'dadaohuifu.cn';
const OWNER = process.env.GH_OWNER || 'hanshuo007';
const REPO = process.env.GH_REPO || 'hanshuo007.github.io';
const GH_TOKEN = process.env.GH_TOKEN;
const DRY = process.argv.includes('--dry-run');
const GH_IPS = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
const ROOT = process.cwd();

const gh = async (path, init) => {
  const res = await fetch('https://api.github.com' + path, {
    ...init,
    headers: { Authorization: 'Bearer ' + GH_TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-cutover', ...(init && init.headers) },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
};

const doh = async (name, type) => {
  const res = await fetch('https://dns.alidns.com/resolve?name=' + encodeURIComponent(name) + '&type=' + type);
  const j = await res.json();
  return j.Status === 0 ? (j.Answer || []).map((a) => a.data) : [];
};

const step = (msg) => console.log('\n=== ' + msg + ' ===');

// 1. DNS
step('1/4 检查 DNS');
const apex = await doh(DOMAIN, 'A');
const www = await doh('www.' + DOMAIN, 'CNAME');
const wwwA = await doh('www.' + DOMAIN, 'A');
console.log(DOMAIN + ' A  → ' + (apex.join(', ') || '(空，未委派或未生效)'));
console.log('www CNAME → ' + (www.join(', ') || '(空)') + ' | www A → ' + (wwwA.join(', ') || '(空)'));

const apexOk = GH_IPS.every((ip) => apex.includes(ip));
const wwwOk = wwwA.includes('185.199.108.153') || www.includes(OWNER + '.github.io');
if (!apexOk || !wwwOk) {
  console.log('\n⏳ DNS 还没就绪（apexOk=' + apexOk + ', wwwOk=' + wwwOk + '）。注册局委派通常 10 分钟到几小时，先别继续。');
  process.exit(DRY ? 0 : 2);
}
console.log('✅ DNS 全部指向 GitHub Pages');

if (DRY) {
  console.log('\n(dry-run) 后续会做：设 Pages 自定义域名 → 改 site.config.mjs 的 url → 提交 → 逐页验证');
  process.exit(0);
}

// 2. Pages 自定义域名
step('2/4 GitHub Pages 设置自定义域名');
const setCname = await gh('/repos/' + OWNER + '/' + REPO + '/pages', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cname: DOMAIN, https_enforced: true }),
});
console.log(setCname.ok ? '已设置：' + DOMAIN : '设置失败 ' + setCname.status + ' ' + JSON.stringify(setCname.data).slice(0, 200));

// 3. 改配置并提交
step('3/4 更新 site.config.mjs 的 url');
const cfgPath = 'site.config.mjs';
const local = await fs.readFile(cfgPath, 'utf8');
const wantUrl = 'https://' + DOMAIN;
const updated = local.replace(/url:\s*'[^']*'/, "url: '" + wantUrl + "'");
if (updated === local) {
  console.log('配置里的 url 已经是 ' + wantUrl + '，跳过提交');
} else {
  console.log('url: ' + (local.match(/url:\s*'([^']*)'/) || [])[1] + ' → ' + wantUrl);
  const cur = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + cfgPath + '?ref=main');
  const body = {
    message: '切换站点域名为 ' + wantUrl,
    content: Buffer.from(updated, 'utf8').toString('base64'),
    branch: 'main',
    sha: cur.data.sha,
  };
  const put = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + cfgPath, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log(put.ok ? '已提交：' + put.data.commit.sha.slice(0, 7) : '提交失败 ' + put.status + ' ' + JSON.stringify(put.data).slice(0, 200));
  await fs.writeFile(cfgPath, updated, 'utf8');
}

// 4. 等部署 + 验证
step('4/4 等待部署并验证');
let deployed = false;
for (let i = 0; i < 30; i += 1) {
  await new Promise((r) => setTimeout(r, 15000));
  const runs = await gh('/repos/' + OWNER + '/' + REPO + '/actions/runs?per_page=1');
  const run = runs.data.workflow_runs && runs.data.workflow_runs[0];
  if (!run) continue;
  console.log('run ' + run.id + ': ' + run.status + '/' + (run.conclusion || '-'));
  if (run.status === 'completed') { deployed = run.conclusion === 'success'; break; }
}

const paths = ['/', '/faq/', '/ask/', '/resources/', '/news/', '/news/kaizhan/', '/about/', '/rss.xml', '/sitemap.xml'];
console.log('\n新域名逐页验证：');
let bad = 0;
for (const p of paths) {
  const res = await fetch('https://' + DOMAIN + p, { redirect: 'manual' }).catch(() => null);
  const code = res ? res.status : 'ERR';
  if (code !== 200) bad += 1;
  console.log('  ' + p.padEnd(20) + ' ' + code);
}
console.log(bad === 0 ? '\n✅ 全部 200，切换完成：https://' + DOMAIN : '\n⚠️ 有 ' + bad + ' 个路径异常，需要排查');
