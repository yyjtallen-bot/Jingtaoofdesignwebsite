// robots.txt：允许收录，并告诉搜索引擎站点地图的位置
import type { APIRoute } from 'astro';
import { withBase } from '@/lib/url';

export const GET: APIRoute = ({ site }) => {
  const sitemap = site ? new URL(withBase('/sitemap.xml'), site).href : withBase('/sitemap.xml');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
