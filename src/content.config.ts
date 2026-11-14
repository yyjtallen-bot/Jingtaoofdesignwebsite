// 案例内容集合：src/content/cases/ 里每个 .md 文件就是一个案例。
// 文件名（英文、短横线连接）就是网址，例如 brand-app.md → /work/app/brand-app/
// 也可以用文件夹：brand-app/index.md，图片放同一个文件夹里。
// 以 _ 开头的文件（如 _template.md）不会被收录。
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categoryIds } from './data/categories';

const cases = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.md',
    base: './src/content/cases',
    generateId: ({ entry }) =>
      entry
        .replace(/\.md$/i, '')
        .replace(/\/index$/i, '')
        .split('/')
        .pop()!,
  }),
  schema: ({ image }) =>
    z.object({
      /** 案例标题 */
      title: z.string(),
      /** 网页后台填的网址名（实际网址取文件夹名，这一项只给后台用） */
      slug: z.string().optional(),
      /** 所属分类，必须是 src/data/categories.ts 里的 id */
      category: z.enum(categoryIds),
      /** 封面图，相对本文件的路径，如 ./cover.jpg；不填则用生成的占位封面 */
      cover: image().optional(),
      /** 年份（用于排序） */
      year: z.number().int(),
      /** 类型，如「从 0 到 1」「改版」「品牌升级」 */
      type: z.string(),
      /** 信息条：客户 / 角色 / 时间 */
      client: z.string(),
      role: z.string(),
      period: z.string(),
      /** 一句话摘要，用在分类页卡片上 */
      summary: z.string().optional(),
      /** 同分类内排序，数字小的在前；不填按年份倒序 */
      order: z.number().optional(),
      /** 草稿：只在本地开发时显示，不会发布 */
      draft: z.boolean().default(false),
    }),
});

export const collections = { cases };
