// 页面模板：纯字符串拼接，没有模板引擎，也就没有依赖。
import { escapeHtml as esc } from './markdown.mjs';
import { logoMark, orbitRings } from './brand.mjs';

const THEME_SCRIPT =
  "(function(){try{var s=localStorage.getItem('theme');" +
  "if(s==='light'||s==='dark'){document.documentElement.setAttribute('data-theme',s);}}catch(e){}})();";

function navItems(ctx, active) {
  return ctx.nav
    .map((item) => {
      const isActive = item.href === active;
      return (
        '<a class="nav-link' + (isActive ? ' is-active' : '') + '" href="' + item.href + '"' +
        (isActive ? ' aria-current="page"' : '') + '>' + esc(item.label) + '</a>'
      );
    })
    .join('');
}

function head(ctx, page) {
  const title = page.title ? page.title + ' — ' + ctx.site.team : ctx.site.team + ' · ' + ctx.site.tagline;
  const description = page.description || ctx.site.description;
  const canonical = ctx.site.url + page.path;
  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + esc(title) + '</title>',
    '<meta name="description" content="' + esc(description) + '">',
    '<link rel="canonical" href="' + esc(canonical) + '">',
    '<meta name="theme-color" content="#0e2340">',
    '<meta property="og:type" content="' + (page.ogType || 'website') + '">',
    '<meta property="og:site_name" content="' + esc(ctx.site.team) + '">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(description) + '">',
    '<meta property="og:url" content="' + esc(canonical) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="stylesheet" href="/assets/styles.css">',
    '<script>' + THEME_SCRIPT + '</script>',
  ].join('\n    ');
}

function header(ctx, active) {
  return [
    '<a class="skip-link" href="#main">跳到主要内容</a>',
    '<header class="site-header">',
    '  <div class="wrap header-inner">',
    '    <a class="brand" href="/" aria-label="' + esc(ctx.site.team) + ' 首页">',
    '      <span class="brand-mark">' + logoMark(40) + '</span>',
    '      <span class="brand-text">',
    '        <span class="brand-name">' + esc(ctx.site.team) + '</span>',
    '        <span class="brand-org">' + esc(ctx.site.org) + '</span>',
    '      </span>',
    '    </a>',
    '    <nav class="nav" aria-label="主导航">' + navItems(ctx, active) + '</nav>',
    '    <button class="theme-toggle" type="button" data-theme-toggle aria-label="切换深浅色">',
    '      <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    '      <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    '    </button>',
    '  </div>',
    '</header>',
  ].join('\n');
}

function footer(ctx) {
  return [
    '<footer class="site-footer">',
    '  <div class="wrap footer-inner">',
    '    <div class="footer-brand">',
    '      <span class="footer-mark">' + logoMark(32) + '</span>',
    '      <div>',
    '        <p class="footer-team">' + esc(ctx.site.team) + '</p>',
    '        <p class="footer-org">' + esc(ctx.site.org) + '</p>',
    '      </div>',
    '    </div>',
    '    <nav class="footer-nav" aria-label="页脚导航">' + navItems(ctx, null) + '</nav>',
    '    <div class="footer-meta">',
    '      <p>更新于 ' + esc(ctx.build.dateText) + '</p>',
    '      <p><a href="/rss.xml">公告 RSS</a> · <a href="/sitemap.xml">站点地图</a></p>',
    '      <p class="footer-note">本站由小队成员共同维护，内容仅供高中生与家长参考；正式招生政策以学校与省考试院发布为准。</p>',
    '    </div>',
    '  </div>',
    '</footer>',
  ].join('\n');
}

