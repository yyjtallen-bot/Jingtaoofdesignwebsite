// 滚动到视口时给 [data-reveal] 加上 .is-in，由 CSS 完成动画（见 base.css）。
// 观察的是父元素：文字被遮罩裁掉时，元素自身可能“看不见”，观察它会永远等不到。
// 尊重“减少动态效果”：直接全部显示。
export function initRevealOnScroll(root: ParentNode = document) {
  const els = [...root.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')];
  if (!els.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const groups = new Map<Element, HTMLElement[]>();
  for (const el of els) {
    const p = el.parentElement ?? el;
    groups.set(p, [...(groups.get(p) ?? []), el]);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        groups.get(en.target)?.forEach((el) => el.classList.add('is-in'));
        io.unobserve(en.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  groups.forEach((_, p) => io.observe(p));
}
