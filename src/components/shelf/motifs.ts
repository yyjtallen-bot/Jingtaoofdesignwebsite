// 生成封面上的几何图形（12 张一个系列）。
// 统一语汇：一块实色（.s）+ 一块半调网点（.d，略微错位，像套色印刷）+ 少量细线（.l）。
// 画布 100 × 100。想改某本书的图形，改对应 id 的那一段即可。

type Motif = (dots: string) => string;

const d = (dots: string) => `class="d" fill="${dots}"`;

export const motifs: Record<string, Motif> = {
  // 01 APP 界面 —— 竖长的屏
  app: (p) => `
    <rect ${d(p)} x="20" y="4" width="44" height="90"/>
    <rect class="s" x="34" y="14" width="42" height="64"/>
    <line class="l" x1="34" y1="86" x2="76" y2="86"/>`,

  // 02 网页设计 —— 版块与栏
  web: (p) => `
    <rect ${d(p)} x="10" y="10" width="84" height="84"/>
    <rect class="s" x="4" y="4" width="84" height="14"/>
    <rect class="s" x="4" y="26" width="38" height="62"/>
    <line class="l" x1="50" y1="30" x2="88" y2="30"/>
    <line class="l" x1="50" y1="38" x2="80" y2="38"/>`,

  // 03 小程序 —— 圆中之方
  miniapp: (p) => `
    <circle ${d(p)} cx="52" cy="52" r="42"/>
    <rect class="s" x="30" y="30" width="30" height="30"/>`,

  // 04 B 端后台 —— 柱与基线
  admin: (p) => `
    <rect ${d(p)} x="8" y="60" width="90" height="36"/>
    <rect class="s" x="6" y="46" width="11" height="44"/>
    <rect class="s" x="23" y="20" width="11" height="70"/>
    <rect class="s" x="40" y="58" width="11" height="32"/>
    <rect class="s" x="57" y="8" width="11" height="82"/>
    <rect class="s" x="74" y="36" width="11" height="54"/>
    <line class="l" x1="2" y1="90" x2="98" y2="90"/>`,

  // 05 交互动效 —— 涟漪
  motion: (p) => `
    <circle ${d(p)} cx="34" cy="54" r="30"/>
    <circle class="s" cx="30" cy="50" r="10"/>
    <path class="l" d="M34 14 A40 40 0 0 1 34 94"/>
    <path class="l" d="M34 4 A50 50 0 0 1 34 104"/>
    <path class="l" d="M34 -6 A60 60 0 0 1 34 114"/>`,

  // 06 Logo/VI —— 圆与方
  identity: (p) => `
    <rect ${d(p)} x="44" y="22" width="50" height="56"/>
    <circle class="s" cx="38" cy="50" r="28"/>`,

  // 07 海报 —— 日与地平线
  poster: (p) => `
    <circle ${d(p)} cx="50" cy="42" r="38"/>
    <rect class="s" x="0" y="74" width="100" height="7"/>
    <rect class="s" x="0" y="88" width="100" height="2"/>`,

  // 08 名片与物料 —— 两张错开的卡片
  print: (p) => `
    <rect ${d(p)} x="6" y="14" width="64" height="40"/>
    <rect class="s" x="28" y="42" width="66" height="40"/>
    <line class="l" x1="36" y1="72" x2="62" y2="72"/>`,

  // 09 包装设计 —— 盒子展开图
  packaging: (p) => `
    <path ${d(p)} d="M38 4h24v24h24v24h-24v46h-24v-46h-24v-24h24z"/>
    <rect class="s" x="38" y="28" width="24" height="24"/>`,

  // 10 插画 —— 山与月
  illustration: (p) => `
    <path ${d(p)} d="M0 96 L28 50 L46 70 L70 30 L100 80 L100 96 Z"/>
    <circle class="s" cx="76" cy="16" r="10"/>
    <line class="l" x1="0" y1="96" x2="100" y2="96"/>`,

  // 11 门店视觉 —— 拱门
  retail: (p) => `
    <path ${d(p)} d="M18 96 V46 A32 32 0 0 1 82 46 V96 Z"/>
    <rect class="s" x="40" y="58" width="22" height="38"/>
    <line class="l" x1="6" y1="96" x2="94" y2="96"/>`,

  // 12 短视频与 IP —— 播放与角色
  ip: (p) => `
    <circle ${d(p)} cx="38" cy="42" r="30"/>
    <path class="s" d="M50 44 L92 68 L50 92 Z"/>`,
};

/** 新增分类但没写图形时的兜底 */
export const fallbackMotif: Motif = (p) => `
  <rect ${d(p)} x="14" y="14" width="72" height="72"/>
  <circle class="s" cx="50" cy="50" r="20"/>`;
