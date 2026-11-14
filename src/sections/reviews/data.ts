// 「客户评价」板块的内容 —— 文字和截图在 src/settings/reviews.json（网页后台「客户评价」里改）。
// 样式在同目录的 Reviews.astro。
//
// 每条评价可以在后台上传一张截图。没上传的条目，按顺序用 src/assets/reviews/ 里的图片
// （按文件名排序：01.png、02.png…）；都没有时显示占位卡片。
// 请先自己给截图打码（头像、昵称、电话、金额等），网站不会自动打码。
import data from '@/settings/reviews.json';
import { optional } from '@/lib/settings';

export const reviews = {
  title: data.title,
  en: data.en,
  lead: data.lead,
  items: data.items.map((it) => ({ client: it.client, project: it.project, image: optional(it.image) })),
};
