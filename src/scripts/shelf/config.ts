// 书架手感参数（可以微调）
export const SHELF = {
  /** 12 本书渲染几份首尾相接，保证两侧总有书 */
  copies: 3,
  /** 书与书的间隙 = 书高 × gapRatio */
  gapRatio: 0.035,
  /** 纵深衰减距离 = 书高 × depth（越小两侧越快退远） */
  depth: 1.3,
  depthMobile: 1.05,
  /** CSS 透视距离 px */
  perspective: 1400,

  /** 弹簧：每秒趋近速率。松手后 5.2，拖拽中 18（跟手） */
  stiffness: 5.2,
  dragStiffness: 18,

  /** 拖拽：移动超过多少 px 才算拖；甩动惯性（秒）与最多多甩几本 */
  dragThreshold: 5,
  flick: 0.1,
  maxFlick: 4,

  /** 横向滚轮 / 触控板：灵敏度与停止后多久对齐 */
  wheelSpeed: 0.5,
  wheelSnapDelay: 160,

  /** 封面随鼠标倾斜（度）：在封面上 / 在别处 */
  tiltCoverY: 8,
  tiltCoverX: 5,
  tiltAmbient: 4,
  tiltRate: 7,

  /** 悬停时书从架上抽出的速率 */
  liftRate: 12,

  /** 时间轴圆点趋近速率 */
  dotRate: 14,

  /** 标题遮罩滑入 */
  captionDuration: 650,
  captionEase: 'cubic-bezier(0.2, 0.8, 0.2, 1)',

  /** 进场：书架从左侧滑入多少本 */
  introOffset: 2.6,

  /** 地面半调阴影的网点间距 px */
  floorPitch: 5,
};
