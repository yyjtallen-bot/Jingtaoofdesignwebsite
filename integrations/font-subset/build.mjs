// 构建后处理：收字 → 生成核心子集 + 页面增量子集 → 把 @font-face 写进每个页面。
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { collectHtml, extractCssContent, toCodepoints } from './collect.mjs';
import { MARKER, fontFaceRule, toUnicodeRange } from './css.mjs';

const require = createRequire(import.meta.url);
const subsetFont = require('subset-font');

export { MARKER };

export async function buildFontSubsets({ config, distDir, srcDir, cacheDir, base, logger }) {
  const started = performance.now();
  const roles = config.roles;
  const htmlFiles = await walk(distDir, '.html');
  let cssText = '';
  for (const f of await walk(distDir, '.css')) cssText += await readFile(f, 'utf8');

  // 1. 收字
  const pages = [];
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    if (!html.includes(MARKER)) continue;
    const rel = path.relative(distDir, file).split(path.sep).join('/');
    const { text, used, css } = collectHtml(html, roles);
    cssText += css;
    const sets = {};
    for (const [role, s] of Object.entries(text)) sets[role] = toCodepoints(s);
    pages.push({ file, rel, html, sets, used, isCore: matchesAny(rel, config.corePages) });
  }
  if (!pages.length) {
    logger.warn('没有找到带字体标记的页面，跳过子集化。');
    return;
  }

  // 2. 核心字集 = 固定字符 + 核心页面的字（+ CSS 伪元素文字计入黑体）
  const core = {};
  for (const role of Object.keys(roles)) core[role] = toCodepoints(config.always?.[role] ?? '');
  for (const p of pages) {
    if (!p.isCore) continue;
    for (const [role, set] of Object.entries(p.sets)) for (const cp of set) core[role].add(cp);
  }
  const sansRole = Object.keys(roles).find((r) => roles[r].selector === '*');
  if (sansRole) toCodepoints(extractCssContent(cssText), core[sansRole]);

  // 3. 生成子集
  const outDir = path.join(distDir, '_fonts');
  await mkdir(outDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });
  const urlBase = base.replace(/\/?$/, '/') + '_fonts/';
  const sourceBuffers = new Map();
  const made = new Map(); // 去重：相同字体+字重+字集只生成一次
  const report = { core: [], pages: [] };

  async function loadSource(key) {
    if (!sourceBuffers.has(key)) {
      const src = config.sources[key];
      const file = path.join(srcDir, src.file);
      if (!existsSync(file)) {
        throw new Error(`缺少源字体 fonts-src/${src.file}，请先运行 npm run fonts:fetch`);
      }
      const buf = await readFile(file);
      const st = await stat(file);
      sourceBuffers.set(key, { buf, sig: `${src.file}:${st.size}:${st.mtimeMs}`, src });
    }
    return sourceBuffers.get(key);
  }

  async function makeSubset(face, codepoints, kind) {
    const cps = [...codepoints].sort((a, b) => a - b);
    const { buf, sig, src } = await loadSource(face.source);
    const key = createHash('sha1').update(`${sig}|${JSON.stringify(face.weight)}|${cps.join(',')}`).digest('hex');
    if (made.has(key)) return made.get(key);

    const cacheFile = path.join(cacheDir, key + '.woff2');
    let out;
    if (existsSync(cacheFile)) {
      out = await readFile(cacheFile);
    } else {
      const opts = { targetFormat: 'woff2' };
      if (src.axes?.wght) {
        opts.variationAxes = {
          wght: Array.isArray(face.weight)
            ? { min: face.weight[0], max: face.weight[1], default: face.weight[0] }
            : face.weight,
        };
      }
      const text = String.fromCodePoint(...cps);
      out = await subsetFont(buf, text, opts);
      await writeFile(cacheFile, out);
    }
    const hash = createHash('sha1').update(out).digest('hex').slice(0, 8);
    const w = Array.isArray(face.weight) ? face.weight.join('-') : face.weight;
    const name = `${slug(face.family)}-${w}-${kind}.${hash}.woff2`;
    await writeFile(path.join(outDir, name), out);
    const result = { url: urlBase + name, bytes: out.length, glyphs: cps.length, name };
    made.set(key, result);
    return result;
  }

  const coreFiles = [];
  for (const face of config.faces) {
    const set = core[face.role];
    const r = set && set.size ? await makeSubset(face, set, 'core') : null;
    coreFiles.push(r);
    if (r) report.core.push({ face: faceLabel(face), glyphs: r.glyphs, kb: kb(r.bytes), file: r.name });
  }

  // 4. 写回每个页面
  for (const p of pages) {
    const rules = [];
    const preloads = [];
    let extraBytes = 0;
    for (const [i, face] of config.faces.entries()) {
      const role = roles[face.role];
      if (!p.used[face.role]) continue; // 这页没用到这种字体
      const c = coreFiles[i];
      if (c) {
        rules.push(fontFaceRule({ family: face.family, weight: face.weight, display: face.display, url: c.url }));
        if (face.preload) preloads.push(c.url);
      }
      if (p.isCore || role.fixed) continue;
      const delta = new Set();
      for (const cp of p.sets[face.role] ?? []) if (!core[face.role].has(cp)) delta.add(cp);
      if (!delta.size) continue;
      const d = await makeSubset(face, delta, 'page');
      extraBytes += d.bytes;
      rules.push(
        fontFaceRule({
          family: face.family,
          weight: face.weight,
          display: face.display,
          url: d.url,
          range: toUnicodeRange(delta),
        }),
      );
    }
    const tags =
      preloads.map((u) => `<link rel="preload" href="${u}" as="font" type="font/woff2" crossorigin>`).join('') +
      `<style data-font-subset>${rules.join('')}</style>`;
    await writeFile(p.file, p.html.replace(MARKER, tags));
    report.pages.push({ page: p.rel, core: p.isCore, extraKb: kb(extraBytes) });
  }

  await writeFile(path.join(cacheDir, 'report.json'), JSON.stringify(report, null, 2));

  // 5. 简报
  const secs = ((performance.now() - started) / 1000).toFixed(1);
  logger.info(`字体子集化完成：${pages.length} 个页面，用时 ${secs}s`);
  for (const c of report.core) logger.info(`  核心  ${c.face.padEnd(22)} ${String(c.glyphs).padStart(5)} 字  ${c.kb.padStart(7)} KB`);
  const extra = report.pages.filter((x) => x.extraKb !== '0.0');
  for (const x of extra) logger.info(`  增量  ${x.page.padEnd(40)} +${x.extraKb} KB`);
}

function matchesAny(rel, patterns = []) {
  return patterns.some((p) => {
    const re = new RegExp('^' + p.split('*').map(escapeRe).join('[^/]+') + '$');
    return re.test(rel);
  });
}
const escapeRe = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const kb = (n) => (n / 1024).toFixed(1);
const faceLabel = (f) => `${f.family} ${Array.isArray(f.weight) ? f.weight.join('–') : f.weight}`;

async function walk(dir, ext, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}
