# 个人作品集 · Astro

东方当代 + 编辑排版风格的 UI 设计作品集。纯静态站点，构建产物是一个 `dist/` 文件夹，可以放到任意静态托管上（见文末「部署」）。

> **不是程序员？先看《[修改指南.md](修改指南.md)》**：换图片、改文字、新增案例、上线，都有一步步的说明。日常只需要双击「预览网站.bat」看效果、双击「打包上线文件.bat」生成上线文件。

## 常用命令

```bash
npm install          # 首次安装依赖
npm run dev          # 本地开发 http://localhost:4321（首次会自动下载源字体）
npm run build        # 构建到 dist/（含字体子集化）
npm run preview      # 本地预览构建结果
npm test             # 书架几何算法的单元测试
npm run check        # 类型检查
```

设计变量预览页：本地开发时访问 `/styleguide/`（只在开发时存在，不会上线）。

## 目录结构

```
portfolio/
├─ astro.config.mjs            Astro 配置（★ 上线前改 site 为你的域名）
├─ fonts.config.mjs            字体配置：源文件、字重、收字规则、核心页面
├─ fonts-src/                  源字体（只在本机，不上线、不进 git）
├─ integrations/
│  ├─ font-subset/             字体按页面子集化（构建后处理）
│  └─ markdown-case.mjs        案例正文排版（图片说明、按二级标题分节）
├─ scripts/fetch-fonts.mjs     下载源字体
├─ public/                     原样拷贝的静态文件（favicon）
└─ src/
   ├─ config/site.ts           ★ 站点信息：名字、入行年份、微信号、邮箱、城市、ICP 备案号
   ├─ data/categories.ts       ★ 12 个作品分类（书架上的 12 本书）
   ├─ content.config.ts        案例的字段定义（frontmatter 校验）
   ├─ content/cases/           ★ 案例，一个文件（或文件夹）= 一个案例
   │  ├─ _template.md          新案例模板（_ 开头不会发布）
   │  └─ example-draft/        示例草稿（只在本地显示，有了正式案例后可删除）
   ├─ assets/                  ★ 约定式图片（见下）
   ├─ sections/                ★ 首页各板块，一个文件夹一个模块
   ├─ components/
   │  ├─ shelf/                首屏书架（书、封面、时间轴）
   │  ├─ sheet/                分类子页（从封面长出）
   │  ├─ case/                 案例详情页的各个部分
   │  ├─ icons/                图标库
   │  ├─ contact/              微信名片
   │  └─ …                     Section 板块外框、Img 图片、Lightbox 图片放大、光标、页脚等
   ├─ styles/
   │  ├─ tokens.css            ★ 设计变量：颜色、字体、字号、间距、动效、层级、书本配色
   │  ├─ base.css              重置、排版默认值、工具类、纸纹、滚动揭示
   │  └─ sheet.css             分类子页样式
   ├─ scripts/                 交互脚本（书架、子页、光标、图片放大、复制…）
   ├─ layouts/BaseLayout.astro 页面骨架（字体、分享卡片、纸纹、光标、图片放大）
   ├─ dev/styleguide.astro     设计变量预览（仅开发）
   └─ pages/
      ├─ index.astro                    首页
      ├─ work/[category]/index.astro    分类子页
      ├─ work/[category]/[slug].astro   案例详情
      ├─ sitemap.xml.ts / robots.txt.ts 给搜索引擎
      └─ 404.astro
```

带 ★ 的是日常会改的地方。

## 怎么改

**换主色**：`src/styles/tokens.css` 里的 `--accent`，浅底、网点、选中色会自动跟着变。

**图片都用约定位置**，放进去就生效，不用改代码（jpg / png / webp / avif / svg 都可以）：

| 放什么 | 放哪里 |
|---|---|
| 书的正面（替换生成的排版封面，约 5:7，建议 1080×1500） | `src/assets/covers/<分类id>.jpg`，如 `app.jpg` |
| 书的侧面（替换生成的书脊，建议 255×1500） | `src/assets/spines/<分类id>.jpg` |
| 微信二维码 | `src/assets/wechat-qr.png` |
| 个人照片（4:5） | `src/assets/portrait.jpg` |
| 客户评价截图（先自己打码） | `src/assets/reviews/01.png`、`02.png`…，说明文字在 `src/sections/reviews/data.ts`，顺序对应 |

**分类作品数**：自动统计，不用手填。12 本书都能翻开；数量为 0 的分类书脊显示“整理中”，子页里显示“整理中”说明和微信名片（文字在 `src/data/categories.ts` 的 `emptyState`）。

**子页的展开过渡**（按对标）：纸从封面长出、文字逐行升起、主图墨迹晕开，参数集中在 `src/scripts/sheet/reveal.ts` 顶部的 `SHEET`。12 个子页的内容在首页里预先备好（`src/components/sheet/SheetOverlay.astro`），点开不需要再读取文件。

**书的装帧色**：`src/data/categories.ts` 每个分类的 `binding`（bone 米白 / kraft 牛皮 / ink 墨黑 / accent 主色）。**生成封面的几何图形**：`src/components/shelf/motifs.ts`。**书架手感**：`src/scripts/shelf/config.ts`。

**分类子页**：内容在 `src/components/sheet/CategorySheet.astro`，样式在 `src/styles/sheet.css`。首页点开封面时，浮层取的是 `/work/<分类>/` 页面里同一份内容，只需要改一处。动画时长在 `src/scripts/sheet/reveal.ts` 顶部的 `SHEET`。

