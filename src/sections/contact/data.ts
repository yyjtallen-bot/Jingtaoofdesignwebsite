// 「联系」板块的内容 —— 文字在 src/settings/contact.json（网页后台「联系」里改）。
// 样式在同目录的 Contact.astro。微信号、邮箱、城市在 src/settings/site.json（全站共用）。
import data from '@/settings/contact.json';

export const contact = {
  title: data.title,
  en: data.en,
  /** 大字邀请语，换行即分行 */
  statement: data.statement,
  /** 补充说明：接什么类型的项目、怎么开始 */
  lead: data.lead,
  /** 回复时间 */
  response: data.response,
};