export function layout(ctx, page, mainHtml) {
  return [
    '<!doctype html>',
    '<html lang="' + esc(ctx.site.lang) + '">',
    '<head>',
    '    ' + head(ctx, page),
    '</head>',
    '<body class="' + (page.bodyClass || '') + '">',
    header(ctx, page.active),
    '<main id="main" class="site-main">',
    mainHtml,
    '</main>',
    footer(ctx),
    '<script src="/assets/app.js" defer></script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function pageHero(eyebrow, title, lede) {
  return [
    '<section class="page-hero">',
    '  <div class="wrap">',
    '    <p class="eyebrow">' + esc(eyebrow) + '</p>',
    '    <h1>' + title + '</h1>',
    lede ? '    <p class="lede">' + lede + '</p>' : '',
    '  </div>',
    '</section>',
  ].join('\n');
}

// ---------- 首页 ----------
export function renderHome(ctx) {
  const stats = [
    { value: ctx.stats.faqCount, label: '条答疑' },
    { value: ctx.stats.resourceCount, label: '份资料' },
    { value: ctx.stats.newsCount, label: '篇公告' },
  ]
    .map((s) => '<li><strong>' + s.value + '</strong><span>' + s.label + '</span></li>')
    .join('');

  const entries = [
    {
      no: '01',
      title: '答疑',
      href: '/faq/',
      desc: '把高中生最常问的问题整理成一份能查的答案：北科大怎么样、专业怎么选、志愿怎么填。',
      action: '去看答疑',
    },
    {
      no: '02',
      title: '资料',
      href: '/resources/',
      desc: '招生简章、专业介绍、往年分数与复习资料，能直接下载的就直接下，大合集走网盘。',
      action: '去取资料',
    },
    {
      no: '03',
      title: '公告',
      href: '/news/',
      desc: '小队的宣讲安排、进校时间、资料更新与站点变化，都写在这里，不做朋友圈式的碎片更新。',
      action: '看最新公告',
    },
  ]
    .map(
      (e) =>
        '<a class="entry-card" href="' + e.href + '">' +
        '<span class="entry-no">' + e.no + '</span>' +
        '<h3>' + esc(e.title) + '</h3>' +
        '<p>' + esc(e.desc) + '</p>' +
        '<span class="entry-action">' + esc(e.action) + ' <span aria-hidden="true">→</span></span>' +
        '</a>',
    )
    .join('\n      ');

  const news = ctx.news
    .slice(0, ctx.site.homeNewsCount)
    .map(
      (post) =>
        '<a class="news-row" href="/news/' + post.slug + '/">' +
        '<time datetime="' + post.dateISO + '">' + esc(post.dateShort) + '</time>' +
        '<span class="news-title">' + esc(post.title) + '</span>' +
        '<span class="news-more" aria-hidden="true">→</span>' +
        '</a>',
    )
    .join('\n      ');

  const body = [
    '<section class="hero">',
    '  <div class="wrap hero-inner">',
    '    <div class="hero-copy">',
    '      <p class="eyebrow">USTB · 安徽分团 · 阜阳队</p>',
    '      <h1>' + esc(ctx.site.tagline) + '</h1>',
    '      <p class="lede">我们是北京科技大学回阜阳做寒假招生宣传的学生小队。这个站点有两个用处：把你想问的问题答清楚，把你要用的资料整理好。</p>',
    '      <div class="hero-actions">',
    '        <a class="btn btn-primary" href="/faq/">先看答疑</a>',
    '        <a class="btn btn-ghost" href="/resources/">去取资料</a>',
    '      </div>',
    '      <ul class="hero-stats">' + stats + '</ul>',
    '    </div>',
    '    <div class="hero-art">',
    orbitRings(),
    '      <div class="hero-mark">' + logoMark(210, { label: ctx.site.team + ' 队徽' }) + '</div>',
    '      <p class="hero-slogan">' + esc(ctx.site.slogan) + '</p>',
    '    </div>',
    '  </div>',
    '</section>',
    '<section class="section entries">',
    '  <div class="wrap">',
    '    <div class="section-head"><h2>这里有什么</h2><p>三件事，做扎实就够了。</p></div>',
    '    <div class="entry-grid">',
    '      ' + entries,
    '    </div>',
    '  </div>',
    '</section>',
    news
      ? [
          '<section class="section latest">',
          '  <div class="wrap">',
          '    <div class="section-head"><h2>最新公告</h2><a class="link-more" href="/news/">全部公告 <span aria-hidden="true">→</span></a></div>',
          '    <div class="news-list">',
          '      ' + news,
          '    </div>',
          '  </div>',
          '</section>',
        ].join('\n')
      : '',
    '<section class="section cta">',
    '  <div class="wrap cta-inner">',
    '    <div>',
    '      <h2>有想问题，别憋着</h2>',
    '      <p>关于学校、专业、志愿、复习节奏，都可以问。我们不一定知道全部答案，但会尽量说真话。</p>',
    '    </div>',
    '    <a class="btn btn-primary btn-lg" href="/ask/">去提问</a>',
    '  </div>',
    '</section>',
  ].join('\n');

  return layout(ctx, { path: '/', title: '', active: '/', description: ctx.site.description }, body);
}

// ---------- 答疑 ----------
export function renderFaq(ctx) {
  const groups = ctx.faq
    .map(
      (group) =>
        '<section class="faq-group" id="' + esc(group.slug) + '">' +
        '<div class="faq-group-head"><h2>' + esc(group.category) + '</h2>' +
        '<span class="count">' + group.items.length + ' 条</span></div>' +
        group.items
          .map(
            (item, index) =>
              '<details class="faq-item" id="' + group.slug + '-q' + (index + 1) + '">' +
              '<summary><span class="faq-q">' + esc(item.q) + '</span><span class="faq-toggle" aria-hidden="true"></span></summary>' +
              '<div class="faq-a">' + item.html + '</div>' +
              '</details>',
          )
          .join('') +
        '</section>',
    )
    .join('\n');

  const empty =
    '<div class="empty-state"><p>答疑内容正在整理中，第一批问题会在宣讲开始前上线。</p>' +
    '<p>有急问题可以直接 <a href="/ask/">提问</a>。</p></div>';

  const body = [
    pageHero(
      'FAQ',
      '学生答疑',
      '整理了高中同学问得最多的问题。答案里出现具体数字的地方，我们都会标注来源或「待核实」，不猜。',
    ),
    '<section class="section">',
    '  <div class="wrap faq-layout">',
    '    <aside class="faq-side">',
    '      <p class="side-label">分类</p>',
    ctx.faq
      .map((g) => '<a href="#' + esc(g.slug) + '">' + esc(g.category) + '</a>')
      .join('') || '<span class="muted">暂无</span>',
    '      <a class="side-cta" href="/ask/">没找到答案？去提问</a>',
    '    </aside>',
    '    <div class="faq-main">',
    ctx.faq.length ? groups : empty,
    '    </div>',
    '  </div>',
    '</section>',
  ].join('\n');

  return layout(
    ctx,
    { path: '/faq/', title: '学生答疑', active: '/faq/', description: '关于北京科技大学、专业选择与志愿填报的常见问题答案。' },
    body,
  );
}

// ---------- 提问 ----------
export function renderAsk(ctx) {
  const c = ctx.contact;
  const channels = [];

  if (c.formUrl) {
    channels.push({
      badge: '表单',
      title: c.formLabel || '在线提问表',
      desc: '填完直接进我们的表格，谁值班谁看。想匿名也可以。',
      href: c.formUrl,
      action: '打开提问表',
      qr: c.formQr,
      qrAlt: '提问表二维码',
    });
  }
  if (c.qqGroup) {
    channels.push({
      badge: 'QQ 群',
      title: '答疑群 ' + c.qqGroup,
      desc: '群里可以直接聊，宣讲时间也会在群里通知。',
      href: 'https://qm.qq.com/q/' + c.qqGroup,
      action: '加群',
    });
  }
  if (c.wechatQr) {
    channels.push({
      badge: '微信群',
      title: '微信群',
      desc: '扫码进群，群里提问回复更快。',
      qr: c.wechatQr,
      qrAlt: '微信群二维码',
    });
  }
  if (c.email) {
    channels.push({
      badge: '邮件',
      title: c.email,
      desc: '适合老师、家长正式咨询或需要留档的问题。',
      href: 'mailto:' + c.email,
      action: '发邮件',
    });
  }

  channels.forEach((ch) => {
    if (ch.qr) ch.qrReady = (c.readyQrs || []).indexOf(ch.qr) !== -1;
  });

  const cards = channels.length
    ? channels
        .map(
          (ch) =>
            '<article class="channel-card">' +
            '<span class="badge">' + esc(ch.badge) + '</span>' +
            '<h3>' + esc(ch.title) + '</h3>' +
            '<p>' + esc(ch.desc) + '</p>' +
            (ch.href
              ? '<a class="btn btn-primary" href="' + esc(ch.href) + '" rel="noopener">' + esc(ch.action) + '</a>'
              : '') +
            (ch.qr
              ? '<div class="qr-slot' + (ch.qrReady ? ' is-ready' : '') + '">' +
                (ch.qrReady
                  ? '<img src="' + esc(ch.qr) + '" alt="' + esc(ch.qrAlt) + '" width="168" height="168" loading="lazy">'
                  : '<span class="qr-hint">二维码待上传</span>') +
                '</div>'
              : '') +
            '</article>',
        )
        .join('')
    : '<div class="empty-state"><p>提问入口正在配置（表单链接与群二维码还没填）。</p>' +
      '<p>上线前改 <code>site.config.mjs</code> 里的 <code>contact</code> 即可。</p></div>';

  const popular = ctx.faq.slice(0, 3).flatMap((group) =>
    group.items.slice(0, 2).map((item, index) => ({
      q: item.q,
      href: '/faq/#' + group.slug + '-q' + (index + 1),
    })),
  );

  const quickLinks = popular.length
    ? '<aside class="ask-side">' +
      '<p class="side-label">问之前先看这几条</p>' +
      popular
        .slice(0, 6)
        .map((item) => '<a href="' + item.href + '">' + esc(item.q) + '</a>')
        .join('') +
      '<a class="side-cta" href="/faq/">全部答疑 →</a>' +
      '</aside>'
    : '';

  const body = [
    pageHero('ASK', '向我们提问', '问之前先翻一下答疑页，八成的问题那里已经有了。'),
    '<section class="section">',
    '  <div class="wrap">',
    '    <div class="ask-layout">',
    '      <div class="channel-grid">' + cards + '</div>',
    '      ' + quickLinks,
    '    </div>',
    '  </div>',
    '</section>',
    '<section class="section section-alt">',
    '  <div class="wrap two-col">',
    '    <div>',
    '      <h2>这样问，答得更准</h2>',
    '      <ol class="tips">',
    '        <li>说清你现在的<b>省份、年级、选科</b>，答案差别很大。</li>',
    '        <li>问分数就问<b>位次</b>，每年的分数线没可比性。</li>',
    '        <li>问专业就说清楚你<b>在意什么</b>：就业、保研、课程难度还是城市。</li>',
    '        <li>一次问一件事，别把五个问题塞进一条消息。</li>',
    '      </ol>',
    '    </div>',
    '    <div>',
    '      <h2>我们怎么答</h2>',
    '      <ul class="tips">',
    '        <li>能查证的给来源，查不到的直说不知道。</li>',
    '        <li>涉及政策、分数线，一律以学校与省考试院发布为准。</li>',
    '        <li>有价值的问答会脱敏后收进 <a href="/faq/">答疑页</a>，让更多人看到。</li>',
    '        <li>一般 1–3 天内回复，寒招高峰期可能慢一点。</li>',
    '      </ul>',
    '    </div>',
    '  </div>',
    '</section>',
  ].join('\n');

  return layout(
    ctx,
    { path: '/ask/', title: '提问', active: '/ask/', description: '向打道回阜队提问：表单、QQ 群、微信群三种方式。' },
    body,
  );
}

// ---------- 资料 ----------
export function renderResources(ctx) {
  const groups = ctx.resources;
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  const chips =
    '<button class="chip is-active" type="button" data-filter="all">全部 <span>' + total + '</span></button>' +
    groups
      .map(
        (g) =>
          '<button class="chip" type="button" data-filter="' + esc(g.slug) + '">' + esc(g.category) +
          ' <span>' + g.items.length + '</span></button>',
      )
      .join('');

  const card = (item, groupSlug) => {
    const isLink = item.kind === 'link';
    const meta = [];
    if (item.size) meta.push(item.size);
    if (isLink) meta.push('网盘');

    const inner =
      '<span class="res-top">' +
      '<span class="res-kind ' + (isLink ? 'is-link' : 'is-file') + '">' + (isLink ? '网盘链接' : '站内下载') + '</span>' +
      (meta.length ? '<span class="res-meta">' + meta.map(esc).join(' · ') + '</span>' : '') +
      '</span>' +
      '<span class="res-title">' + esc(item.title) + '</span>' +
      (item.desc ? '<span class="res-desc">' + esc(item.desc) + '</span>' : '') +
      (item.href
        ? '<span class="res-action">' + (isLink ? '去网盘' : '下载') + ' <span aria-hidden="true">↓</span></span>'
        : '');

    if (!item.href) {
      return '<div class="res-card is-todo" data-cat="' + esc(groupSlug) + '" data-search="' +
        esc((item.title + ' ' + (item.desc || '')).toLowerCase()) + '">' + inner +
        '<span class="res-todo">待上传</span></div>';
    }
    const attrs = isLink ? ' target="_blank" rel="noopener noreferrer"' : ' download';
    return '<a class="res-card" href="' + esc(item.href) + '"' + attrs + ' data-cat="' + esc(groupSlug) +
      '" data-search="' + esc((item.title + ' ' + (item.desc || '')).toLowerCase()) + '">' + inner + '</a>';
  };

  const sections = groups
    .map(
      (g) =>
        '<section class="res-group" data-group="' + esc(g.slug) + '">' +
        '<h2>' + esc(g.category) + '<span class="count">' + g.items.length + '</span></h2>' +
        '<div class="res-grid">' + g.items.map((item) => card(item, g.slug)).join('') + '</div>' +
        '</section>',
    )
    .join('');

  const body = [
    pageHero('FILES', '资料分享', '能直接下载的放站内，文件太大的走网盘。资料会随宣讲进度更新，回来这里刷新即可。'),
    '<section class="section">',
    '  <div class="wrap">',
    '    <div class="res-toolbar">',
    '      <div class="chips" role="tablist" aria-label="资料分类">' + chips + '</div>',
    '      <input class="search" type="search" placeholder="搜索资料名称…" aria-label="搜索资料" data-search-input>',
    '    </div>',
    '    <div class="res-list"' + (groups.length ? '' : ' hidden') + '>' + sections + '</div>',
    groups.length
      ? ''
      : '<div class="empty-state"><p>资料还在整理，第一批会在宣讲开始前放上来。</p></div>',
    '    <p class="res-note">说明：所有资料仅用于个人了解与学习，请勿商用；涉及学校官方发布的文件，以学校官网原版为准。</p>',
    '  </div>',
    '</section>',
  ].join('\n');

  return layout(
    ctx,
    { path: '/resources/', title: '资料分享', active: '/resources/', description: '北京科技大学招生简章、专业介绍、分数线与复习资料下载。' },
    body,
  );
}

// ---------- 公告 ----------
export function renderNewsList(ctx) {
  const rows = ctx.news.length
    ? ctx.news
        .map(
          (post) =>
            '<a class="news-card" href="/news/' + post.slug + '/">' +
            '<time datetime="' + post.dateISO + '">' + esc(post.dateShort) + '</time>' +
            '<h2>' + esc(post.title) + '</h2>' +
            (post.summary ? '<p>' + esc(post.summary) + '</p>' : '') +
            '</a>',
        )
        .join('')
    : '<div class="empty-state"><p>还没有公告。</p></div>';

  const body = [
    pageHero('NOTICE', '公告与动态', '宣讲安排、资料更新、站点变化。'),
    '<section class="section"><div class="wrap"><div class="news-page">' + rows + '</div></div></section>',
  ].join('\n');

  return layout(ctx, { path: '/news/', title: '公告', active: '/news/', description: '打道回阜队的宣讲安排与更新公告。' }, body);
}

export function renderNewsPost(ctx, post) {
  const body = [
    '<article class="article">',
    '  <div class="wrap article-wrap">',
    '    <header class="article-head">',
    '      <p class="eyebrow"><a href="/news/">公告</a></p>',
    '      <h1>' + esc(post.title) + '</h1>',
    '      <p class="article-meta"><time datetime="' + post.dateISO + '">' + esc(post.dateText) + '</time></p>',
    '    </header>',
    '    <div class="prose">' + post.html + '</div>',
    '    <p class="article-back"><a href="/news/">← 返回公告列表</a></p>',
    '  </div>',
    '</article>',
  ].join('\n');

  return layout(
    ctx,
    { path: '/news/' + post.slug + '/', title: post.title, active: '/news/', description: post.summary, ogType: 'article' },
    body,
  );
}

// ---------- 关于 ----------
export function renderAbout(ctx, html) {
  const body = [
    pageHero('ABOUT', '关于我们', ctx.site.org),
    '<section class="section"><div class="wrap article-wrap"><div class="prose">' + html + '</div></div></section>',
  ].join('\n');
  return layout(ctx, { path: '/about/', title: '关于', active: '/about/', description: ctx.site.description }, body);
}

export function renderNotFound(ctx) {
  const body = [
    '<section class="section notfound">',
    '  <div class="wrap">',
    '    <p class="eyebrow">404</p>',
    '    <h1>这个地址没有内容</h1>',
    '    <p class="lede">可能是链接打错了，也可能是我们还没写好这一页。</p>',
    '    <div class="hero-actions">',
    '      <a class="btn btn-primary" href="/">回首页</a>',
    '      <a class="btn btn-ghost" href="/faq/">看答疑</a>',
    '    </div>',
    '  </div>',
    '</section>',
  ].join('\n');
  return layout(ctx, { path: '/404.html', title: '页面不存在', active: null, description: '页面不存在' }, body);
}
