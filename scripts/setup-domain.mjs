// 一键把 GitHub Pages 需要的 5 条 DNS 记录加到阿里云解析。
// 用法（在仓库根目录）：
//   ALIYUN_AK_ID=xxx ALIYUN_AK_SECRET=yyy DOMAIN=dadaohuifu.com node scripts/setup-domain.mjs
// 需要的权限：RAM 子账号只需 AliyunDNSFullAccess；主账号 AccessKey 危险，不建议给。
import crypto from 'node:crypto';

const AK_ID = process.env.ALIYUN_AK_ID;
const AK_SECRET = process.env.ALIYUN_AK_SECRET;
const DOMAIN = process.env.DOMAIN || 'dadaohuifu.com';
const TTL = process.env.TTL || '600';

if (!AK_ID || !AK_SECRET) {
  console.error('缺少 ALIYUN_AK_ID / ALIYUN_AK_SECRET 环境变量');
  process.exit(1);
}

const RECORDS = [
  { RR: '@', Type: 'A', Value: '185.199.108.153' },
  { RR: '@', Type: 'A', Value: '185.199.109.153' },
  { RR: '@', Type: 'A', Value: '185.199.110.153' },
  { RR: '@', Type: 'A', Value: '185.199.111.153' },
  { RR: 'www', Type: 'CNAME', Value: 'hanshuo007.github.io' },
];

const pct = (str) =>
  encodeURIComponent(str).replace(/\+/g, '%20').replace(/\*/g, '%2A').replace(/%7E/g, '~');

const rfc3986 = (obj) =>
  Object.keys(obj)
    .sort()
    .map((key) => pct(key) + '=' + pct(obj[key]))
    .join('&');

async function call(action, extra) {
  const params = {
    AccessKeyId: AK_ID,
    Action: action,
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomBytes(16).toString('hex'),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2015-01-09',
    ...extra,
  };
  const canonical = rfc3986(params);
  const stringToSign = 'GET&%2F&' + pct(canonical);
  const signature = crypto.createHmac('sha1', AK_SECRET + '&').update(stringToSign).digest('base64');
  const res = await fetch('https://alidns.aliyuncs.com/?Signature=' + pct(signature) + '&' + canonical);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function listRecords() {
  const { ok, data } = await call('DescribeDomainRecords', { DomainName: DOMAIN, PageSize: '500' });
  if (!ok) return { ok: false, message: data.Message || data.Code || 'DescribeDomainRecords 失败' };
  return { ok: true, records: (data.DomainRecords && data.DomainRecords.Record) || [] };
}

const key = (r) => r.RR + '|' + r.Type;
const exists = (records, want) => records.some((r) => key(r) === key(want));
const sameContent = (records, want) =>
  records.some((r) => key(r) === key(want) && String(r.Value).replace(/\.$/, '') === String(want.Value).replace(/\.$/, ''));

console.log('域名：' + DOMAIN + '（解析记录用 TTL ' + TTL + '）');

const pre = await listRecords();
if (!pre.ok) {
  console.error('读取现有解析失败：' + pre.message);
  console.error('常见原因：AccessKey 没有 DNS 权限（需要 AliyunDNSFullAccess），或域名不在这个账号下。');
  process.exit(1);
}
console.log('现有解析 ' + pre.records.length + ' 条');

for (const want of RECORDS) {
  if (sameContent(pre.records, want)) {
    console.log('✓ 已存在且值正确：' + want.RR + ' ' + want.Type + ' ' + want.Value);
    continue;
  }
  if (exists(pre.records, want)) {
    console.log('! 已存在但值不同，跳过（请手动核对）：' + want.RR + ' ' + want.Type);
    continue;
  }
  const { ok, data } = await call('AddDomainRecord', {
    DomainName: DOMAIN,
    RR: want.RR,
    Type: want.Type,
    Value: want.Value,
    TTL,
  });
  if (ok) {
    console.log('+ 已添加：' + want.RR + ' ' + want.Type + ' → ' + want.Value);
  } else {
    console.log('✗ 添加失败：' + want.RR + ' ' + want.Type + ' → ' + want.Value + '：' + (data.Message || data.Code || JSON.stringify(data)));
  }
}

// 用 DoH 验证公网是否已能看到这些记录
const doh = async (name, type) => {
  const res = await fetch('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(name) + '&type=' + type, {
    headers: { accept: 'application/dns-json' },
  });
  const data = await res.json();
  return (data.Answer || []).map((a) => a.data);
};

console.log('\n等待解析生效（最多 8 分钟，每 30 秒查一次）…');
for (let i = 0; i < 16; i += 1) {
  const apex = await doh(DOMAIN, 'A');
  const www = await doh('www.' + DOMAIN, 'CNAME');
  const apexOk = RECORDS.filter((r) => r.RR === '@').every((r) => apex.includes(r.Value));
  const wwwOk = www.length > 0;
  console.log('第 ' + (i + 1) + ' 次：A=' + apex.join(',') + ' | www=' + www.join(',') + (apexOk && wwwOk ? '  ✅ 全部生效' : ''));
  if (apexOk && wwwOk) break;
  await new Promise((r) => setTimeout(r, 30000));
}
console.log('\n完成后告诉我，我继续配置 GitHub Pages 的自定义域名与 HTTPS。');
