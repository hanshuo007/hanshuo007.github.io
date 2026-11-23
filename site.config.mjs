// 站点配置：日常只需要改这一个文件。
export const site = {
  // 队名（页头、页脚、浏览器标签）
  team: '打道回阜队',
  // 完整署名（页脚、关于页）
  org: '北京科技大学 · 安徽分团 · 阜阳队',
  school: '北京科技大学',
  // 一句话定位（首页大标题下面那行）
  tagline: '把北科大带回阜阳',
  slogan: '打道回阜，把答案带回来',
  // 站点描述（搜索引擎摘要）
  description:
    '北京科技大学安徽分团阜阳队「打道回阜队」的小站：回答高中生关于北科大、专业选择与志愿填报的问题，并把招生资料整理好放在这里。',
  // 站点所在的域名（协议 + 主机，结尾不要带斜杠）。RSS / sitemap / 分享卡片都靠它。
  url: 'https://dadaohuifu.cn',
  // 站点挂在域名下的哪一层路径。GitHub 用户站（仓库 <用户名>.github.io）填 ''；
  // 项目站（仓库 dadaohuifu）填 '/dadaohuifu'；将来绑自己的域名，改回 '' 重新构建即可。
  basePath: '',
  lang: 'zh-CN',
  // 首页显示几条最新公告
  homeNewsCount: 3,
};

// 联系方式：上线前必须填，留空的地方页面上会显示「待开放」。
export const contact = {
  // 提问表单（问卷星 / 腾讯文档 / 飞书表单都行），粘贴完整链接
  formUrl: '',
  formLabel: '在线提问表',
  // 提问表单在手机上扫码直接填，把这个二维码图片放到 public/contact/form-qr.png
  formQr: '/contact/form-qr.png',
  // 答疑 QQ 群号
  qqGroup: '',
  // 微信群二维码图片，放到 public/contact/wechat-qr.png
  wechatQr: '/contact/wechat-qr.png',
  // 公开邮箱（可留空）
  email: '',
};

// 顶部导航：改顺序或加页面都在这里
export const nav = [
  { label: '首页', href: '/' },
  { label: '答疑', href: '/faq/' },
  { label: '资料', href: '/resources/' },
  { label: '公告', href: '/news/' },
  { label: '关于', href: '/about/' },
];
