// 下载源字体到 fonts-src/（已存在的文件会跳过）。
// 用法：npm run fonts:fetch
// 网络慢时可设置镜像前缀，例如：
//   $env:FONT_MIRROR="https://你的镜像/"; npm run fonts:fetch   （会拼在原地址前面）
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import config from '../fonts.config.mjs';

const dir = new URL('../fonts-src/', import.meta.url);
const dirPath = decodeURIComponent(dir.pathname).replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(dirPath, { recursive: true });

const mirror = process.env.FONT_MIRROR ?? '';
const jobs = [];
for (const [key, src] of Object.entries(config.sources)) {
  jobs.push({ name: src.file, url: src.url });
  if (src.license) jobs.push({ name: `${key}.OFL.txt`, url: src.license });
}

for (const job of jobs) {
  const out = join(dirPath, job.name);
  if (existsSync(out) && statSync(out).size > 0) {
    console.log(`✓ 已存在  ${job.name}`);
    continue;
  }
  const url = mirror + job.url;
  process.stdout.write(`↓ 下载中  ${job.name} … `);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    console.log(`失败 (${res.status})`);
    process.exitCode = 1;
    continue;
  }
  const tmp = out + '.part';
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
  renameSync(tmp, out);
  console.log(`${(statSync(out).size / 1048576).toFixed(1)} MB`);
}
