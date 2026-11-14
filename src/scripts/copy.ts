// 复制按钮：<button data-copy="要复制的文字"> … </button>
// 按钮里放两层文字 .copy-a（平时）和 .copy-b（复制成功后），由 CSS 做遮罩切换。
// 微信内置浏览器等不支持 Clipboard API 的环境，退回 execCommand。

export async function writeText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 落到下面的兜底方案 */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.append(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

export function initCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as Element | null)?.closest?.<HTMLElement>('[data-copy]');
    if (!btn) return;
    e.preventDefault();
    const ok = await writeText(btn.dataset.copy ?? '');
    btn.classList.toggle('is-copied', ok);
    btn.classList.toggle('is-failed', !ok);
    // 读屏
    const live = btn.querySelector<HTMLElement>('[data-copy-status]');
    if (live) live.textContent = ok ? '已复制到剪贴板' : '复制失败，请长按手动复制';
    btn.dispatchEvent(new CustomEvent('copied', { bubbles: true, detail: { ok } }));
    window.setTimeout(() => btn.classList.remove('is-copied', 'is-failed'), 2200);
  });
}
