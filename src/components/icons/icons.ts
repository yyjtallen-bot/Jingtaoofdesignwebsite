// 图标库：和书架封面同一套语汇 —— 细线（.i-l）+ 一块主色实色（.i-s）+ 一块半调网点（网点填充）。
// 画布 48 × 48。所有图标一览见 /styleguide/ 的「图标」。
// 新增图标：在下面加一项，键名就是图标名，在 data.ts 里用 icon: '名字' 引用。

type Draw = (dots: string) => string;
const d = (dots: string) => `fill="${dots}"`;

export const icons = {
  /** 界面 / APP */
  interface: (p) => `
    <rect ${d(p)} x="7" y="17" width="15" height="22"/>
    <rect class="i-l" x="14" y="5" width="20" height="38"/>
    <path class="i-l" d="M21 38.5h6"/>
    <rect class="i-s" x="18" y="10" width="12" height="9"/>`,

  /** 网页 */
  web: (p) => `
    <rect ${d(p)} x="14" y="23" width="29" height="19"/>
    <rect class="i-l" x="5" y="8" width="36" height="31"/>
    <path class="i-l" d="M5 15.5h36M24 22h12M24 27h8"/>
    <rect class="i-s" x="9.5" y="20" width="10" height="14"/>`,

  /** 小程序 */
  miniapp: (p) => `
    <circle ${d(p)} cx="30" cy="29" r="12"/>
    <circle class="i-l" cx="22" cy="22" r="15"/>
    <rect class="i-s" x="17" y="17" width="10" height="10"/>`,

  /** 品牌 / Logo / VI */
  brand: (p) => `
    <rect ${d(p)} x="25" y="9" width="18" height="25"/>
    <circle class="i-l" cx="19" cy="25" r="13"/>
    <path class="i-l" d="M5 43h38"/>
    <circle class="i-s" cx="19" cy="25" r="4.5"/>`,

  /** 设计系统 / B 端后台 */
  system: (p) => `
    <rect class="i-s" x="6" y="6" width="16" height="16"/>
    <rect ${d(p)} x="26" y="26" width="16" height="16"/>
    <rect class="i-l" x="26" y="6" width="16" height="16"/>
    <rect class="i-l" x="6" y="26" width="16" height="16"/>
    <rect class="i-l" x="26" y="26" width="16" height="16"/>`,

  /** 交互动效 */
  motion: (p) => `
    <circle ${d(p)} cx="18" cy="26" r="11"/>
    <path class="i-l" d="M18 9a15 15 0 0 1 0 30M18 3a21 21 0 0 1 0 42"/>
    <circle class="i-s" cx="16" cy="24" r="4"/>`,

  /** 海报 / 物料 / 印刷 */
  print: (p) => `
    <rect ${d(p)} x="5" y="7" width="24" height="17"/>
    <rect class="i-l" x="14" y="17" width="29" height="22"/>
    <path class="i-l" d="M19 24h17"/>
    <rect class="i-s" x="19" y="30" width="13" height="3.5"/>`,

  /** 包装 */
  package: (p) => `
    <rect ${d(p)} x="14" y="22" width="28" height="21"/>
    <path class="i-l" d="M7 17h34v25H7zM7 17l6-10h22l6 10M24 7v10"/>
    <rect class="i-s" x="19" y="24" width="10" height="4"/>`,

  /** 插画 */
  illustration: (p) => `
    <path ${d(p)} d="M4 42 17 23l8 10 9-15 10 16v8z"/>
    <path class="i-l" d="M4 42h40"/>
    <circle class="i-s" cx="34" cy="10" r="4.5"/>`,

  /** 门店 / 空间 */
  retail: (p) => `
    <rect ${d(p)} x="14" y="20" width="28" height="23"/>
    <path class="i-l" d="M9 43V22a15 15 0 0 1 30 0v21M4 43h40"/>
    <rect class="i-s" x="20" y="29" width="8" height="14"/>`,

  /** 短视频 / IP */
  video: (p) => `
    <circle ${d(p)} cx="17" cy="21" r="12"/>
    <rect class="i-l" x="5" y="8" width="38" height="32"/>
    <path class="i-s" d="m21 17 13 8-13 8z"/>`,

  /** 沟通 / 了解需求 */
  talk: (p) => `
    <rect ${d(p)} x="19" y="21" width="24" height="17"/>
    <path class="i-l" d="M5 7h29v19H16l-6 6v-6H5z"/>
    <path class="i-l" d="M38 30h5v12h-4l-4 4v-4H23v-4"/>
    <rect class="i-s" x="10" y="13" width="15" height="3.5"/>`,

  /** 报价 / 排期 */
  plan: (p) => `
    <rect ${d(p)} x="9" y="22" width="18" height="17"/>
    <rect class="i-l" x="5" y="9" width="38" height="33"/>
    <path class="i-l" d="M5 17h38M14 5v8M34 5v8"/>
    <rect class="i-s" x="30" y="24" width="8" height="8"/>`,

  /** 设计 / 提案 */
  sketch: (p) => `
    <circle ${d(p)} cx="31" cy="17" r="11"/>
    <path class="i-l" d="M6 42V12l30 30zM12 36v-9l9 9z"/>
    <rect class="i-s" x="35" y="34" width="8" height="8"/>`,

  /** 修改 / 打磨 */
  revise: (p) => `
    <circle ${d(p)} cx="24" cy="24" r="9"/>
    <path class="i-l" d="M9 21a15 15 0 0 1 29-3M38 9v9h-9M39 27a15 15 0 0 1-29 3M10 39v-9h9"/>
    <circle class="i-s" cx="24" cy="24" r="3.5"/>`,

  /** 交付 / 上线 */
  deliver: (p) => `
    <rect ${d(p)} x="6" y="29" width="36" height="13"/>
    <path class="i-l" d="M24 5v24M15 20l9 9 9-9M6 29v13h36V29"/>
    <rect class="i-s" x="20" y="35" width="8" height="3.5"/>`,

  /** 顾问 / 长期合作 */
  partner: (p) => `
    <circle ${d(p)} cx="30" cy="24" r="12"/>
    <circle class="i-l" cx="18" cy="24" r="12"/>
    <circle class="i-l" cx="30" cy="24" r="12"/>
    <circle class="i-s" cx="24" cy="24" r="3.5"/>`,
} satisfies Record<string, Draw>;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];

/** 每个图标实例自带一份网点图案，用递增编号避免同页重复 id */
let seq = 0;
export const nextPatternId = () => `icon-dots-${++seq}`;
