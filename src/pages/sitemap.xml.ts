// 站点地图（给搜索引擎）：首页 + 12 个分类页 + 已发布的案例页
import type { APIRoute } from 'astro';
import { caseUrl, categoryUrl, getAllCases, getCategoriesWithCases } from '@/lib/cases';
import { withBase } from '@/lib/url';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://example.com');
  const cats = await getCategoriesWithCases();
  const cases = await getAllCases();
  const paths = [withBase('/'), ...cats.map((c) => categoryUrl(c.id)), ...cases.map(caseUrl)];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
