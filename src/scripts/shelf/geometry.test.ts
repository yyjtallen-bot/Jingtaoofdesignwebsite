// 运行：npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arc, blend, buildScreenTable, edgeReach, pose, rel, scaleAt, screenX, type Metrics } from './geometry.ts';

const H = 420;
const m: Metrics = { H, ws: H * 0.17, d: H * 0.72, gap: H * 0.035, U: H * 1.3, P: 1400 };
const table = buildScreenTable(m.U);

test('rel 把序号包进 [-total/2, total/2)', () => {
  assert.equal(rel(0, 0, 36), 0);
  assert.equal(rel(35, 0, 36), -1);
  assert.equal(rel(18, 0, 36), -18);
  assert.equal(rel(17, 0, 36), 17);
  assert.ok(Math.abs(rel(3, 2.4, 36) - 0.6) < 1e-9);
});

test('两端的书同步淡入淡出：任意翻动位置，可见书的总量不变', () => {
  const reach = edgeReach(m);
  assert.equal(reach % 1, 0, '边界落在整格上：左右同步，停稳时两端的书完全显示');
  // 停稳时没有半透明的书
  for (let v = -30; v <= 30; v++) assert.ok([0, 1].includes(pose(v, m, table, 0, 0, 0, reach).edge), `v=${v}`);
  const total = (s: number) => {
    let sum = 0;
    for (let v = -30; v <= 30; v++) sum += pose(v - s, m, table, 0, 0, 0, reach).edge;
    return sum;
  };
  const base = total(0);
  for (const s of [0.1, 0.25, 0.5, 0.75, 0.9]) assert.ok(Math.abs(total(s) - base) < 1e-9, `s=${s}`);
  // 正中两侧对称
  assert.equal(pose(reach - 0.3, m, table, 0, 0, 0, reach).edge, pose(-(reach - 0.3), m, table, 0, 0, 0, reach).edge);
});

test('blend 在 ±1 处连续', () => {
  assert.ok(Math.abs(blend(1 - 1e-9) - 0.5) < 1e-6);
  assert.ok(Math.abs(blend(-1 + 1e-9) + 0.5) < 1e-6);
  assert.equal(blend(0), 0);
});

test('打开的封面与相邻书脊不重叠', () => {
  const firstNeighbour = arc(1, m);
  assert.ok(firstNeighbour - m.ws / 2 >= m.d / 2, `${firstNeighbour} vs ${m.d / 2 + m.ws / 2}`);
});

test('弧长随序号单调递增', () => {
  let prev = -Infinity;
  for (let r = -18; r <= 18; r += 0.05) {
    const u = arc(r, m);
    assert.ok(u > prev);
    prev = u;
  }
});

test('屏幕 x 单调、越远越挤', () => {
  const a = screenX(m.U * 0.2, table) - screenX(m.U * 0.1, table);
  const b = screenX(m.U * 1.2, table) - screenX(m.U * 1.1, table);
  assert.ok(a > b);
  assert.equal(screenX(-100, table), -screenX(100, table));
});

test('3D 深度投影回屏幕后，缩放与 x 吻合', () => {
  for (const r of [0, 1, 2.5, -4, 7]) {
    const p = pose(r, m, table);
    if (p.o > 0) continue; // 打开的书额外前推，不参与此校验
    const projected = m.P / (m.P - p.z);
    assert.ok(Math.abs(projected - p.sc) < 1e-9);
    assert.ok(Math.abs(p.x * projected - screenX(arc(r, m), table)) < 1e-6);
  }
});

test('左右两侧对称位置的书，露出的侧面明暗一致', () => {
  for (const r of [2, 5, 9]) {
    const left = pose(-r, m, table);
    const right = pose(r, m, table);
    // 左侧书露出封面，右侧书露出封底
    assert.ok(Math.abs(left.coverShade - right.backShade) < 1e-9);
    assert.ok(right.backShade > 0.2 && right.backShade < 0.7);
  }
  // 越远越暗
  assert.ok(pose(9, m, table).backShade > pose(2, m, table).backShade);
  // 打开的封面不加暗
  assert.equal(pose(0, m, table).coverShade, 0);
});

test('正中的书完全打开，远处的书被隐藏', () => {
  const center = pose(0, m, table);
  assert.equal(center.o, 1);
  assert.equal(center.ry, -90);
  assert.equal(pose(17, m, table).hidden, true);
  assert.equal(scaleAt(0, m.U), 1);
});
