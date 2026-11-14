// Astro 集成：字体按页面子集化
//   dev   —— 开发服务器在 /_fonts-src/ 提供完整源字体
//   build —— 构建完成后扫描 dist 里的 HTML，生成子集并注入 @font-face
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFontSubsets } from './build.mjs';

export { MARKER } from './build.mjs';
export { devFontFaceCss } from './css.mjs';

export default function fontSubset(config) {
  let root = process.cwd();
  let base = '/';

  return {
    name: 'font-subset',
    hooks: {
      'astro:config:setup': ({ config: astroConfig, addWatchFile }) => {
        root = fileURLToPath(astroConfig.root);
        base = astroConfig.base || '/';
        addWatchFile(new URL('./fonts.config.mjs', astroConfig.root));
      },

      'astro:server:setup': ({ server, logger }) => {
        const srcDir = path.join(root, 'fonts-src');
        const warned = new Set();
        server.middlewares.use((req, res, next) => {
          const url = (req.url ?? '').split('?')[0];
          const prefix = base.replace(/\/?$/, '/') + '_fonts-src/';
          if (!url.startsWith(prefix)) return next();
          const name = path.basename(decodeURIComponent(url.slice(prefix.length)));
          const file = path.join(srcDir, name);
          if (!existsSync(file)) {
            if (!warned.has(name)) {
              warned.add(name);
              logger.warn(`缺少源字体 fonts-src/${name}，运行 npm run fonts:fetch 下载`);
            }
            res.statusCode = 404;
            return res.end();
          }
          res.setHeader('Content-Type', name.endsWith('.otf') ? 'font/otf' : 'font/ttf');
          res.setHeader('Content-Length', statSync(file).size);
          res.setHeader('Cache-Control', 'max-age=3600');
          createReadStream(file).pipe(res);
        });
      },

      'astro:build:done': async ({ dir, logger }) => {
        await buildFontSubsets({
          config,
          distDir: fileURLToPath(dir),
          srcDir: path.join(root, 'fonts-src'),
          cacheDir: path.join(root, 'node_modules', '.cache', 'font-subset'),
          base,
          logger,
        });
      },
    },
  };
}
