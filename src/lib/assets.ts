// 约定式图片：文件放到固定位置就会被自动使用，不用改代码。
//   src/assets/covers/<分类id>.jpg   —— 替换书的正面（封面），如 app.jpg
//   src/assets/spines/<分类id>.jpg   —— 替换书的侧面（书脊），如 app.jpg
//   src/assets/wechat-qr.png         —— 微信二维码
//   src/assets/portrait.jpg          —— 关于我的照片
//   src/assets/reviews/01.png …      —— 客户评价截图（按文件名排序）
// 支持 jpg / jpeg / png / webp / avif / svg。
import type { ImageMetadata } from 'astro';

type Files = Record<string, { default: ImageMetadata }>;

const covers: Files = import.meta.glob('/src/assets/covers/*.{jpg,jpeg,png,webp,avif,svg}', { eager: true });
const spines: Files = import.meta.glob('/src/assets/spines/*.{jpg,jpeg,png,webp,avif,svg}', { eager: true });
const singles: Files = import.meta.glob('/src/assets/{wechat-qr,portrait}.{jpg,jpeg,png,webp,avif,svg}', {
  eager: true,
});
const reviews: Files = import.meta.glob('/src/assets/reviews/*.{jpg,jpeg,png,webp,avif,svg}', { eager: true });

/** 文件名（不含扩展名，不分大小写）等于 name 的那张图 */
function pick(files: Files, name: string) {
  const hit = Object.entries(files).find(
    ([path]) => path.split('/').pop()!.replace(/\.\w+$/, '').toLowerCase() === name.toLowerCase(),
  );
  return hit?.[1].default;
}

// 网页后台上传的图片在 src/assets/uploads/，设置文件里存的是 /src/assets/uploads/xxx.jpg 这样的路径。
const uploads: Files = import.meta.glob('/src/assets/uploads/**/*.{jpg,jpeg,png,webp,avif,svg}', { eager: true });

/** 按设置文件里存的路径找图；路径写错时打包报错，避免网站上悄悄缺图 */
function byPath(p: string | undefined, where: string) {
  if (!p) return undefined;
  const key = '/' + p.replace(/^\/+/, '');
  const hit = uploads[key];
  if (!hit) throw new Error(`${where}：找不到图片 ${p}（应放在 src/assets/uploads/ 里）`);
  return hit.default;
}

/** 客户评价截图：src/assets/reviews/ 里的图片，按文件名排序（01.png、02.png…） */
export const getReviewImages = () =>
  Object.entries(reviews)
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
    .map(([, m]) => m.default);
/** 后台给某条评价上传的截图 */
export const getUploadedImage = byPath;

/** 书的正面（封面）：后台上传的 → covers/<id>.jpg → 没有则用生成的排版封面 */
export const getCoverImage = (c: { id: string; name: string; cover?: string }) =>
  byPath(c.cover, `书架分类「${c.name}」的封面`) ?? pick(covers, c.id);
/** 书的侧面（书脊）：后台上传的 → spines/<id>.jpg → 没有则用生成的书脊 */
export const getSpineImage = (c: { id: string; name: string; spine?: string }) =>
  byPath(c.spine, `书架分类「${c.name}」的书脊`) ?? pick(spines, c.id);
export const getWechatQr = (uploaded?: string) => byPath(uploaded, '微信二维码') ?? pick(singles, 'wechat-qr');
export const getPortrait = (uploaded?: string) => byPath(uploaded, '关于我的照片') ?? pick(singles, 'portrait');
