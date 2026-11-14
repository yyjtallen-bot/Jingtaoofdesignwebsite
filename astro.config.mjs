// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import fontSubset from './integrations/font-subset/index.mjs';
import { caseLayout } from './integrations/markdown-case.mjs';
import fontsConfig from './fonts.config.mjs';

/** 只在本地开发时存在的页面（不会被构建、不会上线） */
const devOnlyPages = {
  name: 'dev-only-pages',
  hooks: {
    /** @param {{ command: string, injectRoute: (r: { pattern: string, entrypoint: string }) => void }} opts */
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      // 设计变量预览：http://localhost:4321/styleguide/
      injectRoute({ pattern: '/styleguide', entrypoint: './src/dev/styleguide.astro' });
    },
  },
};

export default defineConfig({
  // 上线时改成你的域名，用于生成绝对链接 / sitemap / 分享卡片
  // 现在放在 GitHub Pages 的默认网址上（多一截 /Jingtaoofdesignwebsite 路径）。
  // 以后绑定自己的域名时：site 改成 'https://你的域名'，并删掉下面 base 这一行。
  site: 'https://yyjtallen-bot.github.io',
  base: '/Jingtaoofdesignwebsite',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  markdown: {
    // 案例正文：图片说明 + 按二级标题分节（Astro 7 默认的 Sätteri 处理器）
    // @ts-ignore 插件是普通对象，类型由 satteri 在运行时校验
    processor: satteri({ hastPlugins: [caseLayout] }),
  },
  integrations: [fontSubset(fontsConfig), devOnlyPages],
});
