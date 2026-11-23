// 页面模板：纯字符串拼接，没有模板引擎，也就没有依赖。
import { escapeHtml as esc } from './markdown.mjs';
import { logoMark } from './brand.mjs';

const THEME_SCRIPT =
  "(function(){try{var s=localStorage.getItem('theme');" +
  "if(s==='light'||s==='dark'){document.documentElement.setAttribute('data-theme',s);}}catch(e){}})();";

const dockIcons = {
  '/': 'M3 10.5 12 3l9 7.5M5.5 9v11h5v-6h3v6h5V9',
  '/faq/': 'M4 4.5h16v12H11l-5.5 4v-4H4z M8 9h8M8 12h5',
  '/resources/': 'M3 7h7l2 2h9v10H3z M4 7V4h6l2 2h7v3',
  '/news/': 'M4 10h4l10-5v14l-10-5H4z M7 14l2 6h3l-2-5',
  '/about/': 'M3 20c0-4 2.5-6 6-6s6 2 6 6 M12 8a3 3 0 1 1-6 0 3 3 0 1 1 6 0 M16 5a3 3 0 0 1 0 6 M17 14c3 0 4 2 4 5',
};

function navItems(ctx, active, dock = false) {
  return ctx.nav
    .map((item) => {
      const isActive = item.href === active;
      const icon = dock && dockIcons[item.href]
        ? '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="' + dockIcons[item.href] + '"/></svg>'
        : '';
      return (
        '<a class="nav-link' + (isActive ? ' is-active' : '') + '" href="' + item.href + '"' +
        (isActive ? ' aria-current="page"' : '') + '>' + icon + esc(item.label) +
        (isActive ? '<span class="nav-station" aria-hidden="true"></span>' : '') + '</a>'
      );
    })
    .join('');
}

// Install before the first paint so restored pages and new documents use the same motion.
function installPageMotion() {
  const root = document.documentElement;
  if ('onpagereveal' in window) {
    window.addEventListener('pagereveal', (event) => {
      delete root.dataset.turn;
      if (!event.viewTransition) return;
      const visit = window.navigation?.activation;
      if (!visit?.from?.url) return;
      const links = Array.from(document.querySelectorAll('.site-header .nav-link'));
      function section(url) {
        const path = new URL(url).pathname;
        return links.findIndex(link => {
          const target = link.pathname;
          return path === target || (target !== links[0].pathname && path.startsWith(target));
        });
      }
      const previous = section(visit.from.url);
      const next = section(location.href);
      const reverse = visit.navigationType === 'traverse'
        ? visit.entry.index < visit.from.index
        : previous >= 0 && next >= 0 && next < previous;
      if (reverse) root.dataset.turn = 'back';
    });
  } else if (document.referrer && new URL(document.referrer).origin === location.origin &&
             performance.getEntriesByType('navigation')[0]?.type === 'navigate') {
    root.classList.add('soft-arrival');
  }
}

