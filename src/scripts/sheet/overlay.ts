// 首页浮层（按对标）：
//   打开：书架停稳 → 填入子页内容（文字在遮罩下、墨迹半径归零）→ 读封面位置 →
//         一块纸色方块从封面的位置放大铺满屏幕（1050ms，它就是子页的背景）→
//         文字 620ms 起逐行升起 → 主图 520ms 起墨迹晕开
//   关闭：纸按原路缩回当前封面位置（850ms）：内容先淡掉，落到书上时纸淡出露出封面，然后隐藏
// 书和封面始终待在书架上，只是被纸盖住。
//
// 放大方式：外层（纸）用 transform 缩放，内层（内容）做反向缩放保持原大。
// transform 由显卡处理，墨迹滤镜等再耗时也不会让纸的放大卡顿。
// 子页内容在首页的 <template data-sheet-for="分类id"> 里，点开时直接克隆，不用读取文件。
// 网址同步为 /work/<分类>/，浏览器返回键、ESC、关闭按钮都会把纸收回封面。
import { SHEET, inkReveal, prefersReduced, rise } from './reveal';

interface Item {
  id: string;
  name: string;
  url: string | null;
}

type State = 'closed' | 'opening' | 'open' | 'closing';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** CSS cubic-bezier 曲线：给定时间进度 x（0–1）求动画进度 y */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    // 二分求 t，使 sx(t) = x（稳定、不会发散）
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** 从 SHEET.ease 字符串里取出四个控制点 */
function parseEase(ease: string) {
  // 只取括号里的数字（“cubic-bezier” 里的短横线不能算进去）
  const n = ease.slice(ease.indexOf('(') + 1).match(/-?\d*\.?\d+/g)!.map(Number);
  return cubicBezier(n[0], n[1], n[2], n[3]);
}

/**
 * 纸从 from 变到 to 的逐帧关键帧（线性插值矩形，按对标的缓动曲线采样）。
 * outer：纸本身缩放到该矩形；inner：内容反向缩放，保持在原位、原大。
 */
function growFrames(from: Box, to: Box, vw: number, vh: number, ease: string, steps = 48) {
  const curve = parseEase(ease);
  const outer: Keyframe[] = [];
  const inner: Keyframe[] = [];
  for (let k = 0; k <= steps; k++) {
    const p = curve(k / steps);
    const l = from.left + (to.left - from.left) * p;
    const t = from.top + (to.top - from.top) * p;
    const w = Math.max(1, from.width + (to.width - from.width) * p);
    const h = Math.max(1, from.height + (to.height - from.height) * p);
    const sx = w / vw;
    const sy = h / vh;
    outer.push({ offset: k / steps, transform: `translate(${l}px, ${t}px) scale(${sx}, ${sy})` });
    inner.push({ offset: k / steps, transform: `scale(${1 / sx}, ${1 / sy}) translate(${-l}px, ${-t}px)` });
  }
  return { outer, inner };
}

const boxOf = (r: DOMRect): Box => ({ left: r.left, top: r.top, width: r.width, height: r.height });

