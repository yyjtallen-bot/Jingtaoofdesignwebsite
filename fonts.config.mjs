// 字体配置
// ─────────────────────────────────────────────────────────────
// 源字体放在 fonts-src/（只在本机，不上线、不进仓库）。
// 构建时（npm run build）按每个页面实际用到的字生成 woff2 子集，输出到 dist/_fonts/。
// 开发时（npm run dev）直接加载完整源字体，所见即所得。
//
// 思源宋体 / 思源黑体：用 Google 发布的 Noto Serif SC / Noto Sans SC 可变字体，
// 与 Adobe 的 Source Han Serif / Sans 是同一套字形，SIL OFL 1.1 授权，可自托管、可子集化。
// 等宽：DM Mono（OFL 1.1）。想换等宽字体，改 sources.mono400 / mono500 的文件名和地址即可。

const GH = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

export default {
  // 源字体文件。npm run fonts:fetch 会下载缺失的；下载慢可以手动把同名文件放进 fonts-src/。
  sources: {
    serif: {
      file: 'NotoSerifSC[wght].ttf',
      url: `${GH}/notoserifsc/NotoSerifSC%5Bwght%5D.ttf`,
      license: `${GH}/notoserifsc/OFL.txt`,
      axes: { wght: [200, 900] },
    },
    sans: {
      file: 'NotoSansSC[wght].ttf',
      url: `${GH}/notosanssc/NotoSansSC%5Bwght%5D.ttf`,
      license: `${GH}/notosanssc/OFL.txt`,
      axes: { wght: [100, 900] },
    },
    mono400: {
      file: 'DMMono-Regular.ttf',
      url: `${GH}/dmmono/DMMono-Regular.ttf`,
      license: `${GH}/dmmono/OFL.txt`,
    },
    mono500: {
      file: 'DMMono-Medium.ttf',
      url: `${GH}/dmmono/DMMono-Medium.ttf`,
    },
  },

  // 网页里声明的字体，family 名与 src/styles/tokens.css 里的 --font-* 对应。
  // weight 写成 [400, 500] 表示输出一个可变字重子集（比两个静态字重合计约小 30%）。
  faces: [
    { family: 'Site Serif', source: 'serif', weight: 600, role: 'serif', preload: true },
    { family: 'Site Serif', source: 'serif', weight: 900, role: 'display', display: 'block', preload: true },
    { family: 'Site Sans', source: 'sans', weight: [400, 500], role: 'sans', preload: true },
    { family: 'Site Mono', source: 'mono400', weight: 400, role: 'mono', preload: true },
    { family: 'Site Mono', source: 'mono500', weight: 500, role: 'mono' },
  ],

  // 每种字体从哪些元素里收字。
  //   标题：h1–h4 或 class="t-serif"
  //   背景大字：class="t-display"
  //   数字 / 英文小标签：class="t-mono"（只含拉丁字符，全站共用一个固定小文件）
  //   黑体：页面全部文字（兜底，任何地方的字都不会缺）
  // JS 运行时才出现的文字（比如“已复制”），写在元素的 data-glyphs 属性里：
  //   <button data-glyphs="已复制">复制微信号</button>
  roles: {
    serif: { selector: 'h1, h2, h3, h4, .t-serif' },
    display: { selector: '.t-display' },
    sans: { selector: '*' },
    mono: { selector: '.t-mono, time, code, kbd', fixed: true },
  },

  // 每种字体固定加入的字符
  always: {
    serif: digits(),
    display: '',
    sans: printableAscii() + '，。、：；！？「」『』（）《》〈〉【】——…·／　',
    mono: printableAscii() + '—–·×→←↑↓↗↘№©®',
  },

  // 核心页面：这些页面的字合并成一个“核心子集”，全站共享、浏览器可缓存。
  // 其他页面（案例详情等）在核心子集之外，只额外加载自己独有的字（增量子集）。
  // 路径相对 dist/，* 匹配一层目录。
  corePages: ['index.html', 'work/*/index.html'],
};

function printableAscii() {
  let s = '';
  for (let c = 0x20; c <= 0x7e; c++) s += String.fromCharCode(c);
  return s;
}
function digits() {
  return '0123456789';
}
