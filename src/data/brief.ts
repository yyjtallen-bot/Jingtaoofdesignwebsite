// 「合作需求单」的文字和选项 —— 在 src/settings/brief.json（网页后台「合作需求单」里改）。
// 样式和交互在 src/components/contact/Brief.astro。
// 客户勾选后点按钮，会复制一段整理好的文字，粘贴到微信发给你。
// 「想做什么」的选项自动取「服务」板块的服务名称，另外加上 extraServices 里的项。
// 复制出去的文字：第一行是 heading，没选的项显示 emptyValue。
import data from '@/settings/brief.json';

export const brief = data;
