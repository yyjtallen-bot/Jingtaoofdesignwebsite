// 「服务」板块的内容 —— 文字在 src/settings/services.json（网页后台「服务」里改）。
// 样式和交互在同目录的 Services.astro。服务项可增可减（不一定要 4 项）。
//
// icon：图标名。可选的图标见 /styleguide/ 的「图标」一栏：
//   interface 界面/APP · web 网页 · miniapp 小程序 · brand 品牌/Logo · system 设计系统/后台
//   motion 动效 · print 海报/物料 · package 包装 · illustration 插画 · retail 门店
//   video 短视频/IP · talk 沟通 · plan 报价/排期 · sketch 设计/提案 · revise 修改
//   deliver 交付 · partner 长期合作
import data from '@/settings/services.json';
import { asIcon } from '@/lib/settings';

export const services = {
  title: data.title,
  en: data.en,
  lead: data.lead,
  /** 同一时间只展开一项（false 则可以同时展开多项） */
  exclusive: data.exclusive,
  items: data.items.map((s, i) => ({ ...s, icon: asIcon(s.icon, `服务第 ${i + 1} 项`) })),
  /** 列表下方的小字说明，留空不显示 */
  note: data.note,
};
