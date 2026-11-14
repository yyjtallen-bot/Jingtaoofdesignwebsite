import { getCollection, type CollectionEntry } from 'astro:content';
import { categories, type Category, type CategoryId } from '@/data/categories';
import { withBase } from './url';

export type Case = CollectionEntry<'cases'>;
export type CategoryWithCases = Category & { cases: Case[]; count: number };

/** 草稿只在本地开发时可见 */
const isVisible = ({ data }: Case) => import.meta.env.DEV || !data.draft;

function byOrder(a: Case, b: Case) {
  return (
    (a.data.order ?? Infinity) - (b.data.order ?? Infinity) ||
    b.data.year - a.data.year ||
    a.data.title.localeCompare(b.data.title, 'zh-CN')
  );
}

export async function getAllCases(): Promise<Case[]> {
  return (await getCollection('cases', isVisible)).sort(byOrder);
}

/** 12 个分类 + 各自的案例和数量（书架、分类页都用这个） */
export async function getCategoriesWithCases(): Promise<CategoryWithCases[]> {
  const all = await getAllCases();
  return categories.map((c) => {
    const cases = all.filter((x) => x.data.category === c.id);
    return { ...c, cases, count: cases.length };
  });
}

/** 下一个案例：同分类的下一个；到末尾则跳到后面第一个有案例的分类；全站循环 */
export async function getNextCase(current: Case): Promise<Case | undefined> {
  const list = (await getCategoriesWithCases()).flatMap((c) => c.cases);
  if (list.length < 2) return undefined;
  const i = list.findIndex((x) => x.id === current.id);
  return list[(i + 1) % list.length];
}

export const categoryUrl = (id: CategoryId) => withBase(`/work/${id}/`);
export const caseUrl = (entry: Case) => withBase(`/work/${entry.data.category}/${entry.id}/`);