export function initSheet(shelf: HTMLElement, sheet: HTMLElement) {
  const frame = sheet.closest<HTMLElement>('[data-sheet-frame]')!;
  const body = sheet.querySelector<HTMLElement>('[data-sheet-body]')!;
  const closeBtn = sheet.querySelector<HTMLElement>('[data-sheet-close]')!;
  const zone = shelf.querySelector<HTMLElement>('.shelf-3d');
  const inertTargets = [...document.querySelectorAll<HTMLElement>('main, .topbar')];
  const homeTitle = document.title;
  const homeUrl = location.pathname + location.search;

  let state: State = 'closed';
  let cover: Element | null = null;

  shelf.addEventListener('shelf:open', (e) => {
    const { item, cover: c } = (e as CustomEvent<{ item: Item; cover: Element | null }>).detail;
    if (!item.url || !c || state !== 'closed') return;
    const tpl = document.querySelector<HTMLTemplateElement>(`template[data-sheet-for="${item.id}"]`);
    if (!tpl) return; // 没有备好的内容：交给书架直接跳转到独立页面
    e.preventDefault();
    open(item, c, tpl);
  });

  function open(item: Item, coverEl: Element, tpl: HTMLTemplateElement) {
    state = 'opening';
    cover = coverEl;
    shelf.setAttribute('data-sheet-open', '');
    const reduced = prefersReduced();

    // 1. 填入内容：文字先藏在遮罩下，主图先盖上墨迹（半径 0）
    const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
    body.replaceChildren(node);
    // 读封面位置要在显示纸之前（纸一出现就盖住封面）
    const from = boxOf(coverEl.getBoundingClientRect());
    frame.hidden = false;
    sheet.scrollTop = 0;
    history.pushState({ sheet: item.id }, '', item.url);
    document.title = tpl.dataset.sheetTitle || document.title;

    rise(node, SHEET.riseStart);
    const visual = node.querySelector<HTMLElement>('[data-ink]');
    if (visual) inkReveal(visual, SHEET.inkStart);

    // 让首页不可操作（inert）要重算整页样式，手机上会让点击后“愣一下”；
    // 纸铺满之前首页本来就被纸盖着，所以放到放大结束后再做。
    const settle = () => {
      inertTargets.forEach((el) => (el.inert = true));
      closeBtn.focus({ preventScroll: true });
    };

    // 2–3. 纸色方块从封面的位置放大铺满屏幕（它就是子页背景）
    if (reduced) {
      settle();
      state = 'open';
      return;
    }
    const vw = frame.clientWidth;
    const vh = frame.clientHeight;
    const { outer, inner } = growFrames(from, { left: 0, top: 0, width: vw, height: vh }, vw, vh, SHEET.ease);
    const opts: KeyframeAnimationOptions = { duration: SHEET.openDuration, easing: 'linear', fill: 'both' };
    const grow = frame.animate(outer, opts);
    sheet.animate(inner, opts);
    grow.finished
      .then(() => {
        if (state !== 'opening') return;
        // 放大结束：去掉变换，恢复成普通的全屏页面
        frame.getAnimations().forEach((a) => a.cancel());
        sheet.getAnimations().forEach((a) => a.cancel());
        settle();
        state = 'open';
      })
      .catch(() => {});
  }

  async function close() {
    if (state !== 'open' && state !== 'opening') return;
    state = 'closing';
    const reduced = prefersReduced();
    // 从纸现在的样子开始收（打开到一半就关也连贯）
    const fromBox = boxOf(frame.getBoundingClientRect());
    frame.getAnimations().forEach((a) => a.cancel());
    sheet.getAnimations().forEach((a) => a.cancel());
    document.title = homeTitle;

    const vw = frame.clientWidth;
    const vh = frame.clientHeight;
    const toBox =
      cover && cover.isConnected
        ? boxOf(cover.getBoundingClientRect())
        : { left: vw / 2, top: vh / 2, width: 1, height: 1 };
    if (!reduced) {
      const { outer, inner } = growFrames(fromBox, toBox, vw, vh, SHEET.ease);
      const opts: KeyframeAnimationOptions = { duration: SHEET.closeDuration, easing: 'linear', fill: 'both' };
      const shrink = frame.animate(outer, opts);
      sheet.animate(inner, opts);
      // 纸里的内容先淡掉（缩小的是一张干净的纸，不会露出错位的子页画面）；
      // 落到书上的最后一段，纸再淡出，露出下面的封面，不会“啪”地跳变。
      sheet.animate([{ opacity: 1 }, { opacity: 0, offset: SHEET.closeContentFade }, { opacity: 0 }], opts);
      frame.animate([{ opacity: 1 }, { opacity: 1, offset: SHEET.closePaperFade }, { opacity: 0 }], {
        ...opts,
        easing: 'ease-in',
      });
      await shrink.finished.catch(() => {});
    }

    frame.hidden = true;
    frame.getAnimations().forEach((a) => a.cancel());
    sheet.getAnimations().forEach((a) => a.cancel());
    body.replaceChildren();
    inertTargets.forEach((el) => (el.inert = false));
    shelf.removeAttribute('data-sheet-open');
    state = 'closed';
    zone?.focus({ preventScroll: true });
  }

  /** 用户主动关闭：如果是我们推入的历史记录，就退回去（由 popstate 收起），保持返回键行为一致 */
  function requestClose() {
    if (state !== 'open' && state !== 'opening') return;
    if (history.state?.sheet) history.back();
    else {
      history.replaceState(null, '', homeUrl);
      close();
    }
  }

  window.addEventListener('popstate', (e) => {
    const s = (e.state as { sheet?: string } | null)?.sheet;
    if (!s && (state === 'open' || state === 'opening')) close();
    else if (s && state === 'closed') location.reload(); // “前进”回到子页：直接加载独立页面
  });

  closeBtn.addEventListener('click', requestClose);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (state === 'open' || state === 'opening')) {
      e.preventDefault();
      requestClose();
    }
  });

  // 子页内的锚点（“查看作品 ↓”）：在浮层里滚动，不改网址
  sheet.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const target = sheet.querySelector(a.getAttribute('href')!);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  });
}
