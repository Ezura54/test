# PopPK Learning Map

这是一个 GitHub Pages 友好的静态网页，用于把《群体药动学和药效学分析进阶》的知识图谱转化为可搜索、可点击、移动端可预览的 PopPK 快速学习工具。

## 功能

- 响应式网页，支持手机浏览。
- 知识图谱可视化浏览。
- 节点搜索和类型筛选。
- 30 分钟 PopPK 学习路径。
- 项目建模 checklist。
- 无需后端，直接部署到 GitHub Pages。

## 本地预览

推荐在本目录运行：

```powershell
node serve.js 8765
```

然后浏览器打开：

```text
http://127.0.0.1:8765
```

如果你不用 Node，也可以尝试：

```powershell
python -m http.server 8765
```

不建议直接双击 `index.html`，因为部分浏览器会限制本地 HTML 读取 `data/knowledge-graph.json`。

## 部署到 GitHub Pages

1. 新建仓库，例如 `poppk-learning-map`。
2. 上传本目录全部内容。
3. 打开仓库 `Settings -> Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，Folder 选择 `/root`。
6. 保存后等待数分钟，GitHub 会生成 Pages URL。

## 数据来源

`data/knowledge-graph.json` 来自本地生成的知识图谱结构化数据。网页只使用节点、关系和摘要，不包含书籍正文长段摘录。
