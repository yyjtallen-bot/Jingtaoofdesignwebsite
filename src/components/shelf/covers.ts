// 书架 12 本书的封面设计（每本一个概念，画布 200 × 280）。
//
// 颜色全部跟着装帧色走（tokens.css 里每种装帧的 --b-fg 前景 / --b-ac 主色 / --b-pa 纸色 /
// --b-on 主色上的字 / --b-bg 底色），在后台换了装帧色，封面会自动换色。
// 网点图案在 HalftoneDefs.astro（cv-f1/f2/f3 前景网点，cv-a1/a2/a3 主色网点，cv-o1 主色上的网点）。
// 每本书的画面只在页面里画一次（<symbol id="cv-分类id">），书架上的书用 <use> 引用，手机上不会变重。
//
// 书名、英文名取自分类设置；右下角的概念字写在这里。想改某本书的画面，改对应 id 的那一段即可。
// 在后台给某本书上传了封面图时，以上传的图片为准，不用这里的设计。

export interface CoverInfo {
  id: string;
  no: string;
  name: string;
  en: string;
  binding: string;
}

type Pat = (kind: string) => string;
type Art = (c: CoverInfo, P: Pat, tagline: string) => string;

const f = (n: number) => n.toFixed(1);
const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
const isCJK = (ch: string) => /[㐀-鿿]/.test(ch);
const cjk = (s: string) => [...s].filter(isCJK).join('');
const latin = (s: string) => [...s].filter((ch) => !isCJK(ch)).join('').trim();

// 颜色与字体（行内样式，<use> 引用时也能按每本书的装帧色解析）
const FILL = {
  f: 'fill:var(--b-fg)',
  a: 'fill:var(--b-ac)',
  p: 'fill:var(--b-pa)',
  o: 'fill:var(--b-on)',
  k: 'fill:var(--b-bg)',
};
type Fill = keyof typeof FILL;
const SF = 'style="fill:none;stroke:var(--b-fg)"';
const SA = 'style="fill:none;stroke:var(--b-ac)"';
const SO = 'style="fill:none;stroke:var(--b-on)"';
const FONT = {
  s: 'font-family:var(--font-serif);font-weight:600',
  b: 'font-family:var(--font-serif);font-weight:900',
  r: 'font-family:var(--font-serif);font-weight:400',
  m: 'font-family:var(--font-mono);font-weight:400',
};
type Font = keyof typeof FONT;
const fl = (c: Fill) => `style="${FILL[c]}"`;

/** 横排文字 */
function H(t: string, x: number, y: number, size: number, c: Fill = 'f', anchor = 'start', ls = 0, font: Font = 's') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" letter-spacing="${ls}" style="${FILL[c]};${FONT[font]}">${esc(t)}</text>`;
}
/** 竖排文字：逐字往下排（空格跳过） */
function V(t: string, x: number, y: number, size: number, c: Fill = 'f', step = size * 1.08) {
  return [...t.replace(/\s+/g, '')]
    .map((ch, i) => H(ch, x, +f(y + i * step), size, c, 'middle'))
    .join('');
}
/** 竖排文字占到的底部位置 */
const vEnd = (t: string, y: number, size: number) => y + (t.replace(/\s+/g, '').length - 1) * size * 1.08 + size * 0.2;

