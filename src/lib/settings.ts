// 读取 src/settings/*.json（网页后台 /admin 改的就是这些文件）时的小工具：
// 后台填错时在打包阶段给出看得懂的报错，而不是让网站悄悄显示错乱。
import { iconNames, type IconName } from '@/components/icons/icons';

export function asIcon(name: string, where: string): IconName {
  if ((iconNames as string[]).includes(name)) return name as IconName;
  throw new Error(`${where}：图标「${name}」不存在。可选：${iconNames.join(' / ')}`);
}

/** 后台里留空的图片字段是 ''，统一当作“没有” */
export const optional = (v: string | undefined | null) => (v && v.trim() ? v.trim() : undefined);
