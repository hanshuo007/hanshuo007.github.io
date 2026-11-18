// 小队徽标：纯 SVG，不依赖任何图片文件。
// 符号构成：回形方框（打道回「阜」的「回」）+ 金色环弧（返乡的轨迹）+ 两道水波（颍河）。
// 等美术同学出了正式稿，把 public/brand/logo.svg 换掉、这里同步改一处即可。

const INK = '#0e2340';
const PAPER = '#f7f5f0';
const GOLD = '#d9a441';
const BLUE = '#2f6fd0';

export function logoMark(size, options) {
  const opts = options || {};
  const cls = opts.className ? ' class="' + opts.className + '"' : '';
  const title = opts.title ? '<title>' + opts.title + '</title>' : '';
  return [
    '<svg' + cls + ' width="' + size + '" height="' + size + '" viewBox="0 0 120 120" role="img" aria-label="' +
      (opts.label || '打道回阜队队徽') + '" xmlns="http://www.w3.org/2000/svg">',
    title,
    '<circle cx="60" cy="60" r="56" fill="' + INK + '"/>',
    '<circle cx="60" cy="60" r="49" fill="none" stroke="' + PAPER + '" stroke-opacity="0.18" stroke-width="1.5"/>',
    // 金色环弧 + 箭头：返乡
    '<path d="M60 16 A44 44 0 0 1 101 79" fill="none" stroke="' + GOLD + '" stroke-width="4.5" stroke-linecap="round"/>',
    '<path d="M101 79 l-10 -3.5 l6.5 -8.5 z" fill="' + GOLD + '"/>',
    // 回形方框
    '<rect x="38" y="33" width="44" height="42" rx="9" fill="none" stroke="' + PAPER + '" stroke-width="4"/>',
    '<rect x="52" y="46" width="16" height="16" rx="4" fill="' + PAPER + '"/>',
    // 水波
    '<path d="M32 88 q9 -7 18 0 t18 0 t18 0" fill="none" stroke="' + BLUE + '" stroke-width="3.2" stroke-linecap="round"/>',
    '<path d="M38 97 q7 -6 14 0 t14 0 t14 0" fill="none" stroke="' + BLUE + '" stroke-opacity="0.55" stroke-width="2.6" stroke-linecap="round"/>',
    '</svg>',
  ].join('');
}

export function logoFile() {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">',
    '<circle cx="60" cy="60" r="56" fill="' + INK + '"/>',
    '<path d="M60 16 A44 44 0 0 1 101 79" fill="none" stroke="' + GOLD + '" stroke-width="4.5" stroke-linecap="round"/>',
    '<path d="M101 79 l-10 -3.5 l6.5 -8.5 z" fill="' + GOLD + '"/>',
    '<rect x="38" y="33" width="44" height="42" rx="9" fill="none" stroke="' + PAPER + '" stroke-width="4"/>',
    '<rect x="52" y="46" width="16" height="16" rx="4" fill="' + PAPER + '"/>',
    '<path d="M32 88 q9 -7 18 0 t18 0 t18 0" fill="none" stroke="' + BLUE + '" stroke-width="3.2" stroke-linecap="round"/>',
    '<path d="M38 97 q7 -6 14 0 t14 0 t14 0" fill="none" stroke="' + BLUE + '" stroke-opacity="0.55" stroke-width="2.6" stroke-linecap="round"/>',
    '</svg>',
  ].join('');
}

// 首页主视觉里用的装饰环
export function orbitRings() {
  return [
    '<svg class="orbit" viewBox="0 0 420 420" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">',
    '<circle cx="210" cy="210" r="200" fill="none" stroke="currentColor" stroke-opacity="0.12" stroke-width="1"/>',
    '<circle cx="210" cy="210" r="160" fill="none" stroke="currentColor" stroke-opacity="0.16" stroke-width="1" stroke-dasharray="2 8"/>',
    '<circle cx="210" cy="210" r="118" fill="none" stroke="currentColor" stroke-opacity="0.1" stroke-width="1"/>',
    '<circle cx="210" cy="10" r="4" fill="' + GOLD + '"/>',
    '<circle cx="352" cy="322" r="3" fill="currentColor" fill-opacity="0.35"/>',
    '</svg>',
  ].join('');
}
