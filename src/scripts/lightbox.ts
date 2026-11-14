// 图片放大：点击 [data-zoomable] 里的图片 → 一张纸从这张图的位置长出铺满屏幕，图片同步放大到中间。
// ← / → 切换同一组图片，ESC / 点空白处 / 关闭按钮收回原位。尊重“减少动态效果”。

const DUR = 620;
const EASE = 'cubic-bezier(0.76, 0, 0.18, 1)';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** srcset 里最大的一张 */
function largest(el: HTMLImageElement) {
  let url = el.currentSrc || el.src;
  let best = 0;
  for (const part of el.srcset ? el.srcset.split(',') : []) {
    const [u, w] = part.trim().split(/\s+/);
    const n = parseFloat(w ?? '');
    if (w?.endsWith('w') && n > best) {
      best = n;
      url = u;
    }
  }
  return url;
}

function insetOf(r: DOMRect) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  return `inset(${r.top}px ${vw - r.right}px ${vh - r.bottom}px ${r.left}px)`;
}

/** 让 b 看起来位于 a 的位置与大小 */
function flip(a: DOMRect, b: DOMRect) {
  const s = a.width / (b.width || 1);
  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${s})`;
}

export function initLightbox() {
  const dlg = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!dlg) return;
  const img = dlg.querySelector<HTMLImageElement>('.lb-img')!;
  const cap = dlg.querySelector<HTMLElement>('.lb-cap')!;
  const count = dlg.querySelector<HTMLElement>('.lb-count')!;

  let group: HTMLImageElement[] = [];
  let index = 0;
  let busy = false;
  let cursorHome: ParentNode | null = null;

  // 可放大的图片：光标显示“放大”
  const mark = () =>
    document.querySelectorAll<HTMLImageElement>('[data-zoomable] img').forEach((el) => {
      el.dataset.cursor = 'open';
      el.dataset.cursorLabel = '放大';
      el.style.cursor = 'zoom-in';
    });
  mark();

  function captionOf(el: HTMLImageElement) {
    return el.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || el.alt || '';
  }

  function show(i: number) {
    index = (i + group.length) % group.length;
    const el = group[index];
    img.src = el.currentSrc || el.src; // 先用已加载的那张，保证动画不等待
    img.alt = el.alt;
    const hi = largest(el);
    if (hi && hi !== img.src) {
      const pre = new Image();
      pre.src = hi;
      pre
        .decode()
        .then(() => {
          if (group[index] === el) img.src = hi;
        })
        .catch(() => {});
    }
    cap.textContent = captionOf(el);
    count.textContent = group.length > 1 ? `${index + 1} / ${group.length}` : '';
    dlg!.classList.toggle('single', group.length < 2);
  }

  // 自定义光标在页面层，弹窗在最顶层会盖住它：打开时把光标搬进弹窗
  function adoptCursor(into: boolean) {
    const cur = document.querySelector<HTMLElement>('.cursor');
    if (!cur) return;
    if (into) {
      cursorHome = cur.parentNode;
      dlg!.append(cur);
    } else if (cursorHome) {
      cursorHome.appendChild(cur);
    }
  }

  async function open(el: HTMLImageElement) {
    if (busy || dlg!.open) return;
    const scope = el.closest('[data-zoomable]')!;
    group = [...scope.querySelectorAll<HTMLImageElement>('img')];
    show(Math.max(0, group.indexOf(el)));
    dlg!.showModal();
    adoptCursor(true);
    if (reduced()) return;
    busy = true;
    await img.decode().catch(() => {});
    const a = el.getBoundingClientRect();
    const b = img.getBoundingClientRect();
    const opts = { duration: DUR, easing: EASE };
    await Promise.all([
      img.animate([{ transform: flip(a, b) }, { transform: 'none' }], opts).finished,
      dlg!.animate([{ clipPath: insetOf(a) }, { clipPath: 'inset(0px)' }], opts).finished,
    ]).catch(() => {});
    busy = false;
  }

  async function close() {
    if (!dlg!.open || busy) return;
    busy = true;
    const el = group[index];
    if (!reduced() && el?.isConnected) {
      const a = el.getBoundingClientRect();
      const b = img.getBoundingClientRect();
      const opts: KeyframeAnimationOptions = { duration: DUR * 0.8, easing: EASE, fill: 'forwards' };
      await Promise.all([
        img.animate([{ transform: 'none' }, { transform: flip(a, b) }], opts).finished,
        dlg!.animate([{ clipPath: 'inset(0px)' }, { clipPath: insetOf(a) }], opts).finished,
      ]).catch(() => {});
    }
    adoptCursor(false);
    dlg!.close();
    dlg!.getAnimations().forEach((x) => x.cancel());
    img.getAnimations().forEach((x) => x.cancel());
    busy = false;
  }

  function step(d: number) {
    if (group.length < 2 || busy) return;
    show(index + d);
    if (!reduced()) {
      img.animate([{ transform: `translateX(${d * 3}%)` }, { transform: 'none' }], {
        duration: 420,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      });
    }
  }

  document.addEventListener('click', (e) => {
    const t = (e.target as Element | null)?.closest?.<HTMLImageElement>('[data-zoomable] img');
    if (!t || t.closest('a')) return;
    e.preventDefault();
    open(t);
  });

  dlg.querySelector('.lb-close')!.addEventListener('click', close);
  dlg.querySelector('.lb-prev')!.addEventListener('click', () => step(-1));
  dlg.querySelector('.lb-next')!.addEventListener('click', () => step(1));
  dlg.addEventListener('click', (e) => {
    // 点空白处或图片本身都收回（按钮除外）
    if (!(e.target as Element).closest('button')) close();
  });
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
}
