// 12 个作品分类 = 书架上的 12 本书（顺序即书架顺序）。
//
// binding：这本书的装帧色 —— bone 米白 / kraft 牛皮 / ink 墨黑 / accent 主色
//          （具体色值在 src/styles/tokens.css 的 --book-* 里）
//
// 封面：默认用代码生成的统一版式排版海报（几何图形见 src/components/shelf/motifs.ts）。
// 想换成作品图：把图片放到 src/assets/covers/<id>.jpg（png / webp / avif 也行），
// 例如 src/assets/covers/app.jpg，会自动替换，不用改这里。封面比例约 5:7（宽:高）。
//
// 作品数量不用手填：按 src/content/cases 里各分类的案例自动统计。
// 为 0 时书脊显示“整理中”，书仍然可以翻开，子页里显示“整理中”和微信名片。

// 名称 / 英文 / 装帧色 / 简介 / 封面图 / 书脊图都在 src/settings/categories.json
// （网页后台「书架分类」里改）。这里只固定 12 个分类的 id（网址用）和编号，不要改。
import data from '@/settings/categories.json';
import { optional } from '@/lib/settings';

export type Binding = 'bone' | 'kraft' | 'ink' | 'accent';
const bindings: Binding[] = ['bone', 'kraft', 'ink', 'accent'];

const ids = [
  'app',
  'web',
  'miniapp',
  'admin',
  'motion',
  'identity',
  'poster',
  'print',
  'packaging',
  'illustration',
  'retail',
  'ip',
] as const;
type Id = (typeof ids)[number];

export interface Category {
  id: Id;
  no: string;
  name: string;
  en: string;
  binding: Binding;
  intro: string;
  /** 后台上传的封面 / 书脊图片路径；没有则用 src/assets/covers|spines/<id>.jpg 或生成的版式 */
  cover?: string;
  spine?: string;
}

export const categories: readonly Category[] = ids.map((id, i) => {
  const c = data[id];
  if (!bindings.includes(c.binding as Binding)) {
    throw new Error(`书架分类「${c.name}」的装帧色「${c.binding}」不对，可选：${bindings.join(' / ')}`);
  }
  return {
    id,
    no: String(i + 1).padStart(2, '0'),
    name: c.name,
    en: c.en,
    binding: c.binding as Binding,
    intro: c.intro,
    cover: optional(c.cover),
    spine: optional(c.spine),
  };
});

/** 还没有作品的分类，子页里显示的文字（12 个分类共用）；button 是子页首屏按钮的文字 */
export const emptyState = data.empty;
export type CategoryId = Category['id'];

export const categoryIds = [...ids] as [CategoryId, ...CategoryId[]];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