function head(ctx, page) {
  const title = page.title ? page.title + ' — ' + ctx.site.team : ctx.site.team + ' · ' + ctx.site.tagline;
  const description = page.description || ctx.site.description;
  const canonical = ctx.site.url + page.path;
  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<title>' + esc(title) + '</title>',
    '<meta name="description" content="' + esc(description) + '">',
    '<link rel="canonical" href="' + esc(canonical) + '">',
    '<meta name="theme-color" content="#121e1b">',
    '<meta property="og:type" content="' + (page.ogType || 'website') + '">',
    '<meta property="og:site_name" content="' + esc(ctx.site.team) + '">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(description) + '">',
    '<meta property="og:url" content="' + esc(canonical) + '">',
    '<meta property="og:image" content="' + esc(ctx.site.url + '/images/ustb-gate.webp') + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="preload" as="image" href="/images/ustb-gate.webp" fetchpriority="high">',
    '<link rel="stylesheet" href="/assets/styles.css">',
    '<script>' + THEME_SCRIPT + '(' + installPageMotion.toString() + ')();</script>',
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
    '<nav class="mobile-dock" aria-label="底部主导航">' + navItems(ctx, page.active, true) + '</nav>',
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
  const stops = [
    {
      id: 'admission',
      name: '查录取',
      title: '在安徽，怎么报北科大？',
      description: '先在安徽省考试院查本省一分一段表，再对照北科大往年录取数据。填报前核对当年的招生计划和选科要求。',
      links: [
        ['北科大历年录取分数', 'https://zhaoshengyunzhi.ustb.edu.cn/zsw/lnfs.html'],
        ['北科大分省招生计划', 'https://zhaoshengyunzhi.ustb.edu.cn/zsw/zsjh.html'],
        ['查看报考资料', '/resources/#res-1'],
      ],
    },
    {
      id: 'campus',
      name: '选专业',
      title: '读什么专业？在北科大怎么过？',
      description: '先看学校的专业介绍，再读学长学姐整理的大类分流、转专业和校园生活答疑。',
      links: [
        ['北科大本科专业介绍', 'https://zhaosheng.ustb.edu.cn/xkzy/zyjs/index.htm'],
        ['专业与培养答疑', '/faq/#cat-2'],
        ['校园生活答疑', '/faq/#cat-3'],
      ],
    },
    {
      id: 'events',
      name: '看宣讲',
      title: '寒假回阜阳，在哪里见？',
      description: '进校日期、学校和场次确定后，小队会在公告页更新。需要联系小队，可以查看目前开放的答疑渠道。',
      links: [
        ['查看阜阳宣讲公告', '/news/'],
        ['查看小队联系渠道', '/ask/'],
      ],
    },
  ];

  const stopButtons = stops.map((stop) => `
    <button type="button" id="stop-${stop.id}" class="route-stop" data-route-stop aria-controls="route-${stop.id}">
      <span class="route-marker" aria-hidden="true"></span>
      <span>${esc(stop.name)}</span>
    </button>
  `).join('');
  const stopDetails = stops.map((stop) => `
    <section class="route-detail" id="route-${stop.id}" data-route-detail aria-labelledby="route-heading-${stop.id}">
      <div class="route-detail-copy">
        <h3 id="route-heading-${stop.id}">${esc(stop.title)}</h3>
        <p>${esc(stop.description)}</p>
      </div>
      <ul class="route-links">
        ${stop.links.map(([label, href]) => `<li><a href="${esc(href)}">${esc(label)}<span aria-hidden="true">↗</span></a></li>`).join('')}
      </ul>
    </section>
  `).join('');
  const news = ctx.news.slice(0, ctx.site.homeNewsCount).map((post) => `
    <a class="home-news-row" href="/news/${esc(post.slug)}/">
      <time datetime="${esc(post.dateISO)}">${esc(post.dateShort)}</time>
      <span>${esc(post.title)}</span>
      <span aria-hidden="true">↗</span>
    </a>
  `).join('');

  const tagline = esc(ctx.site.tagline).replace('带回阜阳', '<span>带回阜阳</span>');
  const body = `
    <section class="journey" aria-labelledby="home-title" data-journey>
      <div class="journey-screen">
        <picture class="journey-photo-wrap">
                  <source media="(max-width: 760px)" srcset="/images/ustb-gate-portrait.webp">
                  <img class="journey-photo journey-photo--gate" src="/images/ustb-gate.webp" width="1100" height="825" alt="北京科技大学主楼与楼前的毛主席像" fetchpriority="high">
                </picture>
        <div class="journey-shade"></div>
        <figure class="team-portraits">
          <div class="portrait-pair">
            <img src="/images/team-noodles.webp" width="520" height="520" alt="打道回阜队吉祥物淮淮：戴麦穗发饰、手捧两碗面">
            <img src="/images/team-peony.webp" width="520" height="520" alt="打道回阜队吉祥物徽徽：戴塔纹头带、手持牡丹">
          </div>
          <figcaption>
            <span class="portrait-caption" aria-live="polite">淮淮</span>
            <button type="button" class="portrait-switch" hidden>换一张 <span aria-hidden="true">⇄</span></button>
          </figcaption>
        </figure>
        <canvas class="journey-map" aria-hidden="true"></canvas>
        <div class="journey-inner">
          <div class="journey-kicker"><span aria-hidden="true">↘</span> 北京科技大学 · 阜阳寒招</div>
          <div class="journey-titles">
            <div class="journey-departure">
              <h1 id="home-title">${tagline}</h1>
              <p>从学院路出发，回阜阳见。<br>我们把大学里的见闻，带回给正在选方向的你。</p>
            </div>
            <div class="journey-arrival" aria-hidden="true">
              <span class="arrival-title">下一站，<strong>阜阳。</strong></span>
              <p>关于录取、专业和大学生活，<br>来听听阜阳学长学姐的回答。</p>
            </div>
          </div>
          <div class="journey-actions"><a class="journey-skip" href="#route">查看寒招路线 <span aria-hidden="true">↘</span></a><a class="journey-album-link" href="#album">看校园秋景</a></div>
          <div class="journey-bottom">
            <div class="journey-timeline" aria-label="从北京到阜阳">
              <span>北京 <small lang="en">BEIJING</small></span>
              <i aria-hidden="true"></i>
              <span>阜阳 <small lang="en">FUYANG</small></span>
            </div>

          </div>
        </div>
      </div>
    </section>
    <section class="home-section wrap" id="route" aria-labelledby="route-title" data-route>
      <div class="home-section-head">
        <h2 id="route-title">寒招路线图</h2>
        <a href="/ask/">联系小队 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="route-board">
        <div class="route-stops" aria-label="寒招路线站点" data-route-stops hidden>${stopButtons}</div>
        <div class="route-details">${stopDetails}</div>
      </div>
    </section>
    <section class="wrap guide-shelf" id="handbook" aria-labelledby="handbook-title">
      <div class="editorial-heading">
        <div><h2 id="handbook-title">阜阳同学的<em>报考手册</em></h2>
        <p>听宣讲前挑一篇读，带着自己的问题来。</p></div>
        <a href="/resources/">资料下载 ↗</a>
      </div>
      <div class="guide-covers">${ctx.guides.map(guideCover).join('')}</div>
    </section>
    <section class="album-section" id="album" aria-labelledby="album-title">
      <div class="wrap">
        <div class="editorial-heading">
          <div><h2 id="album-title">北科大的<em>秋天</em></h2>
          <p>鼎前的银杏、印着 USTB 的气球，还有抬头望见的金色树冠。</p></div>
          <a href="https://news.ustb.edu.cn/stkj/tsbk/jcxy.htm">去看近期校园照片 ↗</a>
        </div>
        <div class="autumn-strip" tabindex="0" role="region" aria-label="北科大秋景相册，可横向浏览">
          <figure><img src="/images/autumn-ding.webp" width="760" height="1017" alt="方鼎背后是满树金黄的银杏" loading="lazy"><figcaption>银杏树下的方鼎</figcaption></figure>
          <figure><img src="/images/autumn-balloon.webp" width="700" height="876" alt="红色 USTB 爱心气球与手中的校园明信片" loading="lazy"><figcaption>把秋天装进明信片</figcaption></figure>
          <figure><img src="/images/autumn-canopy.webp" width="700" height="1006" alt="沿树干仰望层层叠叠的金黄银杏叶" loading="lazy"><figcaption>抬头，满树金黄</figcaption></figure>
        </div>
      </div>
    </section>
    <section class="home-section home-updates wrap" aria-label="小队近况">
      <div class="home-news">
        <div class="home-section-head"><h2>最新动态</h2><a href="/news/">所有公告</a></div>
        ${news || '<p>宣讲安排确定后会在公告页发布。</p>'}
      </div>
      <div class="home-contact">
        <div>
          <h2>想问学长学姐？</h2>
          <p>看看小队目前开放的答疑渠道。</p>
        </div>
        <a href="/ask/" aria-label="查看小队答疑渠道"><span aria-hidden="true">↗</span></a>
      </div>
    </section>
  `;
  return layout(ctx, { path: '/', title: '', active: '/', bodyClass: 'home-page' }, body);
}

