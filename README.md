# 打道回阜队 · 小队官网

北京科技大学 安徽分团 · 阜阳队的站点。三个用处：**小队门面（IP）**、**学生答疑**、**资料分享**。

纯静态站：没有数据库、没有后端、没有第三方依赖。构建产物是一堆 HTML，扔到哪里都能跑，放在 Cloudflare Pages 上就自动有 HTTPS 和全球 CDN。这套东西十年后还能构建出来，因为除了 Node 本身，它不依赖任何会烂掉的东西。

---

## 一、先跑起来

需要 Node 18 或更新的版本（队里任何一台电脑装一次就行）。

`@
node build.mjs      # 构建，产物在 dist/
node dev.mjs        # 本地预览 http://localhost:4321 ，改文件自动重建
`@

没有 npm install 这一步——项目零依赖。

---

## 二、日常改内容，只动 content/ 和 site.config.mjs

### 1. 改队名、口号、联系方式

打开 `site.config.mjs`，全部集中在一个文件里：

| 要改的东西 | 改哪里 |
| --- | --- |
| 队名 / 完整署名 / 一句话定位 | `site.team` / `site.org` / `site.tagline` |
| 正式域名（上线后必改） | `site.url` |
| 提问表单链接、QQ 群号、邮箱 | `contact` 里的 `formUrl` / `qqGroup` / `email` |

二维码图片放进 `public/contact/`，文件名用 `form-qr.png`（表单）和 `wechat-qr.png`（微信群）。没放图时页面显示「二维码待上传」占位，不会出现裂图。

### 2. 加一条答疑

在 `content/faq/` 里挑一个分类文件，复制一段改掉：

`@markdown
### 问题是高中生会怎么问？
答案正文。可以分段、可以用列表、可以加粗。
`@

规则：问题用三个井号 `###`，答案紧跟其后；文件头部的 `category` 和 `order` 控制分类名与排序。新建分类文件也行，只要 front-matter 写对。

### 3. 加一份资料

两步：

1. 文件丢进 `public/files/`（单个文件建议 20MB 以内，大的走网盘）。
2. 在 `content/resources.json` 里复制一个条目：

`@json
{
  "title": "资料名称",
  "desc": "一句话说明，写给高中生看",
  "kind": "file",
  "href": "/files/xxx.pdf",
  "size": "PDF"
}
`@

`kind` 填 `file` 是站内下载、填 `link` 是网盘（此时 `href` 填完整链接）。`href` 留空 = 页面显示「待上传」，不会出现死链。

### 4. 发一条公告

在 `content/news/` 新建一个 `.md`，文件名就是网址（`dongji-xuanjiang.md` → `/news/dongji-xuanjiang/`）：

`@markdown
---
title: 标题
date: 2026-11-20
summary: 一句话摘要，会显示在列表和 RSS 里
tags: [公告]
---

正文。
`@

### 5. 改「关于我们」页

直接编辑 `content/about.md`，普通 Markdown。

---

## 三、那些【待…】是什么

生成的内容里保留了 30 处占位，形如 `【待队内核实：…】` 、`【待填：…】`。它们故意留在正文里，就是让它们刺眼：

- **【待队内核实】** 涉及分数线、政策、名额等具体数字。填之前务必以学校官网或安徽省教育招生考试院为准，别抄群里的截图。
- **【待填】** 是群号、二维码、姓名这类只有队里才知道的信息。

每次构建都会打印还剩多少处：

`@
构建完成：7 个页面（答疑 19 条 / 资料 7 份 / 公告 1 篇，另有 30 处内容待填，搜索「【待」就能找到）
`@

在编辑器里全局搜索 `【待` 就能逐个处理。

---

## 四、上线

站点已经上线：**https://hanshuo007.github.io/**（GitHub Pages，免费、无水印）。

> 仓库名是 `hanshuo007.github.io`，所以这是 GitHub 的**用户站**，站点直接挂在域名根路径。仓库名必须一字不差，改名就会掉到 `/仓库名/` 子路径、根地址直接 404 —— 这个坑我们已经踩过一次。

> `site.config.mjs` 里的 `basePath` 目前是空字符串 `''`。如果哪天站点被迫挂在子路径（比如仓库改名成 `dadaohuifu`，变成项目站），把它改成 `'/dadaohuifu'` 再推一次，构建会自动给所有链接、RSS、sitemap 加上前缀。

> 旧的 `/dadaohuifu/` 地址由一个单独的跳转仓库兜底（<https://hanshuo007.github.io/dadaohuifu/> → 自动跳回主站），所以之前发出去的链接不会失效。

