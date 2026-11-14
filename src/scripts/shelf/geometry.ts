// 弧形纵深书架的几何（纯函数，无 DOM 依赖，可单测）
//
// 思路：沿一条“弧长” u 排布书本；u 越远，屏幕缩放 scl(u) 越小。
// 把书放到能产生这个缩放的 3D 深度上，再把屏幕 x 设为缩放的积分，
// 于是远处的书在屏幕上越挤越密，整排书像弯进纵深的弧形书架。

export interface Metrics {
  /** 书高 */
  H: number;
  /** 书脊宽 */
  ws: number;
  /** 封面宽（= 书的厚度方向，打开时朝向观众） */
  d: number;
  /** 书与书的间隙 */
  gap: number;
  /** 纵深衰减距离：越小，两侧越快退远 */
  U: number;
  /** CSS perspective */
  P: number;
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  /** 屏幕缩放 */
  sc: number;
  /** 打开程度：0 = 书脊朝外，1 = 封面朝外 */
  o: number;
  hidden: boolean;
  spineShade: number;
  coverShade: number;
  /** 封底的明暗（书架右侧的书露出的那一面） */
  backShade: number;
}

/** 侧面（封面 / 封底）的明暗：侧面背光，比书脊暗；越远越暗 */
export function sideShade(sc: number): number {
  return Math.min(0.66, 0.26 + (1 - sc) * 0.5);
}

/** 相对序号：把 v - s 映射到 [-total/2, total/2) */
export function rel(v: number, s: number, total: number): number {
  let r = (v - s) % total;
  if (r < -total / 2) r += total;
  else if (r >= total / 2) r -= total;
  return r;
}

export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** 打开的封面把邻居平滑推开：|r|<1 时 (r + sin(πr)/π)/2，之外为 ±0.5 */
export function blend(r: number): number {
  if (r >= 1) return 0.5;
  if (r <= -1) return -0.5;
  return (r + Math.sin(Math.PI * r) / Math.PI) / 2;
}

/** 第 r 本书距中心的弧长 */
export function arc(r: number, m: Metrics): number {
  return r * (m.ws + m.gap) + (m.d - m.ws + 1.4 * m.gap) * blend(r);
}

/** 弧长 u 处的屏幕缩放 */
export function scaleAt(u: number, U: number): number {
  return 1 / (1 + Math.pow(Math.abs(u) / U, 1.6));
}

/** 预计算屏幕 x 表：对 scaleAt 做数值积分（步长 step px，范围 0…3U） */
export function buildScreenTable(U: number, step = 2): Float64Array {
  const n = Math.ceil((3 * U) / step) + 2;
  const xs = new Float64Array(n);
  for (let i = 1; i < n; i++) xs[i] = xs[i - 1] + step * scaleAt((i - 0.5) * step, U);
  return xs;
}

/** 弧长 u → 屏幕 x（查表 + 线性插值） */
export function screenX(u: number, table: Float64Array, step = 2): number {
  const a = Math.abs(u) / step;
  const i = Math.floor(a);
  const last = table.length - 1;
  const v = i >= last ? table[last] : table[i] + (table[i + 1] - table[i]) * (a - i);
  return Math.sign(u) * v;
}

/**
 * 单本书的姿态
 * @param r     相对序号（0 = 正中打开的那本）
 * @param lift  悬停抽出程度 0…1
 * @param tiltX 封面俯仰（度）
 * @param tiltY 封面偏转（度）
 */
export function pose(
  r: number,
  m: Metrics,
  table: Float64Array,
  lift = 0,
  tiltX = 0,
  tiltY = 0,
): Pose {
  const o = smoothstep(Math.max(0, 1 - Math.abs(r)));
  const u = arc(r, m);
  const sc = scaleAt(u, m.U);
  const k = 1 / sc;
  const hidden = Math.abs(u) > m.U * 1.95;
  const z = m.P * (1 - k) + o * m.H * 0.1;
  const x = screenX(u, table) * k;
  const y = (m.H * 0.5 * (1 - sc) * 0.42 + o * m.H * 0.012 - lift * m.H * 0.05) * k;
  const ry = Math.sign(u) * Math.min(1, Math.abs(u) / m.U) * 26 * (1 - o) - 90 * o + tiltY * o;
  const rx = tiltX * o;
  return {
    x,
    y,
    z,
    rx,
    ry,
    sc,
    o,
    hidden,
    spineShade: Math.min(0.6, o * 0.55 + (1 - sc) * 0.32),
    // 封面翻开到正面时逐渐变亮；没翻开时和封底一样按侧面处理，两边书的厚度看起来一致
    coverShade: (1 - o) * sideShade(sc),
    backShade: sideShade(sc),
  };
}

/** 正模 */
export const mod = (n: number, m: number) => ((n % m) + m) % m;

/** 帧率无关的指数趋近系数：每秒速率 k，经过 dt 秒 */
export const approach = (k: number, dt: number) => 1 - Math.exp(-k * dt);