## 写案例

1. 复制 `src/content/cases/_template.md`。推荐每个案例一个文件夹：`src/content/cases/brand-app/index.md`，图片放在同一个文件夹的 `images/` 里。
2. 文件夹名（英文、短横线）就是网址：`/work/<分类>/brand-app/`。
3. 填好 frontmatter（标题、分类、封面、年份、客户、角色、时间、类型、摘要），写好后把 `draft` 改成 `false` 才会发布。
4. 正文用 Markdown，排版会自动处理：
   - 每个 `## 二级标题` 是一节，标题在左侧停留并自动编号（01、02…），建议按「背景与问题 / 思路过程 / 最终方案 / 结果」来写；
   - 第一个二级标题之前的文字是导语；
   - 单独一行的图片 `![图片说明](./images/a.jpg)` 会变成带说明的大图，点击可放大；
   - `> 引用` 会显示成强调句，列表、加粗、链接都可以用。

案例详情页由 `src/components/case/` 下的几个独立组件拼成（顶栏、阅读进度条、抬头、封面、信息条、正文、下一个案例），想调整哪一块就改哪个组件，顺序在 `src/pages/work/[category]/[slug].astro`。

## 首页板块（每个模块独立可改）

首页 = 书架 + `src/sections/` 下的 5 个板块。每个板块一个文件夹，互不依赖：

| 想改什么 | 改哪里 |
|---|---|
| 某个板块的文字、条目数量 | 该文件夹的 `data.ts` |
| 某个板块的版式、交互 | 该文件夹的 `.astro`（样式只作用于这个板块） |
| 板块顺序、去掉某个板块 | `src/pages/index.astro` 里调换 / 删除一行，编号自动跟着变 |
| 所有板块左侧的竖排标题栏 | `src/components/Section.astro`（一处改全部） |
| 微信名片（联系板块和手机底部弹出层共用） | `src/components/contact/WechatCard.astro` |
| 服务 / 流程的图标 | 在 `data.ts` 里改 `icon: '名字'`；全部图标见 `/styleguide/`，图形定义在 `src/components/icons/icons.ts` |
| 滚动时文字升起 / 线条画出 / 图片揭开 | 在元素上加 `data-reveal`、`data-reveal="line"`、`data-reveal="clip"`，样式在 `base.css` 末尾 |
| 让某组图片可以点击放大 | 在外层容器加 `data-zoomable` |

新增一个板块：复制任意一个板块文件夹，改名、改 `data.ts`，再在 `index.astro` 里加一行。

## 字体方案

- 思源宋体（标题 600、背景大字 900）、思源黑体（正文和标签，400–500 可变字重）、DM Mono（数字和英文小标签），均为 SIL OFL 授权。
- 全部自托管，不请求 Google Fonts 或任何第三方字体服务。
- **开发时**加载完整源字体（几十 MB，只在本机）。
- **构建时**扫描每个页面实际出现的字：首页 + 分类页的字合并成**核心子集**（全站共享、可缓存）；案例详情等其他页面只额外加载核心里没有的字（**增量子集**）；等宽字体全站一个固定小文件。
- 收字规则：标题用 `h1–h4` 或 `class="t-serif"`；背景大字 `class="t-display"`；等宽 `class="t-mono"`；其余全部归黑体。
- JS 运行时才出现的文字写在元素的 `data-glyphs` 属性里，构建时一并收入。

## 无障碍与动效

- 系统开启「减少动态效果」时：书架直接到位、标题不滑动、子页 / 图片放大瞬间完成、墨迹不播放、滚动揭示直接显示、光标不拖尾。
- 键盘：Tab 到书架后用 ← → 切换、回车打开，ESC 关闭子页 / 图片放大；页面顶部有“跳到主要内容”。
- 书架、子页浮层、图片放大都有读屏说明；子页打开时背景内容不可聚焦。

## 上线前检查

- [ ] `astro.config.mjs` 的 `site` 改成你的域名（影响分享卡片、站点地图）
- [ ] `src/config/site.ts`：名字、入行年份、微信号、邮箱、城市；大陆服务器填 `icp` 备案号
- [ ] 所有 `data.ts` 里的 `[占位]` 换成真实文案
- [ ] 放好二维码、照片、评价截图、至少一个正式案例（`draft: false`）
- [ ] 删除 `src/content/cases/example-draft/`
- [ ] `npm run build` 无报错，`npm run preview` 本地检查一遍

## 部署

`npm run build` 后把 `dist/` 文件夹整个上传即可（构建前会自动下载缺失的源字体）。

- **网站放在大陆、用自己的域名**：需要先做 ICP 备案。备案后推荐 **腾讯云 COS** 或 **阿里云 OSS** 的「静态网站托管」+ CDN，国内访问最快。
- **暂时不备案**：可以用香港 / 海外的静态托管（如 Vercel、Cloudflare Pages、Netlify），国内能访问但速度不稳定。
- 缓存建议：`/_astro/` 和 `/_fonts/` 下的文件名带哈希，可以设置长缓存（一年）；HTML 文件不缓存或短缓存。
- 构建机器需要 Node 22.12 以上。

## 阶段

1. 项目骨架、设计变量、字体子集化 ✓
2. 首屏书架 ✓
3. 封面长出分类子页、墨迹晕开主图 ✓
4. 首页下方板块、移动端底部按钮、图标 ✓
5. 案例详情页（阅读进度条、图片放大、下一个案例）、无障碍与动效复查、SEO、部署说明 ✓
