// @font-face 规则生成（纯函数，页面组件也会引用）

/** 布局里放这个标记；构建后被替换成 @font-face + preload */
export const MARKER = '<meta name="font-subset" content="">';

/** 码位数组 → 紧凑的 unicode-range 字符串，如 U+4E00,U+4E8C-4E8D */
export function toUnicodeRange(codepoints) {
  const cps = [...codepoints].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < cps.length; ) {
    let j = i;
    while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
    const a = cps[i].toString(16).toUpperCase();
    parts.push(j > i ? `U+${a}-${cps[j].toString(16).toUpperCase()}` : `U+${a}`);
    i = j + 1;
  }
  return parts.join(',');
}

export function weightValue(weight) {
  return Array.isArray(weight) ? weight.join(' ') : String(weight);
}

export function fontFaceRule({ family, weight, url, display = 'swap', range, format = 'woff2' }) {
  return (
    `@font-face{font-family:"${family}";font-style:normal;font-weight:${weightValue(weight)};` +
    `font-display:${display};src:url(${url}) format("${format}")` +
    (range ? `;unicode-range:${range}` : '') +
    `}`
  );
}

/** 开发模式：直接用完整源字体（由开发服务器的 /_fonts-src/ 提供） */
export function devFontFaceCss(config, base = '/') {
  const prefix = base.replace(/\/?$/, '/') + '_fonts-src/';
  return config.faces
    .map((face) => {
      const src = config.sources[face.source];
      const format = /\.otf$/i.test(src.file) ? 'opentype' : 'truetype';
      return fontFaceRule({
        family: face.family,
        weight: face.weight,
        display: face.display,
        url: prefix + encodeURIComponent(src.file),
        format,
      });
    })
    .join('\n');
}
