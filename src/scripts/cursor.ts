// 自定义光标：指数平滑跟随，状态来自悬停元素的 data-cursor
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function initCursor() {
  const el = document.querySelector<HTMLElement>('.cursor');
  if (!el || !matchMedia('(pointer: fine)').matches) return;
  const label = el.querySelector<HTMLElement>('.label-text')!;
  document.documentElement.classList.add('has-cursor');

  let x = -100;
  let y = -100;
  let tx = -100;
  let ty = -100;
  let shown = false;
  let raf = 0;
  let last = 0;
  let state = '';
  let lastProbe = 0;

  function resolve(target: Element | null) {
    const zone = target?.closest<HTMLElement>('[data-cursor]');
    if (zone) return { s: zone.dataset.cursor ?? '', l: zone.dataset.cursorLabel ?? '' };
    if (target?.closest('a, button, [role="button"], label, summary, select')) return { s: 'btn', l: '' };
    return { s: '', l: '' };
  }

  function setState(target: Element | null) {
    const { s, l } = resolve(target);
    if (s !== state) {
      state = s;
      el!.dataset.state = s;
    }
    if (l && label.textContent !== l) label.textContent = l;
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const k = reduced.matches ? 1 : 1 - Math.exp(-16 * dt);
    x += (tx - x) * k;
    y += (ty - y) * k;
    el!.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    // 页面在动（书架转动）时，光标下的元素也会变，定期重新判断
    if (now - lastProbe > 120) {
      lastProbe = now;
      setState(document.elementFromPoint(tx, ty));
    }
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 || state ? requestAnimationFrame(frame) : 0;
  }

  function wake() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        x = tx;
        y = ty;
        shown = true;
        el.classList.add('is-on');
      }
      setState(e.target as Element);
      wake();
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    shown = false;
    el.classList.remove('is-on');
  });
  window.addEventListener('blur', () => {
    shown = false;
    el.classList.remove('is-on');
  });
}
