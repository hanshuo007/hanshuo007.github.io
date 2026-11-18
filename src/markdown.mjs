// 极简 Markdown 渲染器：零依赖，够用就好。
// 支持：标题、段落、有序/无序列表（含缩进嵌套）、引用、围栏代码块、
// 管道表格、链接、图片、粗体、斜体、删除线、行内代码、分隔线。

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

function safeHref(href) {
  const url = String(href).trim();
  if (/^(javascript|data|vbscript):/i.test(url)) return '#';
  return url;
}

function headingSlug(text) {
  return encodeURIComponent(
    text
      .replace(/<[^>]+>/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'section',
  );
}

function inline(text) {
  const stash = [];
  const keep = (html) => {
    stash.push(html);
    return '\u0000' + (stash.length - 1) + '\u0000';
  };

  let out = escapeHtml(text);

  // 行内代码先抠出来，避免里面的星号被当成强调
  out = out.replace(/(\x60+)([\s\S]*?)\1/g, (m, fence, code) => keep('<code>' + code + '</code>'));

  // 图片
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, alt, src, title) => {
    const url = escapeHtml(safeHref(src));
    const t = title ? ' title="' + escapeHtml(title) + '"' : '';
    return keep('<img src="' + url + '" alt="' + escapeHtml(alt) + '"' + t + ' loading="lazy" decoding="async">');
  });

  // 链接
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, label, href, title) => {
    const url = safeHref(href);
    const external = /^https?:\/\//i.test(url);
    const attrs =
      ' href="' + escapeHtml(url) + '"' +
      (title ? ' title="' + escapeHtml(title) + '"' : '') +
      (external ? ' target="_blank" rel="noopener noreferrer"' : '');
    return keep('<a' + attrs + '>' + label + '</a>');
  });

  out = out.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/~~([\s\S]+?)~~/g, '<del>$1</del>');

  return out.replace(/\u0000(\d+)\u0000/g, (m, i) => stash[Number(i)] ?? '');
}

function codeBlock(code, lang) {
  const cls = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
  return '<pre class="code">' + '<code' + cls + '>' + escapeHtml(code) + '</code></pre>';
}

function splitRow(row) {
  let r = row.trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|')) r = r.slice(0, -1);
  return r.split('|').map((c) => c.trim());
}

function renderTable(head, sep, rows) {
  const aligns = splitRow(sep).map((c) => {
    const left = c.startsWith(':');
    const right = c.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  });
  const cell = (tag, text, idx) => {
    const a = aligns[idx] ? ' style="text-align:' + aligns[idx] + '"' : '';
    return '<' + tag + a + '>' + inline(text) + '</' + tag + '>';
  };
  let html = '<div class="table-wrap"><table><thead><tr>';
  head.forEach((c, idx) => { html += cell('th', c, idx); });
  html += '</tr></thead><tbody>';
  for (const row of rows) {
    html += '<tr>';
    for (let idx = 0; idx < head.length; idx += 1) {
      html += cell('td', row[idx] ?? '', idx);
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function renderList(items) {
  const out = [];
  const stack = [];
  const openList = (ordered) => out.push(ordered ? '<ol>' : '<ul>');
  const closeList = () => {
    const frame = stack.pop();
    out.push(frame.ordered ? '</ol>' : '</ul>');
  };

  for (const item of items) {
    while (stack.length && item.indent < stack[stack.length - 1].indent) {
      out.push('</li>');
      closeList();
    }
    const top = stack[stack.length - 1];
    if (top && item.indent === top.indent) {
      out.push('</li>');
      if (item.ordered !== top.ordered) {
        closeList();
        stack.push({ indent: item.indent, ordered: item.ordered });
        openList(item.ordered);
      }
      out.push('<li>' + inline(item.text));
      continue;
    }
    stack.push({ indent: item.indent, ordered: item.ordered });
    openList(item.ordered);
    out.push('<li>' + inline(item.text));
  }
  while (stack.length) {
    out.push('</li>');
    closeList();
  }
  return out.join('');
}

const FENCE = /^\s*(\x60{3,})\s*([\w+#.-]*)\s*$/;
const FENCE_CLOSE = /^\s*(\x60{3,})\s*$/;
const HEADING = /^\s*(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^\s*((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/;
const UL = /^(\s*)[-*+]\s+(.*)$/;
const OL = /^(\s*)\d+[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

export function renderMarkdown(source) {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let i = 0;

  const isBlank = (line) => line.trim() === '';
  const startsBlock = (line) =>
    FENCE.test(line) || HEADING.test(line) || HR.test(line) || UL.test(line) || OL.test(line) || QUOTE.test(line);

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i += 1;
      continue;
    }

    const fence = line.match(FENCE);
    if (fence) {
      const marker = fence[1];
      const lang = fence[2] || '';
      i += 1;
      const buffer = [];
      while (i < lines.length) {
        const close = lines[i].match(FENCE_CLOSE);
        if (close && close[1].length >= marker.length) {
          i += 1;
          break;
        }
        buffer.push(lines[i]);
        i += 1;
      }
      html.push(codeBlock(buffer.join('\n'), lang));
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 6);
      const rendered = inline(heading[2]);
      html.push('<h' + level + ' id="' + headingSlug(heading[2]) + '">' + rendered + '</h' + level + '>');
      i += 1;
      continue;
    }

    if (HR.test(line)) {
      html.push('<hr>');
      i += 1;
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const head = splitRow(line);
      const sep = lines[i + 1];
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && !isBlank(lines[i])) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      html.push(renderTable(head, sep, rows));
      continue;
    }

    if (QUOTE.test(line)) {
      const buffer = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        buffer.push(lines[i].match(QUOTE)[1]);
        i += 1;
      }
      html.push('<blockquote>' + renderMarkdown(buffer.join('\n')) + '</blockquote>');
      continue;
    }

    if (UL.test(line) || OL.test(line)) {
      const items = [];
      while (i < lines.length) {
        const ul = lines[i].match(UL);
        const ol = lines[i].match(OL);
        if (!ul && !ol) break;
        const m = ul || ol;
        items.push({
          indent: m[1].replace(/\t/g, '  ').length,
          ordered: Boolean(ol),
          text: m[2],
        });
        i += 1;
      }
      html.push(renderList(items));
      continue;
    }

    const paragraph = [];
    while (i < lines.length && !isBlank(lines[i]) && !(paragraph.length > 0 && startsBlock(lines[i]))) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    html.push('<p>' + inline(paragraph.join('\n')) + '</p>');
  }

  return html.join('\n');
}
