// 首屏书架：一个 requestAnimationFrame 循环驱动全部书本、标题、时间轴。
import { SHELF } from './config';
import { approach, buildScreenTable, mod, pose, rel, type Metrics } from './geometry';

interface Item {
  id: string;
  no: string;
  name: string;
  en: string;
  count: number;
  url: string | null;
  /** 该分类有作品的年份 */
  years: number[];
  /** 最近一件作品的年份；没有作品为 null */
  year: number | null;
}

interface Data {
  items: Item[];
  defaultIndex: number;
}

interface Book {
  el: HTMLElement;
  v: number;
  i: number;
  spineShade: HTMLElement;
  coverShade: HTMLElement;
  backShade: HTMLElement;
  lift: number;
  transform: string;
  shadeS: string;
  shadeC: string;
  shadeB: string;
  hidden: boolean;
  cursor: string;
}

const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = matchMedia('(max-width: 767px)');
const finePointer = matchMedia('(pointer: fine)');

export function initShelf(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = '1';

  const data = JSON.parse(root.querySelector('[data-shelf-data]')!.textContent!) as Data;
  const items = data.items;
  const N = items.length;
  const TOTAL = N * SHELF.copies;

  const zone = root.querySelector<HTMLElement>('.shelf-3d')!;
  const stage = zone.querySelector<HTMLElement>('.stage')!;
  const probe = zone.querySelector<HTMLElement>('.probe')!;
  const floor = root.querySelector<HTMLCanvasElement>('.floor')!;
  const live = root.querySelector<HTMLElement>('[data-live]')!;
  const capTitle = root.querySelector<HTMLElement>('.cap-title')!;
  const capEn = root.querySelector<HTMLElement>('.cap-en')!;
  const capCount = root.querySelector<HTMLElement>('.cap-count')!;
  const timeline = root.querySelector<HTMLElement>('[data-timeline]')!;
  const tlDot = timeline.querySelector<HTMLElement>('.tl-dot')!;
  const tlMajors = [...timeline.querySelectorAll<HTMLElement>('.major')];
  const tlStart = Number(timeline.dataset.start);
  const tlEnd = Number(timeline.dataset.end);
  const tlSpan = Math.max(1, tlEnd - tlStart);

  zone.style.perspective = `${SHELF.perspective}px`;

  // ── 复制书本：12 本 × copies 份，首尾相接 ──
  const originals = [...stage.querySelectorAll<HTMLElement>('.book')];
  const books: Book[] = [];
  for (let c = 0; c < SHELF.copies; c++) {
    for (let i = 0; i < N; i++) {
      const el = c === 0 ? originals[i] : (originals[i].cloneNode(true) as HTMLElement);
      if (c > 0) stage.append(el);
      const v = c * N + i;
      el.dataset.v = String(v);
      books.push({
        el,
        v,
        i,
        spineShade: el.querySelector<HTMLElement>('.spine .shade')!,
        coverShade: el.querySelector<HTMLElement>('.cover .shade')!,
        backShade: el.querySelector<HTMLElement>('.back .shade')!,
        lift: 0,
        transform: '',
        shadeS: '',
        shadeC: '',
        shadeB: '',
        hidden: false,
        cursor: '',
      });
    }
  }

  // ── 状态 ──
  // 起始分类：默认分类；从子页“关闭”回来时网址带 ?shelf=<id>，停在那一本
  const params = new URLSearchParams(location.search);
  const fromSheet = items.findIndex((it) => it.id === params.get('shelf'));
  if (fromSheet >= 0) {
    params.delete('shelf');
    const qs = params.toString();
    history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
  }
  const startIndex = fromSheet >= 0 ? fromSheet : data.defaultIndex;
  const home = N + startIndex; // 中间那份里的起始分类
  let T = home; // 目标位置
  let s = reducedQuery.matches || fromSheet >= 0 ? T : T - SHELF.introOffset; // 当前位置
  let intro = s !== T;
  let active = data.defaultIndex;
  let lastDir = 1;
  let tiltX = 0;
  let tiltY = 0;
  let dotYear = yearOf(active);
  let hovered = -1;
  const pointer = { x: 0, y: 0, inside: false };

  let m: Metrics;
  let table: Float64Array;
  let rect = zone.getBoundingClientRect();

  function yearOf(i: number) {
    return items[i].year ?? tlEnd;
  }

  // ── 尺寸 ──
  function measure() {
    const H = probe.getBoundingClientRect().height;
    const cs = getComputedStyle(root);
    const wsR = parseFloat(cs.getPropertyValue('--spine-ratio')) || 0.17;
    const dR = parseFloat(cs.getPropertyValue('--cover-ratio')) || 0.72;
    m = {
      H,
      ws: H * wsR,
      d: H * dR,
      gap: H * SHELF.gapRatio,
      U: H * (mobileQuery.matches ? SHELF.depthMobile : SHELF.depth),
      P: SHELF.perspective,
    };
    table = buildScreenTable(m.U);
    rect = zone.getBoundingClientRect();
    drawFloor();
    for (const b of books) b.transform = '';
    wake();
  }

  // 地面阴影：半调网点画成的椭圆（网点由中心向外变小）
  function drawFloor() {
    const w = floor.clientWidth;
    const h = floor.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    floor.width = Math.round(w * dpr);
    floor.height = Math.round(h * dpr);
    const ctx = floor.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getComputedStyle(root).getPropertyValue('--ink').trim() || '#1b1a17';
    ctx.globalAlpha = 0.42;
    const pitch = mobileQuery.matches ? SHELF.floorPitch * 0.8 : SHELF.floorPitch;
    const a = w / 2;
    const b = h / 2;
    for (let row = 0, y = pitch / 2; y < h; row++, y += pitch * 0.866) {
      for (let x = pitch / 2 + (row % 2) * (pitch / 2); x < w; x += pitch) {
        const nx = (x - a) / a;
        const ny = (y - h * 0.44) / b;
        const q = nx * nx + ny * ny;
        if (q >= 1) continue;
        const r = pitch * 0.48 * Math.sqrt(Math.pow(1 - q, 1.5));
        if (r < 0.3) continue;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── 标题：遮罩滑入 ──
  function countHtml(it: Item) {
    return it.count > 0 ? `<span class="t-mono">${String(it.count).padStart(2, '0')}</span> 件作品` : '整理中';
  }

  function swap(mask: HTMLElement, html: string, dir: number) {
    const old = [...mask.children] as HTMLElement[];
    const span = document.createElement('span');
    span.className = 'cap-line';
    span.innerHTML = html;
    mask.append(span);
    if (reducedQuery.matches || dir === 0) {
      old.forEach((o) => o.remove());
      return;
    }
    const opts: KeyframeAnimationOptions = {
      duration: SHELF.captionDuration,
      easing: SHELF.captionEase,
      fill: 'both',
    };
    span.animate([{ transform: `translateY(${dir * 105}%)` }, { transform: 'translateY(0)' }], opts);
    for (const o of old) {
      const from = getComputedStyle(o).transform;
      o.getAnimations().forEach((a) => a.cancel());
      o.animate([{ transform: from === 'none' ? 'translateY(0)' : from }, { transform: `translateY(${-dir * 105}%)` }], opts)
        .finished.then(() => o.remove())
        .catch(() => o.remove());
    }
  }

  function setActive(i: number, dir: number) {
    active = i;
    const it = items[i];
    swap(capTitle, escapeHtml(it.name), dir);
    swap(capEn, escapeHtml(it.en), dir);
    swap(capCount, countHtml(it), dir);
    announce();
    markYears();
    emitChange();
  }

  /** 通知外部（子页浮层用来预取内容） */
  function emitChange() {
    const it = items[active];
    if (it.url) root.dataset.activeUrl = it.url;
    else delete root.dataset.activeUrl;
    root.dispatchEvent(new CustomEvent('shelf:change', { detail: { item: it } }));
  }

  /** 子页浮层打开时，书架不响应任何输入 */
  const sheetOpen = () => root.hasAttribute('data-sheet-open');

  function announce() {
    const it = items[active];
    live.textContent = `${it.name}，${it.count > 0 ? `${it.count} 件作品` : '整理中'}`;
  }

  function markYears() {
    const it = items[active];
    for (const el of tlMajors) el.classList.toggle('on', it.years.includes(Number(el.dataset.year)));
    tlDot.classList.toggle('is-empty', it.count === 0);
  }

  // 进场：标题从下方滑入
  function introCaption() {
    if (reducedQuery.matches) return;
    for (const mask of [capTitle, capEn, capCount]) {
      const line = mask.firstElementChild as HTMLElement | null;
      line?.animate([{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], {
        duration: SHELF.captionDuration + 250,
        delay: 250,
        easing: SHELF.captionEase,
        fill: 'both',
      });
    }
  }

  // ── 打开分类 ──
  function open(i: number) {
    const it = items[i];
    if (!it.url || sheetOpen()) return;
    // 先让书停稳（消除残余的弹簧位移），再量封面位置
    T = Math.round(T);
    s = T;
    pointer.inside = false;
    // 封面摆正（去掉鼠标带来的倾斜），浮层里的封面替身才能和它严丝合缝
    tiltX = 0;
    tiltY = 0;
    update(0);
    const cover = books.find((b) => b.i === i && Math.abs(rel(b.v, s, TOTAL)) < 0.5)?.el.querySelector('.cover');
    const ev = new CustomEvent('shelf:open', { cancelable: true, detail: { item: it, cover } });
    // 子页浮层会接管（封面长出）；没有浮层时直接跳转
    if (root.dispatchEvent(ev)) location.href = it.url;
  }

  /** 屏幕坐标是否落在正中打开的封面上 */
  function pointOnCover(x: number, y: number) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const scale = m.P / (m.P - m.H * 0.1); // 打开的书略微前推，屏幕上稍大
    return Math.abs(x - cx) < (m.d / 2) * scale && Math.abs(y - cy) < (m.H / 2) * scale;
  }

  function step(delta: number) {
    T = Math.round(T) + delta;
    wake();
  }

  /** 到第 i 个分类，走最短的方向 */
  function goTo(i: number) {
    let d = mod(i - mod(Math.round(T), N), N);
    if (d > N / 2) d -= N;
    T = Math.round(T) + d;
    wake();
  }

  // ── 主循环 ──
  let raf = 0;
  let last = 0;
  let visible = true;
  let idleFrames = 0;

  function wake() {
    idleFrames = 0;
    if (!raf && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const moving = update(dt);
    // 静止一段时间后暂停循环，省电；任何输入都会唤醒
    idleFrames = moving || dragging ? 0 : idleFrames + 1;
    if (idleFrames < 30 && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  /** 推进一帧，返回是否还在运动 */
  function update(dt: number): boolean {
    const reduced = reducedQuery.matches;

    // 弹簧
    if (reduced) s = T;
    else {
      s += (T - s) * approach(dragging ? SHELF.dragStiffness : SHELF.stiffness, dt);
      if (Math.abs(T - s) < 0.0004) s = T;
    }
    // 位置保持在有限范围内（整圈平移，画面不变）
    if (s > N * 6 || s < -N * 4) {
      const shift = Math.round((s - home) / N) * N;
      s -= shift;
      T -= shift;
      if (dragging) dragT0 -= shift;
    }

    // 当前分类
    const a = mod(Math.round(s), N);
    if (a !== active) {
      const dir = Math.sign(T - s) || lastDir;
      lastDir = dir;
      if (intro) {
        active = a;
      } else setActive(a, dir);
    }
    if (intro && Math.abs(T - s) < 0.5) {
      intro = false;
      if (active !== mod(Math.round(T), N)) setActive(mod(Math.round(T), N), 1);
    }

    // 倾斜
    const settled = Math.abs(T - s) < 0.3;
    let tx = 0;
    let ty = 0;
    // 封面区域按几何判断（3D 旋转后的封面在部分浏览器里命中检测不稳定）
    if (sheetOpen()) pointer.inside = false;
    const over = pointer.inside && settled && pointOnCover(pointer.x, pointer.y);
    // 每本书都能翻开（没有作品的分类，子页里显示“整理中”）
    const zoneCursor = over && items[active].url ? 'open' : '';
    if (zoneCursor !== (zone.dataset.cursor ?? '')) {
      if (zoneCursor) {
        zone.dataset.cursor = zoneCursor;
        zone.dataset.cursorLabel = '翻开';
      } else {
        delete zone.dataset.cursor;
        delete zone.dataset.cursorLabel;
      }
    }
    if (pointer.inside && !reduced && finePointer.matches) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const onCover = settled && Math.abs(pointer.x - cx) < m.d * 0.55 && Math.abs(pointer.y - cy) < m.H * 0.55;
      if (onCover) {
        ty = clamp((pointer.x - cx) / (m.d * 0.55)) * SHELF.tiltCoverY;
        tx = -clamp((pointer.y - cy) / (m.H / 2)) * SHELF.tiltCoverX;
      } else {
        ty = clamp((pointer.x - cx) / rect.width) * SHELF.tiltAmbient;
      }
    }
    const kt = approach(SHELF.tiltRate, dt);
    tiltX += (tx - tiltX) * kt;
    tiltY += (ty - tiltY) * kt;

    // 书本
    let moving = s !== T || Math.abs(tx - tiltX) > 0.01 || Math.abs(ty - tiltY) > 0.01;
    const kl = approach(SHELF.liftRate, dt);
    for (const b of books) {
      const r = rel(b.v, s, TOTAL);
      const want = hovered === b.v && !dragging && Math.abs(r) > 0.5 ? 1 : 0;
      if (reduced) b.lift = want;
      else if (b.lift !== want) {
        b.lift += (want - b.lift) * kl;
        if (Math.abs(want - b.lift) < 0.002) b.lift = want;
        else moving = true;
      }
      const p = pose(r, m, table, b.lift, tiltX, tiltY);

      if (p.hidden !== b.hidden) {
        b.hidden = p.hidden;
        b.el.style.visibility = p.hidden ? 'hidden' : '';
      }
      if (p.hidden) continue;

      const t = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,${p.z.toFixed(2)}px) rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg)`;
      if (t !== b.transform) {
        b.transform = t;
        b.el.style.transform = t;
        b.el.style.zIndex = String(Math.round(3000 + p.z));
      }
      const sS = p.spineShade.toFixed(3);
      if (sS !== b.shadeS) b.spineShade.style.opacity = b.shadeS = sS;
      const sC = p.coverShade.toFixed(3);
      if (sC !== b.shadeC) b.coverShade.style.opacity = b.shadeC = sC;
      const sB = p.backShade.toFixed(3);
      if (sB !== b.shadeB) b.backShade.style.opacity = b.shadeB = sB;

      // 光标状态
      const cur = Math.abs(r) < 0.5 && settled && items[b.i].url ? 'open' : 'spine';
      if (cur !== b.cursor) {
        b.cursor = cur;
        b.el.dataset.cursor = cur;
        b.el.dataset.cursorLabel = cur === 'open' ? '翻开' : '';
      }
    }

    // 时间轴圆点：在相邻两本之间按位置插值；年份跨度过大（首尾相接处）时在中点跳过去
    const fl = Math.floor(s);
    const f = s - fl;
    const y0 = yearOf(mod(fl, N));
    const y1 = yearOf(mod(fl + 1, N));
    const target = Math.abs(y1 - y0) > tlSpan / 2 ? (f < 0.5 ? y0 : y1) : y0 + (y1 - y0) * f;
    if (reduced || Math.abs(target - dotYear) > tlSpan / 2) dotYear = target;
    else dotYear += (target - dotYear) * approach(SHELF.dotRate, dt);
    if (Math.abs(target - dotYear) > 0.001) moving = true;
    tlDot.style.left = `${(((dotYear - tlStart) / tlSpan) * 100).toFixed(3)}%`;
    return moving;
  }

  // ── 输入：点击 ──
  let suppressClick = false;
  zone.addEventListener('click', (e) => {
    if (sheetOpen()) return;
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const el = (e.target as Element).closest<HTMLElement>('.book');
    if (!el) {
      if (Math.abs(T - s) < 0.3 && pointOnCover(e.clientX, e.clientY)) open(active);
      return;
    }
    const v = Number(el.dataset.v);
    const r = rel(v, s, TOTAL);
    if (Math.abs(r) < 0.5) {
      if (Math.abs(T - s) < 0.3) open(mod(v, N));
    } else {
      T = Math.round(s + r);
      wake();
    }
  });

  // ── 输入：拖拽（鼠标 / 手指） ──
  let pressed = false;
  let dragging = false;
  let dragX0 = 0;
  let dragT0 = 0;
  let pid = -1;
  let samples: { t: number; x: number }[] = [];

  zone.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || sheetOpen()) return;
    pressed = true;
    dragging = false;
    dragX0 = e.clientX;
    dragT0 = T;
    pid = e.pointerId;
    samples = [{ t: e.timeStamp, x: e.clientX }];
  });

  zone.addEventListener('pointermove', (e) => {
    if (!pressed || e.pointerId !== pid) return;
    const dx = e.clientX - dragX0;
    if (!dragging && Math.abs(dx) > SHELF.dragThreshold) {
      dragging = true;
      try {
        zone.setPointerCapture(pid);
      } catch {
        /* 指针已失效（极少见），不影响拖拽 */
      }
      root.classList.add('is-dragging');
    }
    if (!dragging) return;
    T = dragT0 - dx / (m.ws + m.gap);
    samples.push({ t: e.timeStamp, x: e.clientX });
    if (samples.length > 6) samples.shift();
    wake();
  });

  function release(e: PointerEvent) {
    if (!pressed || e.pointerId !== pid) return;
    pressed = false;
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
    // 甩动惯性
    const first = samples[0];
    const lastS = samples[samples.length - 1];
    const dtS = (lastS.t - first.t) / 1000;
    const vBooks = dtS > 0 ? (lastS.x - first.x) / dtS / (m.ws + m.gap) : 0;
    const fling = reducedQuery.matches ? 0 : clamp(vBooks * SHELF.flick, SHELF.maxFlick);
    T = Math.round(T - fling);
    wake();
  }
  zone.addEventListener('pointerup', release);
  zone.addEventListener('pointercancel', (e) => {
    if (e.pointerId !== pid) return;
    pressed = false;
    dragging = false;
    root.classList.remove('is-dragging');
    T = Math.round(T);
    wake();
  });
  zone.addEventListener('dragstart', (e) => e.preventDefault());

  // ── 输入：横向滚轮 / 触控板左右滑（竖向滚轮留给页面滚动） ──
  let snapTimer = 0;
  zone.addEventListener(
    'wheel',
    (e) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if ((!horizontal && !e.shiftKey) || sheetOpen()) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.width : 1;
      const delta = (horizontal ? e.deltaX : e.deltaY) * unit;
      T += (delta / (m.ws + m.gap)) * SHELF.wheelSpeed;
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        T = Math.round(T);
        wake();
      }, SHELF.wheelSnapDelay);
      wake();
    },
    { passive: false },
  );

  // ── 输入：悬停与倾斜 ──
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.inside = true;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>('.book');
      hovered = el && zone.contains(el) ? Number(el.dataset.v) : -1;
      wake();
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.inside = false;
    hovered = -1;
    wake();
  });

  // ── 输入：按钮、键盘、时间轴 ──
  root.querySelector('.arrow.prev')?.addEventListener('click', () => step(-1));
  root.querySelector('.arrow.next')?.addEventListener('click', () => step(1));

  let heroInView = true;
  window.addEventListener('keydown', (e) => {
    if (!heroInView || sheetOpen() || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'Enter' && document.activeElement === zone) {
      e.preventDefault();
      open(mod(Math.round(T), N));
    }
  });

  timeline.addEventListener('click', (e) => {
    const track = timeline.getBoundingClientRect();
    const year = tlStart + clamp((e.clientX - track.left) / track.width, 1, 0) * tlSpan;
    let best = -1;
    let bestScore = Infinity;
    const cur = mod(Math.round(T), N);
    items.forEach((it, i) => {
      if (it.year === null) return;
      let d = Math.abs(mod(i - cur, N));
      d = Math.min(d, N - d);
      const score = Math.abs(it.year - year) * 100 + d; // 年份最近优先，其次路程最短
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best >= 0) goTo(best);
  });

  // ── 生命周期 ──
  new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        visible = en.isIntersecting;
        heroInView = en.intersectionRatio >= 0.5;
      }
      if (visible) wake();
    },
    { threshold: [0, 0.5] },
  ).observe(root);

  new ResizeObserver(() => measure()).observe(root);
  window.addEventListener('scroll', () => (rect = zone.getBoundingClientRect()), { passive: true });
  document.addEventListener('visibilitychange', () => !document.hidden && wake());
  reducedQuery.addEventListener('change', () => wake());

  measure();
  if (startIndex !== active) setActive(startIndex, 0);
  else {
    markYears();
    announce();
    emitChange();
  }
  introCaption();
  root.classList.add('is-ready');
  wake();

  // 开发调试：页面在后台时 rAF 不跑，可手动推进 __shelf.tick(秒)
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__shelf = {
      tick: (seconds = 1, fps = 60) => {
        for (let t = 0; t < seconds; t += 1 / fps) update(1 / fps);
        return { s, T, active: items[active].name };
      },
      state: () => ({ s, T, active: items[active].name, m }),
      step,
      goTo,
    };
  }
}

function clamp(v: number, hi = 1, lo = -hi) {
  return Math.min(hi, Math.max(lo, v));
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
