// 从构建好的 HTML / CSS 里收集“每种字体实际要渲染的字”。
import { parse } from 'node-html-parser';

const ATTR_SELECTOR = '[data-glyphs], [placeholder], input[value]';

/**
 * @param {string} html
 * @param {Record<string, {selector: string, fixed?: boolean}>} roles
 * @returns {{ text: Record<string, string>, used: Record<string, boolean>, css: string }}
 */
export function collectHtml(html, roles) {
  const root = parse(html, {
    comment: false,
    blockTextElements: { script: true, style: true },
  });

  // 内联 <style> 里可能有 content:"…"，交给 CSS 收集
  const css = root.querySelectorAll('style').map((s) => s.rawText).join('\n');
  for (const el of root.querySelectorAll('script, style')) el.remove();

  const body = root.querySelector('body') ?? root;
  const text = {};
  const used = {};

  for (const [role, { selector, fixed }] of Object.entries(roles)) {
    const els = selector === '*' ? [body] : body.querySelectorAll(selector);
    used[role] = els.length > 0;
    if (fixed) continue;
    let s = '';
    for (const el of els) s += el.text + attrText(el);
    text[role] = s;
  }
  return { text, used, css };
}

// 属性里会被渲染（或将被 JS 渲染）的文字
function attrText(el) {
  let s = ownAttrText(el);
  for (const d of el.querySelectorAll(ATTR_SELECTOR)) s += ownAttrText(d);
  return s;
}

function ownAttrText(el) {
  const a = el.attributes ?? {};
  let s = '';
  if (a['data-glyphs']) s += a['data-glyphs'];
  if (a.placeholder) s += a.placeholder;
  if (el.tagName === 'INPUT' && a.value && /^(button|submit|reset)$/i.test(a.type ?? '')) s += a.value;
  return s;
}

/** CSS 里 content:"…" 的字符串（伪元素文字） */
export function extractCssContent(css) {
  let out = '';
  const decl = /content\s*:\s*([^;}]+)/g;
  const str = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
  for (const m of css.matchAll(decl)) {
    for (const q of m[1].matchAll(str)) out += unescapeCss(q[1] ?? q[2] ?? '');
  }
  return out;
}

function unescapeCss(s) {
  return s
    .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\(.)/g, '$1');
}

/** 字符串 → 码位集合（去掉换行等控制字符） */
export function toCodepoints(str, into = new Set()) {
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp < 0x20 || cp === 0x7f || cp === 0xfeff) continue;
    into.add(cp);
  }
  return into;
}