// ── 12 本 ─────────────────────────────────────────────
const covers: Record<string, { word: string; art: Art }> = {
  // 01 APP 界面 · 方寸：像素方格从被点中的一点漾开成涟漪
  app: {
    word: '方寸',
    art: (c) => {
      const tx = 55;
      const ty = 154;
      let s = '';
      for (let y = 46; y <= 236; y += 9)
        for (let x = 10; x <= 140; x += 9) {
          const d = Math.hypot(x - tx, y - ty);
          const fall = Math.max(0, 1 - d / 115);
          const ring = 0.5 + 0.5 * Math.cos(d / 7.2);
          const z = 7.6 * Math.pow(fall, 0.7) * (0.22 + 0.78 * ring);
          if (z < 0.7) continue;
          s += `<rect x="${f(x - z / 2)}" y="${f(y - z / 2)}" width="${f(z)}" height="${f(z)}" fill-opacity="${f(0.3 + 0.65 * fall)}" ${fl('f')}/>`;
        }
      s += `<circle cx="${tx}" cy="${ty}" r="11" stroke-width=".6" ${SF}/>`;
      const t = cjk(c.name) || c.name;
      const end = vEnd(t, 92, 34);
      return s + V(t, 168, 92, 34) + `<line x1="168" x2="168" y1="${f(end + 16)}" y2="214" stroke-opacity=".5" stroke-width=".5" ${SF}/>`;
    },
  },

  // 02 网页设计 · 栅格：栏线 + 冲出右边缘的色块，底下的网点层像套色错位
  web: {
    word: '栅格',
    art: (c, P) => {
      let s = '';
      for (let i = 0; i <= 6; i++) {
        const x = 20 + i * 27;
        s += `<line x1="${x}" x2="${x}" y1="44" y2="236" stroke-opacity=".1" stroke-width=".5" ${SF}/>`;
      }
      s += `<rect x="20" y="48" width="162" height="5" ${fl('f')}/>`;
      s += `<rect x="68" y="80" width="140" height="84" fill="${P('f2')}"/><rect x="76" y="71" width="140" height="84" fill-opacity=".9" ${fl('a')}/>`;
      for (const [y, w] of [
        [178, 70],
        [186, 50],
        [194, 62],
      ])
        s += `<rect x="76" y="${y}" width="${w}" height="2.4" fill-opacity=".75" ${fl('f')}/>`;
      s += `<rect x="76" y="208" width="30" height="9" ${fl('a')}/>`;
      const n = [...c.name.replace(/\s+/g, '')];
      const big = n.slice(0, 2).join('');
      const small = n.slice(2).join('');
      return s + V(big, 40, 100, 30) + (small ? V(small, 40, +f(vEnd(big, 100, 30) + 16), 13) : '');
    },
  },

  // 03 小程序 · 即用：高保真手机界面，被底线裁断；右上角的胶囊按钮被标注出来
  miniapp: {
    word: '即用',
    art: (c, P, tagline) => {
      let s = '';
      s += `<path d="M62 238 V67 A17 17 0 0 1 79 50 H159 A17 17 0 0 1 176 67 V238 Z" ${fl('f')}/>`;
      s += `<path d="M66 238 V67 A13 13 0 0 1 79 54 H159 A13 13 0 0 1 172 67 V238 Z" ${fl('p')}/>`;
      s += `<rect x="104" y="58" width="30" height="8" rx="4" ${fl('f')}/>`;
      s += H('9:41', 74, 64.5, 5.5, 'f', 'start', 0, 'm');
      s += [62, 61, 60, 59]
        .map((y, i) => `<rect x="${f(147 + i * 2.2)}" y="${y}" width="1.3" height="${64 - y}" ${i === 3 ? 'fill-opacity=".35" ' : ''}${fl('f')}/>`)
        .join('');
      s += `<rect x="157.5" y="59.5" width="9" height="4.5" rx="1.2" stroke-width=".5" ${SF}/><rect x="158.5" y="60.5" width="6" height="2.5" rx=".5" ${fl('f')}/>`;
      // 导航栏：标题 + 胶囊按钮
      s += H(tagline, 112, 81, 6.5, 'f', 'middle');
      s += `<rect x="144" y="73" width="24" height="11" rx="5.5" ${fl('p')}/><rect x="144" y="73" width="24" height="11" rx="5.5" stroke-opacity=".35" stroke-width=".5" ${SF}/>`;
      s += `<circle cx="149.5" cy="78.5" r=".8" ${fl('f')}/><circle cx="152" cy="78.5" r="1.1" ${fl('f')}/><circle cx="154.5" cy="78.5" r=".8" ${fl('f')}/>`;
      s += `<line x1="157" x2="157" y1="75.5" y2="81.5" stroke-opacity=".3" stroke-width=".4" ${SF}/>`;
      s += `<circle cx="162.2" cy="78.5" r="2.6" stroke-width=".7" ${SF}/><circle cx="162.2" cy="78.5" r="1" ${fl('f')}/>`;
      s += `<line x1="66" x2="172" y1="89" y2="89" stroke-opacity=".1" stroke-width=".5" ${SF}/>`;
      // 轮播图：网点远山 + 月
      s += `<rect x="72" y="94" width="94" height="46" rx="4" ${fl('a')}/>`;
      s += `<circle cx="150" cy="105" r="6" ${fl('o')}/>`;
      s += `<path d="M72 132 L92 115 L104 125 L121 108 L141 127 L166 116 L166 136 Q166 140 162 140 L76 140 Q72 140 72 136 Z" fill="${P('o1')}"/>`;
      s += H('新品上市', 78, 106, 7.5, 'o');
      s += `<line x1="78" x2="96" y1="110" y2="110" stroke-opacity=".6" stroke-width=".4" ${SO}/>`;
      // 金刚区：四个入口
      s += `<circle cx="84" cy="153" r="6.5" ${fl('a')}/><circle cx="106" cy="153" r="6.5" ${fl('k')}/><circle cx="128" cy="153" r="6" stroke-width=".8" ${SA}/><circle cx="150" cy="153" r="6.5" fill="${P('f2')}"/>`;
      s += [78, 100, 122, 144].map((x) => `<rect x="${x}" y="164" width="12" height="1.6" fill-opacity=".35" ${fl('f')}/>`).join('');
      // 列表
      s += `<rect x="72" y="173" width="18" height="18" rx="2" ${fl('k')}/>`;
      s += `<rect x="95" y="176" width="46" height="2.2" fill-opacity=".8" ${fl('f')}/><rect x="95" y="182" width="30" height="1.8" fill-opacity=".35" ${fl('f')}/>`;
      s += `<rect x="148" y="180" width="18" height="6.5" rx="3.25" stroke-width=".5" ${SA}/>`;
      s += `<line x1="95" x2="166" y1="195" y2="195" stroke-opacity=".1" stroke-width=".5" ${SF}/>`;
      s += `<rect x="72" y="199" width="18" height="18" rx="2" fill="${P('f2')}"/>`;
      s += `<rect x="95" y="202" width="52" height="2.2" fill-opacity=".8" ${fl('f')}/><rect x="95" y="208" width="24" height="1.8" fill-opacity=".35" ${fl('f')}/>`;
      s += `<rect x="148" y="206" width="18" height="6.5" rx="3.25" ${fl('a')}/>`;
      s += `<rect x="72" y="223" width="94" height="13" rx="6.5" ${fl('a')}/>`;
      s += H('立即预约', 119, 231.6, 6, 'o', 'middle', 1, 'r');
      // 标注
      s += `<circle cx="156" cy="78.5" r="15.5" stroke-width=".6" stroke-dasharray="2 1.5" ${SA}/>`;
      s += `<path d="M167 67.5 L180 48 H182" stroke-width=".5" ${SA}/>`;
      s += H('胶囊按钮', 182, 45, 6, 'a', 'end', 1, 'r');
      const end = vEnd(c.name, 76, 22);
      return s + V(c.name, 36, 76, 22) + `<line x1="36" x2="36" y1="${f(end + 12)}" y2="210" stroke-opacity=".5" stroke-width=".5" ${SF}/>`;
    },
  },

  // 04 B 端后台 · 秩序：46 根细线组成数据的节奏，只有一根被标出来
  admin: {
    word: '秩序',
    art: (c) => {
      let s = '';
      for (const y of [120, 160]) s += `<line x1="18" x2="186" y1="${y}" y2="${y}" stroke-opacity=".2" stroke-width=".5" ${SF}/>`;
      for (let i = 0; i < 46; i++) {
        const x = 18 + i * 3.7;
        const h = 22 + 88 * (0.5 + 0.5 * Math.sin(i * 0.33)) * (0.55 + 0.45 * Math.cos(i * 0.12 + 1.3));
        if (i === 30) {
          s += `<rect x="${f(x - 1.8)}" y="${f(200 - h)}" width="3.6" height="${f(h)}" ${fl('f')}/>`;
          s += `<circle cx="${f(x)}" cy="${f(200 - h - 7)}" r="2.6" ${fl('f')}/>`;
          s += `<line x1="${f(x)}" x2="${f(x)}" y1="${f(200 - h - 10)}" y2="84" stroke-width=".5" ${SF}/>`;
        } else s += `<line x1="${f(x)}" x2="${f(x)}" y1="200" y2="${f(200 - h)}" stroke-opacity=".7" stroke-width="1" ${SF}/>`;
      }
      s += `<line x1="18" x2="186" y1="200" y2="200" stroke-width=".8" ${SF}/>`;
      for (let x = 20; x <= 182; x += 18) s += `<line x1="${x}" x2="${x}" y1="200" y2="205" stroke-opacity=".5" stroke-width=".5" ${SF}/>`;
      return s + H(c.name, 20, 68, 20, 'f', 'start', 2);
    },
  },

  // 05 交互动效 · 缓动：圆沿减速曲线运动，越往后越密，最后停下的那一个是实心的
  motion: {
    word: '缓动',
    art: (c) => {
      const pts: [number, number, number][] = [];
      for (let k = 0; k <= 13; k++) {
        const t = k / 13;
        const e = 1 - Math.pow(1 - t, 3);
        pts.push([30 + 140 * e, 214 - 138 * Math.sin((e * Math.PI) / 2), t]);
      }
      let s = `<polyline points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}" stroke-opacity=".25" stroke-width=".5" stroke-dasharray="1 2" ${SF}/>`;
      pts.forEach(([x, y, t], k) => {
        s +=
          k === 13
            ? `<circle cx="${f(x)}" cy="${f(y)}" r="12" ${fl('a')}/>`
            : `<circle cx="${f(x)}" cy="${f(y)}" r="12" stroke-opacity="${f(0.12 + 0.6 * t)}" stroke-width=".7" ${SF}/>`;
      });
      return s + V(c.name, 174, 142, 16);
    },
  },

  // 06 Logo/VI · 方圆：方与圆交叠，交集是主色；网点由小到大渐变；一枚「方圆」小印
  identity: {
    word: '方圆',
    art: (c) => {
      let s = '';
      for (let y = 102; y <= 192; y += 4.5)
        for (let x = 94; x <= 182; x += 4.5) {
          const u = (x - 92) / 92;
          const v = (y - 100) / 92;
          s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.4 + 1.6 * (u * 0.5 + (1 - v) * 0.5))}" ${fl('f')}/>`;
        }
      // 方块与圆的交集（按几何算好的形状，不用裁剪）
      s += `<path d="M92 100 L139.5 100 A64 64 0 0 1 92 191.2 Z" ${fl('a')}/>`;
      s += `<circle cx="82" cy="128" r="64" stroke-width="1" ${SF}/>`;
      s += `<rect x="160" y="200" width="22" height="30" ${fl('a')}/>` + H('方', 171, 213, 9, 'o', 'middle', 0, 'r') + H('圆', 171, 225, 9, 'o', 'middle', 0, 'r');
      return s + H(c.name, 20, 224, 22);
    },
  },

  // 07 海报 · 张力：一个巨大的网点字冲出封面右边和下边，被底线硬生生裁断
  poster: {
    word: '张力',
    art: (c, P) => {
      const t = cjk(c.name) || c.name;
      const glyph = [...t].pop() ?? '';
      let s = `<text x="58" y="234" font-size="212" fill="${P('f3')}" style="${FONT.b}">${esc(glyph)}</text>`;
      s += `<rect x="0" y="238" width="200" height="42" ${fl('k')}/>`;
      const end = vEnd(t, 72, 22);
      return s + V(t, 34, 72, 22) + `<line x1="34" x2="34" y1="${f(end + 10)}" y2="230" stroke-opacity=".5" stroke-width=".5" ${SF}/>`;
    },
  },

  // 08 名片与物料 · 层叠：一叠名片，最上面那张就是书名；四角裁切线、两侧套准标、左下色标
  print: {
    word: '层叠',
    art: (c, P) => {
      let s = '';
      const [x0, y0, x1, y1] = [24, 48, 178, 232];
      for (const [x, y, sx, sy] of [
        [x0, y0, -1, -1],
        [x1, y0, 1, -1],
        [x0, y1, -1, 1],
        [x1, y1, 1, 1],
      ])
        s += `<path d="M${x + sx * 3} ${y} h${sx * 9} M${x} ${y + sy * 3} v${sy * 9}" stroke-width=".6" ${SF}/>`;
      for (const [x, y] of [
        [13, 140],
        [189, 140],
      ])
        s += `<circle cx="${x}" cy="${y}" r="4.5" stroke-width=".6" ${SF}/><path d="M${x - 7} ${y} h14 M${x} ${y - 7} v14" stroke-width=".5" ${SF}/>`;
      const card = (a: number, body: string, extra = '') =>
        `<g transform="translate(102 140) rotate(${a})"><rect x="-52" y="-31" width="104" height="62" ${body}/>${extra}</g>`;
      s += card(-15, `stroke-opacity=".45" stroke-width=".6" ${SF}`);
      s += card(-7, `fill="${P('f2')}"`);
      s += card(-1, fl('p')) + card(-1, `stroke-opacity=".6" stroke-width=".6" ${SF}`);
      const tag = (c.en.split(/[\s&]+/)[0] || '').toUpperCase();
      s += card(
        7,
        fl('a'),
        H(c.name, -42, -12, 11, 'o', 'start', 2) +
          `<line x1="-42" x2="42" y1="-4" y2="-4" stroke-opacity=".5" stroke-width=".4" ${SO}/>` +
          H(tag, -42, 20, 5.5, 'o', 'start', 1.2, 'm'),
      );
      ['var(--accent)', 'var(--book-ink)', 'var(--book-kraft)', 'var(--ink)'].forEach(
        (col, i) => (s += `<rect x="${24 + i * 9}" y="220" width="7" height="7" style="fill:${col}"/>`),
      );
      return s;
    },
  },

  // 09 包装设计 · 折：展开的盒子刀版图，实线裁切、虚线折痕，正面填主色
  packaging: {
    word: '折',
    art: (c, P) => {
      const u = 32;
      const x0 = 30;
      const y0 = 66;
      const p = (a: number, b: number) => `${f(x0 + a * u)} ${f(y0 + b * u)}`;
      let s = `<rect x="${x0 + u}" y="${y0 + u}" width="${u}" height="${u}" ${fl('a')}/><rect x="${x0 + 2 * u}" y="${y0 + u}" width="${u}" height="${u}" fill="${P('f2')}"/>`;
      s += `<path d="M${p(1, 0)} L${p(2, 0)} L${p(2, 1)} L${p(4, 1)} L${p(4, 2)} L${p(2, 2)} L${p(2, 3)} L${p(1, 3)} L${p(1, 2)} L${p(0, 2)} L${p(0, 1)} L${p(1, 1)} Z" stroke-width=".9" ${SF}/>`;
      const flaps = [
        [[1, 0], [0.75, 0.15], [0.75, 0.85], [1, 1]],
        [[2, 0], [2.25, 0.15], [2.25, 0.85], [2, 1]],
        [[1, 2], [0.75, 2.15], [0.75, 2.85], [1, 3]],
        [[2, 2], [2.25, 2.15], [2.25, 2.85], [2, 3]],
        [[4, 1], [4.25, 1.15], [4.25, 1.85], [4, 2]],
      ];
      for (const q of flaps) s += `<path d="M${q.map(([a, b]) => p(a, b)).join(' L')}" stroke-width=".7" ${SF}/>`;
      const folds = [
        [[1, 1], [2, 1]],
        [[1, 2], [2, 2]],
        [[1, 1], [1, 2]],
        [[2, 1], [2, 2]],
        [[3, 1], [3, 2]],
      ];
      for (const [a, b] of folds) s += `<path d="M${p(a[0], a[1])} L${p(b[0], b[1])}" stroke-width=".6" stroke-dasharray="3 2" ${SF}/>`;
      s += `<path d="M${x0} 182 h128 M${x0} 178 v8 M${x0 + 128} 178 v8" stroke-opacity=".5" stroke-width=".5" ${SF}/>`;
      return s + H(c.name, 20, 218, 18, 'f', 'start', 3);
    },
  },

  // 10 插画 · 远山：三层网点山，远山点细、近山点粗；一轮月，两只鸟
  illustration: {
    word: '远山',
    art: (c, P) => {
      const far = (x: number) => 150 - 38 * Math.sin(x / 30 + 1) - 14 * Math.sin(x / 11);
      const mid = (x: number) => 180 - 26 * Math.sin(x / 24 + 3) - 10 * Math.sin(x / 9 + 2);
      const near = (x: number) => 208 - 16 * Math.sin(x / 20 + 5) - 6 * Math.sin(x / 7);
      const ridge = (fn: (x: number) => number) => {
        let d = 'M6 240';
        for (let x = 6; x <= 194; x += 4) d += ` L${x} ${f(fn(x))}`;
        return `${d} L194 240 Z`;
      };
      let s = `<circle cx="146" cy="76" r="17" ${fl('f')}/>`;
      // 每层先铺底色再铺网点，远处的网点不会从近处透出来
      [
        [far, 'f1'],
        [mid, 'f2'],
        [near, 'f3'],
      ].forEach(([fn, pat]) => {
        const d = ridge(fn as (x: number) => number);
        s += `<path d="${d}" ${fl('k')}/><path d="${d}" fill="${P(pat as string)}"/>`;
      });
      s += `<path d="M112 104 q3 -3 6 0 q3 -3 6 0 M126 96 q2 -2 4 0 q2 -2 4 0" stroke-width=".7" ${SF}/>`;
      return s + V(c.name, 34, 72, 32);
    },
  },

  // 11 门店视觉 · 入：一扇拱门，门里透出的光在地面上由网点铺开、渐渐变淡
  retail: {
    word: '入',
    art: (c, P) => {
      let s = '';
      for (let bx = 20; bx <= 180; bx += 20) {
        const x2 = bx + (bx - 100) * (64 / 56);
        s += `<line x1="${bx}" y1="176" x2="${f(x2)}" y2="240" stroke-opacity=".25" stroke-width=".6" ${SF}/>`;
      }
      s += `<line x1="18" x2="184" y1="176" y2="176" stroke-opacity=".5" stroke-width=".6" ${SF}/>`;
      // 光：三段梯形，网点由粗到细
      const band = (y0: number, y1: number, pat: string) => {
        const hw = (y: number) => 30 + (y - 176) * 0.55;
        return `<path d="M${f(100 - hw(y0))} ${y0} L${f(100 + hw(y0))} ${y0} L${f(100 + hw(y1))} ${y1} L${f(100 - hw(y1))} ${y1} Z" fill="${P(pat)}"/>`;
      };
      s += band(176, 196, 'a3') + band(196, 218, 'a2') + band(218, 240, 'a1');
      s += `<path d="M70 176 V94 A30 30 0 0 1 130 94 V176 Z" ${fl('a')}/>`;
      return s + V(c.name, 32, 66, 15);
    },
  },

  // 12 短视频与 IP · 帧：一段胶片，三格是同一个 IP 的睁眼、半闭、闭眼——一次眨眼
  ip: {
    word: '帧',
    art: (c) => {
      let s = `<rect x="56" y="42" width="88" height="196" ${fl('f')}/>`;
      for (let y = 48; y <= 228; y += 12)
        s += `<rect x="60" y="${y}" width="5" height="6" ${fl('k')}/><rect x="135" y="${y}" width="5" height="6" ${fl('k')}/>`;
      [52, 114, 176].forEach((y, i) => {
        const cy = y + 27;
        s += `<rect x="70" y="${y}" width="60" height="54" ${fl('p')}/><circle cx="100" cy="${cy}" r="15" ${fl('a')}/>`;
        if (i === 0) s += `<circle cx="94" cy="${cy - 2}" r="2.2" ${fl('o')}/><circle cx="106" cy="${cy - 2}" r="2.2" ${fl('o')}/>`;
        else if (i === 1)
          s += `<ellipse cx="94" cy="${cy - 1.5}" rx="2.3" ry=".9" ${fl('o')}/><ellipse cx="106" cy="${cy - 1.5}" rx="2.3" ry=".9" ${fl('o')}/>`;
        else s += `<path d="M91 ${cy - 1} h6 M103 ${cy - 1} h6" stroke-width="1.2" ${SO}/>`;
      });
      const zh = cjk(c.name) || c.name;
      const en = latin(c.name);
      return s + V(zh, 174, 74, 15) + (en ? H(en, 174, +f(vEnd(zh, 74, 15) + 16), 13, 'f', 'middle') : '');
    },
  },
};

/** 这本书有没有专门的封面设计 */
export const hasCover = (id: string) => id in covers;

/** 完整封面（画面 + 统一的版头版尾），用在 <symbol viewBox="0 0 200 280"> 里 */
export function coverSvg(c: CoverInfo, tagline: string): string {
  const d = covers[c.id];
  if (!d) return '';
  const P: Pat = (kind) => `url(#cv-${kind}-${c.binding})`;
  const rule = (y: number) => `<line x1="20" x2="182" y1="${y}" y2="${y}" stroke-opacity=".45" stroke-width=".6" ${SF}/>`;
  return (
    d.art(c, P, tagline) +
    // 书脊一侧的折痕
    `<rect width="6" height="280" style="fill:#000" fill-opacity=".08"/>` +
    H(`No.${c.no}`, 20, 26, 8, 'f', 'start', 1, 'm') +
    H(tagline, 182, 26, 8, 'f', 'end', 2, 'r') +
    rule(34) +
    rule(244) +
    H(c.en.toUpperCase(), 20, 259, 7, 'f', 'start', 1.4, 'm') +
    H(d.word, 182, 259, 8, 'f', 'end', 2, 'r')
  );
}
