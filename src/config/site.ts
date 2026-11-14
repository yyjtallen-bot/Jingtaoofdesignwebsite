// 站点信息 —— 文字在 src/settings/site.json（网页后台「网站信息」里改）。
// 所有 [方括号] 都是占位，换成你的真实信息即可。
import data from '@/settings/site.json';
import { optional } from '@/lib/settings';

export const site = {
  name: data.name,
  nameEn: data.nameEn,
  role: data.role,
  /** 品牌行副标题，显示在顶栏名字后面 */
  tagline: data.tagline,
  title: data.title,
  description: data.description,
  city: data.city,

  /** 底部时间轴：入行年份 —— 结束年份 */
  careerStart: data.careerStart,
  careerEnd: data.careerEnd,

  contact: {
    wechatId: data.wechatId,
    /** 微信二维码：后台上传；没上传时用 src/assets/wechat-qr.png（或 .jpg/.webp） */
    wechatQr: optional(data.wechatQr),
    email: data.email,
  },

  /**
   * ICP 备案号。网站放在大陆服务器并绑定域名时必须在页脚展示，例如 '粤ICP备XXXXXXXX号'。
   * 留空则不显示。
   */
  icp: data.icp,

  /** 首页书架默认展示的分类 */
  defaultCategory: 'app',

  /** 手机端底部常驻按钮 */
  ctaLabel: data.ctaLabel,

  nav: [
    { label: '作品', href: '/#shelf' },
    { label: '服务', href: '/#services' },
    { label: '关于', href: '/#about' },
    { label: '联系', href: '/#contact' },
  ],
} as const;