同一次 push 还会同步发布一份到 Netlify 作为镜像：<https://dadaohuifu.netlify.app>（那份带“Powered by Netlify”角标，是免费计划的强制项，删不掉，只当备用线路）。

### 改了内容怎么发上去

**推荐：直接推送到 GitHub，什么都不用装。** 仓库连了 GitHub Actions（`.github/workflows/deploy.yml`）：

1. 在 GitHub 网页上改，或者本地 `git push` 到 `main`；
2. GitHub 自动跑 `node build.mjs` 构建 + 自检，再调用 Netlify API 上线；
3. 一两分钟后刷新站点就是新版。构建日志在仓库的 Actions 页。

**备选：在本地手动部署**（没有 GitHub 账号或有网络问题时）：

```
node build.mjs
NETLIFY_TOKEN=你的token node scripts/netlify-deploy.mjs dadaohuifu
```

脚本会自己建站（已存在就复用）、用零依赖打包器压缩 `dist`、上传、等到部署完成，然后打印地址。Token 在 Netlify 的 `User settings → Applications → Personal access tokens` 里生成。

### 绑自己的域名

完整步骤在 `docs/域名与部署指南.md`（GitHub Pages 版，Netlify 作附录）：选域名、在哪注册、要不要备案、DNS 记录填什么、出问题怎么查。最短路径：

1. 买域名（阿里云 / 腾讯云 / Cloudflare Registrar 都行）。
2. 仓库 **Settings → Pages → Custom domain** 填你的域名。
3. 到域名注册商处按官方要求加 DNS 记录（根域名 A 记录、www 的 CNAME → `hanshuo007.github.io`），具体值以 GitHub 文档/设置页提示为准，别抄二手博客。
4. 等证书签发后勾上 **Enforce HTTPS**。

换好域名后回到 `site.config.mjs` 把 `site.url` 改成 `https://你的域名`（`basePath` 保持 `''`），重建并重新部署一次（RSS 与 sitemap 用的是绝对地址）。

### 两个踩过的坑（别再踩）

- **新建站点默认开着访问保护**，所有人打开都是 `401 Login Redirect`。要在 `Project configuration → Access control` 里关掉（API 上是 `sso_login: false`）。
- **别用 Windows 自带的压缩去打包**。`Compress-Archive` 和 .NET 的 `ZipFile` 会把路径写成反斜杠，上传后首页正常、所有子页面 404。用仓库里的 `scripts/zip.mjs`。
- 免费计划会强制带一个「Powered by Netlify」徽标，无法去掉（API 明确返回 `not available on this plan`）。要干净的无徽标方案，只有 GitHub Pages（需要 GitHub 账号）。

---

## 五、目录结构

`@
site.config.mjs        站点配置（队名、域名、联系方式）—— 最常改的文件
build.mjs              构建脚本：读 content/ 生成 dist/
dev.mjs                本地预览服务器
content/
  about.md             关于我们
  faq/*.md             答疑（一个文件一个分类）
  news/*.md            公告
  resources.json       资料清单
src/
  markdown.mjs         自己写的 Markdown 渲染器
  templates.mjs        页面模板
  brand.mjs            队徽 SVG（几何图形，随时可换）
  styles/main.css      样式与配色令牌
  client/app.js        深浅色切换、资料筛选
public/                原样复制到站点根目录（放二维码、PDF 等）
docs/                  域名与部署指南
scripts/check-links.mjs  上线前自检
`@

---

## 六、常见问题

**构建报错说找不到 content/faq？** 目录被删了，重建一个空目录就行，页面会显示「内容整理中」。

**改了内容线上还是旧版？** Cloudflare Pages 有缓存，等一分钟；浏览器也可能缓存，Ctrl+F5 强制刷新。

**二维码不显示？** 图片没放进 `public/contact/`，或文件名不对（必须是 `form-qr.png` / `wechat-qr.png`）。

**想换配色？** 改 `src/styles/main.css` 顶部的 `--ink` / `--blue` / `--gold` 三个令牌，全站跟着变。

**想换队徽？** 改 `src/brand.mjs` 里的 SVG（美术出了正式稿也可以换成 `<img>`）。

**换届交接怎么办？** 交接清单：域名注册商账号 → Cloudflare 账号 → 这个 Git 仓库 → `docs/域名与部署指南.md` 里的「换届交接」小节。人和密码比代码更容易丢。

---

## 七、上线前自检

`@
npm run check
`@

会构建一遍，然后检查每个页面有没有 title/description、站内链接和静态资源是否都存在。上线前跑一次，能挡住绝大多数「点了 404」的情况。
