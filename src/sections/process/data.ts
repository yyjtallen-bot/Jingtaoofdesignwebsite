// 「合作流程」板块的内容 —— 文字在 src/settings/process.json（网页后台「合作流程」里改）。
// 样式在同目录的 Process.astro。步骤数不限（建议 4–6 步）。
// icon：图标名，可选的图标见 /styleguide/ 的「图标」一栏（和服务板块是同一套）。
import data from '@/settings/process.json';
import { asIcon } from '@/lib/settings';

export const process = {
  title: data.title,
  en: data.en,
  lead: data.lead,
  steps: data.steps.map((s, i) => ({ ...s, icon: asIcon(s.icon, `合作流程第 ${i + 1} 步`) })),
};
