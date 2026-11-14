// 「关于我」板块的内容 —— 文字和照片在 src/settings/about.json（网页后台「关于我」里改）。
// 样式在同目录的 About.astro。
// 照片：后台上传；没上传时，用 src/assets/portrait.jpg（png / webp 也行）。
import data from '@/settings/about.json';
import { optional } from '@/lib/settings';

export const about = {
  title: data.title,
  en: data.en,
  lead: data.lead,
  /** 自我介绍，一段一行 */
  intro: data.intro,
  /** 照片（后台上传后的路径） */
  photo: optional(data.photo),
  /** 照片下方的小字 */
  photoCaption: data.photoCaption,

  /** 履历：从近到远 */
  careerTitle: data.careerTitle,
  career: data.career,

  /** 能力标签：可以分组 */
  skillsTitle: data.skillsTitle,
  skills: data.skills,
};
