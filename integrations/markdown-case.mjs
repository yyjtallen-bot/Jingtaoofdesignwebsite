// 案例 Markdown 的排版处理（Astro 7 默认的 Sätteri 处理器插件，构建时运行）：
// 1. 单独一行的图片 ![说明](./a.jpg) → <figure><img><figcaption>说明</figcaption></figure>
// 2. 按二级标题（## 背景与问题 …）把正文切成一节一节：
//    <section class="case-sec"><header><h2/></header><div class="case-sec-body">…</div></section>
//    这样标题可以在左侧停留（sticky），并自动编号。

const isBlank = (n) => n.type === 'text' && !String(n.value).trim();
const el = (tagName, className, children) => ({
  type: 'element',
  tagName,
  properties: className ? { className: [className] } : {},
  children,
});

/** 把根节点的子节点按 h2 分节 */
function sectionize(children) {
  const out = [];
  const intro = [];
  let body = null;
  for (const child of children) {
    if (child.type === 'element' && child.tagName === 'h2') {
      body = el('div', 'case-sec-body', []);
      out.push(el('section', 'case-sec', [el('header', 'case-sec-head', [child]), body]));
    } else if (body) {
      body.children.push(child);
    } else if (!isBlank(child)) {
      intro.push(child);
    }
  }
  return [...(intro.length ? [el('div', 'case-intro', intro)] : []), ...out];
}

export const caseLayout = {
  name: 'case-layout',
  element: {
    filter: ['p'],
    visit(node) {
      const kids = node.children.filter((c) => !isBlank(c));
      if (kids.length !== 1 || kids[0].type !== 'element' || kids[0].tagName !== 'img') return;
      const img = kids[0];
      const alt = String(img.properties?.alt ?? '').trim();
      return el('figure', 'case-figure', alt ? [img, el('figcaption', null, [{ type: 'text', value: alt }])] : [img]);
    },
  },
  after(root, ctx) {
    // 只处理含二级标题的文档（案例正文）
    if (!root.children.some((c) => c.type === 'element' && c.tagName === 'h2')) return;
    ctx.setField(root, 'children', sectionize([...root.children]));
  },
};