function guideCover(guide) {
  return `<a href="/guides/${esc(guide.slug)}/" class="guide-cover cover-${esc(guide.slug)}">
    <span class="cover-subject">${esc(guide.subject)}</span>
    <h3>${esc(guide.title)}</h3><p>${esc(guide.summary)}</p>
    <span class="cover-open">翻开手册 <span aria-hidden="true">↗</span></span>
  </a>`;
}

export function renderGuide(ctx, guide) {
  const body = `<article class="field-guide">
    <header class="guide-mast cover-${esc(guide.slug)}"><div class="wrap article-wrap">
      <a href="/#handbook">← 报考手册</a>
      <p>${esc(guide.subject)}</p><h1>${esc(guide.title)}</h1>
      <div class="guide-deck">${esc(guide.summary)}</div>
    </div></header>
    <div class="wrap article-wrap guide-reading"><div class="prose">${guide.html}</div>
    <nav aria-label="其他手册" class="guide-next">${ctx.guides.filter(item => item !== guide)
      .map(item => `<a href="/guides/${esc(item.slug)}/">${esc(item.title)} ↗</a>`).join('')}</nav></div>
  </article>`;
  return layout(ctx, { path: '/guides/' + guide.slug + '/', title: guide.title, description: guide.summary, ogType: 'article' }, body);
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
    '<section class="section section-alt" style="padding:20px 0"><div class="wrap"><p class="faq-note">涉及分数线、招生计划、专业政策的内容，一律以<strong>北京科技大学本科招生网</strong>和<strong>安徽省教育招生考试院</strong>发布为准；标着【待队内核实】的条目正在核实中，核实后我们会更新。</p></div></section>',
    '<section class="section">',
    '  <div class="wrap faq-layout">',
    '    <aside class="faq-side">',
    '      <p class="side-label">分类</p>',
    ctx.faq
      .map((g) => '<a href="#' + esc(g.slug) + '">' + esc(g.category) + '</a>')
      .join('') || '<span class="muted">暂无</span>',
    '      <a class="side-cta" href="/ask/">查看答疑渠道</a>',
    '    </aside>',
    '    <div class="faq-main">',
    ctx.faq.length
      ? '<div class="faq-search" data-faq-search hidden><label for="faq-query">搜索答疑</label><input class="search" id="faq-query" type="search" placeholder="试试「宿舍」或「转专业」"><p class="faq-search-status" role="status"></p></div>' + groups
      : empty,
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
      qr: c.readyQrs.includes(c.formQr) ? c.formQr : null,
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
  if (c.readyQrs.includes(c.wechatQr)) {
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
              ? '<div class="qr-slot is-ready"><img src="' + esc(ch.qr) + '" alt="' + esc(ch.qrAlt) + '" width="168" height="168" loading="lazy">' +
                '</div>'
              : '') +
            '</article>',
        )
        .join('')
    : '<div class="empty-state"><p>小队的线上答疑渠道正在筹备。</p>' +
      '<p>你可以先<a href="/faq/">查看学生答疑</a>，或<a href="/news/">查看小队公告</a>。</p></div>';

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
    const isOfficial = item.kind === 'official';
    const isLink = item.kind === 'link' || isOfficial;
    const meta = [];
    if (item.size) meta.push(item.size);
    const kindLabel = isOfficial ? '官方入口' : isLink ? '网盘链接' : '站内下载';
    const actionLabel = isOfficial ? '访问官网' : isLink ? '去网盘' : '下载';

    const inner =
      '<span class="res-top">' +
      '<span class="res-kind ' + (isLink ? 'is-link' : 'is-file') + '">' + kindLabel + '</span>' +
      (meta.length ? '<span class="res-meta">' + meta.map(esc).join(' · ') + '</span>' : '') +
      '</span>' +
      '<span class="res-title">' + esc(item.title) + '</span>' +
      (item.desc ? '<span class="res-desc">' + esc(item.desc) + '</span>' : '') +
      (item.href
        ? '<span class="res-action">' + actionLabel + ' <span aria-hidden="true">' + (isLink ? '↗' : '↓') + '</span></span>'
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
        '<section class="res-group" id="' + esc(g.slug) + '" data-group="' + esc(g.slug) + '">' +
        '<h2>' + esc(g.category) + '<span class="count">' + g.items.length + '</span></h2>' +
        '<div class="res-grid">' + g.items.map((item) => card(item, g.slug)).join('') + '</div>' +
        '</section>',
    )
    .join('');

  const body = [
    pageHero('FILES', '资料分享', '查安徽投档信息、北科大招生计划和专业目录，可以直接打开下方的官方入口。也可以下载小队整理的报考数据核对表和专业比较表。'),
    '<section class="section">',
    '  <div class="wrap">',
    '    <div class="res-toolbar">',
    '      <div class="chips" role="tablist" aria-label="资料分类">' + chips + '</div>',
    '      <input class="search" type="search" placeholder="搜索资料名称…" aria-label="搜索资料" data-search-input>',
    '    </div>',
    '    <div class="res-list"' + (groups.length ? '' : ' hidden') + '>' + sections + '</div>',
    groups.length
      ? '<p class="empty-state" data-empty hidden>没有找到匹配的资料。可以更换关键词或选择其他分类。</p>'
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
    '<section class="section"><div class="wrap article-wrap"><div class="prose">' + html,
    '<h3 id="image-credit">图片来源</h3>',
    '<p>首页方鼎与银杏、USTB 爱心气球和银杏树冠三张照片由打道回阜队提供。</p>',
    '<p>「银杏黄了」与「从角旗看球场」摄影为纳瓦拉的亨利，授权为 <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>。两图均缩放、转为 WebP 并在页面裁切，沿用原许可。原作见 <a href="https://commons.wikimedia.org/wiki/File:Ginkgo_trees_of_University_of_Science_and_Technology_Beijing_2017_01.jpg">银杏</a>、<a href="https://commons.wikimedia.org/wiki/File:Football_match_University_of_Science_and_Technology_Beijing_2017_-_01.jpg">足球比赛</a>。</p>',
    '<p>「靠窗的自习位」摄影为 Ccyber5，作者将作品释入公有领域。<a href="https://commons.wikimedia.org/wiki/File:Reading_Room_For_SS_USTB_Library.jpg">阅览室原图</a></p>',
    '</div></div></section>',
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
