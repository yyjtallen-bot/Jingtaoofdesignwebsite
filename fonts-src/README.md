# fonts-src

源字体目录，只在本机使用，不会上传到网站，也不进 git。

运行 `npm run fonts:fetch` 自动下载；如果网络慢，可以手动把下面这些文件放进来（文件名要一致）：

| 文件 | 用途 |
|---|---|
| `NotoSerifSC[wght].ttf` | 思源宋体（可变字重），标题 / 背景大字 |
| `NotoSansSC[wght].ttf` | 思源黑体（可变字重），正文 / 标签 |
| `DMMono-Regular.ttf` / `DMMono-Medium.ttf` | 等宽，数字和英文小标签 |

下载地址见根目录 `fonts.config.mjs`。三款字体均为 SIL Open Font License 1.1。
