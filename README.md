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

站点已经上线：**https://dadaohuifu.netlify.app**（Netlify 免费计划）。

### 改了内容怎么发上去

```
node build.mjs
NETLIFY_TOKEN=你的token node _tools/netlify-deploy.mjs dadaohuifu
```

脚本会自己建站（已存在就复用）、用零依赖打包器压缩 `dist`、上传、等到部署完成，然后打印地址。Token 在 Netlify 的 `User settings → Applications → Personal access tokens` 里生成。

### 绑自己的域名

完整步骤在 `docs/域名与部署指南.md`（Netlify 版）：选域名、在哪注册、要不要备案、DNS 记录填什么、出问题怎么查。最短路径：

1. 买域名（阿里云 / 腾讯云 / Cloudflare Registrar 都行）。
2. Netlify 项目 → `Domain management → Add a domain`，填你的域名。
3. 按面板显示的值加 DNS 记录（根域名一条 A、www 一条 CNAME，值必须照抄面板）。

换好域名后回到 `site.config.mjs` 把 `site.url` 改成 `https://你的域名`，重建并重新部署一次（RSS 与 sitemap 用的是绝对地址）。

### 两个踩过的坑（别再踩）

- **新建站点默认开着访问保护**，所有人打开都是 `401 Login Redirect`。要在 `Project configuration → Access control` 里关掉（API 上是 `sso_login: false`）。
- **别用 Windows 自带的压缩去打包**。`Compress-Archive` 和 .NET 的 `ZipFile` 会把路径写成反斜杠，上传后首页正常、所有子页面 404。用仓库里的 `_tools/zip.mjs`。
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
