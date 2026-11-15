// 子页的进场（按对标）：
//   纸从封面长出（clip-path，1050ms，cubic-bezier(.76,0,.18,1)）
//   文字逐行升起（translateY(110%) → 0，900ms，延迟 620 + 第 i 行 × 75ms）
//   主图墨迹晕开（从 520ms 起，7 个圆形遮罩经扭曲滤镜成不规则墨边，
//               各自按延迟在 1250ms 内从半径 0 长满，先快后慢）
//   收回：纸缩回封面，850ms（内容先淡掉、落到书上时纸再淡出，见 overlay.ts）
// 首页浮层和独立页面共用。尊重“减少动态效果”：直接显示。

export const SHEET = {
  /** 纸从封面长出 / 收回 */
  openDuration: 1050,
  closeDuration: 850,
  /** 收回时：内容在前 30% 淡掉；纸从 70% 处开始淡出，露出封面 */
  closeContentFade: 0.3,
  closePaperFade: 0.7,
  ease: 'cubic-bezier(0.76, 0, 0.18, 1)',
  /** 纸的圆角（从封面开始时） */
  radius: 3,
  /** 文字升起：开始时间、逐行间隔、时长 */
  riseStart: 620,
  riseStagger: 75,
  riseDuration: 900,
  riseEase: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  /** 墨迹：开始时间、每团墨的扩散时长 */
  inkStart: 520,
  inkDuration: 1250,
};

const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReduced = () => reducedQuery.matches;
const mobileQuery = matchMedia('(max-width: 767px)');

/** [data-rise] 元素从遮罩下方逐行升起 */
export function rise(root: ParentNode, delay = 0) {
  if (prefersReduced()) return;
  root.querySelectorAll<HTMLElement>('[data-rise]').forEach((el, i) => {
    el.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], {
      duration: SHEET.riseDuration,
      delay: delay + i * SHEET.riseStagger,
      easing: SHEET.riseEase,
      fill: 'both',
    });
  });
}

// ── 墨迹 ─────────────────────────────────────────────
// 对标的七团墨：圆心（在 474 × 900 的海报坐标里）+ 起笔延迟 ms，最终半径 720。
// 我们的主图是 5:7，按比例换算到主图自己的坐标。
const REF_W = 474;
const REF_H = 900;
const REF_R = 720;
const CIRCLES: [number, number, number][] = [
  [150, 330, 0],
  [340, 600, 120],
  [250, 120, 220],
  [90, 760, 300],
  [400, 250, 360],
  [260, 860, 420],
  [230, 470, 180],
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
let seq = 0;

/**
 * 墨迹晕开：在主图上盖一层与纸同色的 SVG，用遮罩在上面“挖”出七团墨，露出下面的主图。
 * 墨团是普通圆形，经 feTurbulence + feDisplacementMap 扭曲，边缘变成不规则的墨迹。
 * 主图本身（生成的封面或你的图片）不需要改动。
 */
export function inkReveal(el: HTMLElement, delay = 0): Promise<void> {
  if (prefersReduced()) return Promise.resolve();
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (!w || !h) return Promise.resolve();

  // 用主图自己的宽高做坐标系，圆心按对标比例换算，半径按对角线比例换算
  const W = 500;
  const H = Math.round((W * h) / w);
  const rMax = REF_R * (Math.hypot(W, H) / Math.hypot(REF_W, REF_H));
  const id = `ink-${++seq}`;
  const NS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ink-veil');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const paper = getComputedStyle(el).getPropertyValue('--sheet').trim() || '#f4efe6';
  // 遮罩：白色 = 纸保留（盖住主图），黑色圆 = 挖掉（露出主图）
  svg.innerHTML = `
    <defs>
      <filter id="${id}-f" filterUnits="userSpaceOnUse" x="-200" y="-200" width="${W + 400}" height="${H + 400}">
        <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="7" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="120" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
        <rect width="${W}" height="${H}" fill="white"/>
        <g filter="url(#${id}-f)" fill="black">
          ${CIRCLES.map(([x, y]) => `<circle cx="${((x / REF_W) * W).toFixed(1)}" cy="${((y / REF_H) * H).toFixed(1)}" r="0"/>`).join('')}
        </g>
      </mask>
    </defs>
    <rect width="${W}" height="${H}" fill="${paper}" mask="url(#${id}-m)"/>`;
  // 手机屏幕像素密度高（2–3 倍），扭曲滤镜每帧都要重算，很吃力：
  // 只在手机上，让墨迹层按 1 倍密度计算再放大显示。形状不变，计算量降到几分之一。
  const k = mobileQuery.matches ? Math.min(3, window.devicePixelRatio || 1) : 1;
  if (k > 1) {
    svg.style.width = `${100 / k}%`;
    svg.style.height = `${100 / k}%`;
    svg.style.transformOrigin = '0 0';
    svg.style.transform = `scale(${k})`;
    svg.style.willChange = 'transform';
  }
  el.append(svg);

  const circles = [...svg.querySelectorAll('circle')];
  const span = SHEET.inkDuration + Math.max(...CIRCLES.map((c) => c[2]));

  return new Promise((resolve) => {
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = now - start;
      if (t >= span || !svg.isConnected) {
        svg.remove();
        resolve();
        return;
      }
      if (t > 0) {
        circles.forEach((c, i) => {
          const p = Math.min(1, Math.max(0, (t - CIRCLES[i][2]) / SHEET.inkDuration));
          c.setAttribute('r', (rMax * easeOutCubic(p)).toFixed(1));
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
