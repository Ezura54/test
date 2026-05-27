const state = {
  graph: null,
  activeNodeId: "book",
  query: "",
  typeFilter: "all",
};

const typeLabels = {
  all: "全部",
  book: "书",
  module: "模块",
  chapter: "章节",
  concept: "概念",
  method: "方法",
  model: "模型",
  mechanism: "机制",
  evaluation: "评价",
  workflow: "流程",
  data: "数据",
  application: "应用",
  diagnostic: "诊断",
  parameter: "参数",
  tool: "工具",
};

const colors = {
  book: "#1f4e5f",
  module: "#a35428",
  chapter: "#315c43",
  concept: "#596f62",
  method: "#5d548d",
  model: "#9a3d46",
  mechanism: "#856404",
  evaluation: "#0f6d76",
  workflow: "#455a64",
  data: "#617b2d",
  application: "#8b4f6f",
  diagnostic: "#6d5b2a",
  parameter: "#806a7a",
  tool: "#6a6f7a",
};

const lessons = [
  {
    title: "1. 先理解 PopPK 在解决什么",
    time: "5 分钟",
    nodes: ["pkpd_model", "math_model", "model_application"],
    goal: "把给药、浓度、效应和个体差异放到同一套定量框架里。",
    avoid: "不要一开始就陷入软件语法。先说清楚研究问题和模型要解释的临床现象。",
    action: "写一句话研究问题：我想用氨磺必利模型解释或预测什么？",
  },
  {
    title: "2. 搭基础模型",
    time: "8 分钟",
    nodes: ["parameter_estimation", "model_identifiability", "variability_model"],
    goal: "理解结构模型、随机效应和残差模型如何共同决定参数估计。",
    avoid: "不要只追求 OFV 下降；不可辨识模型的 OFV 也可能很好看。",
    action: "检查基础模型是否收敛、参数是否可识别、清除和分布是否生理合理。",
  },
  {
    title: "3. 做协变量筛选",
    time: "7 分钟",
    nodes: ["covariate_model", "shrinkage", "mixture_model", "iov"],
    goal: "区分真实协变量效应、共线性、收缩导致的假趋势和合并用药混杂。",
    avoid: "不要把每个变量都粗暴加到总清除率上；协变量要放到符合机制的位置。",
    action: "先做缺失率、阳性人数、相关性和 shrinkage 预筛，再做 SCM。",
  },
  {
    title: "4. 评价模型",
    time: "6 分钟",
    nodes: ["model_evaluation", "vpc", "npde", "diagnostics"],
    goal: "确认模型不仅拟合成功，而且在浓度、时间和协变量分层下没有系统偏倚。",
    avoid: "不要只看整体 GOF；低、中、高浓度段和关键协变量层也要看。",
    action: "输出 GOF、VPC/pcVPC、CWRES 分层统计和协变量残留趋势图。",
  },
  {
    title: "5. 进入应用与论文表达",
    time: "4 分钟",
    nodes: ["trial_design", "decision_making", "dose_response", "mbma"],
    goal: "把模型结果转化为剂量建议、试验设计依据或临床解释。",
    avoid: "不要把统计显著直接写成临床重要；要报告效应大小和不确定性。",
    action: "用模拟回答一个临床问题：某类患者是否需要剂量调整？",
  },
];

const checklist = [
  {
    title: "数据",
    text: "缺失率、BQL、采样时间、剂量记录、合并用药阳性人数先过关。",
  },
  {
    title: "基础模型",
    text: "结构参数可识别，清除和分布有生理意义，不被异常样本驱动。",
  },
  {
    title: "协变量",
    text: "先看 shrinkage、共线性和样本量，再看 OFV；保留效应必须能解释。",
  },
  {
    title: "诊断",
    text: "GOF、CWRES、VPC/pcVPC、分层残差和参数 RSE 一起看。",
  },
];

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalize(value) {
  return String(value ?? "").toLowerCase().trim();
}

function nodeById(id) {
  return state.graph.nodesById.get(id);
}

function connectedEdges(id) {
  return state.graph.edges.filter((edge) => edge.source === id || edge.target === id);
}

function relationLabel(edge, id) {
  const otherId = edge.source === id ? edge.target : edge.source;
  const arrow = edge.source === id ? "→" : "←";
  return {
    other: nodeById(otherId),
    arrow,
  };
}

async function loadGraph() {
  const response = await fetch("data/knowledge-graph.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`无法读取知识图谱数据：${response.status}`);
  }
  const graph = await response.json();
  graph.nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  return graph;
}

function renderStats() {
  const nodes = state.graph.nodes.length;
  const edges = state.graph.edges.length;
  const chapters = state.graph.nodes.filter((node) => node.type === "chapter").length;
  $("quickStats").innerHTML = `
    <span>${nodes} 个知识节点</span>
    <span>${edges} 条关系</span>
    <span>${chapters} 个章节</span>
    <span>手机端可访问</span>
  `;
}

function renderTypeFilters() {
  const types = ["all", ...new Set(state.graph.nodes.map((node) => node.type))];
  $("typeFilters").innerHTML = types
    .map((type) => {
      const active = state.typeFilter === type ? " active" : "";
      return `<button class="type-chip${active}" data-type="${type}" type="button">${typeLabels[type] || type}</button>`;
    })
    .join("");

  $("typeFilters").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.typeFilter = button.dataset.type;
      renderTypeFilters();
      renderExplorer();
    });
  });
}

function getMatches() {
  const query = normalize(state.query);
  return state.graph.nodes.filter((node) => {
    const typeOk = state.typeFilter === "all" || node.type === state.typeFilter;
    if (!typeOk) return false;
    if (!query) return true;
    const haystack = normalize(`${node.label} ${node.summary} ${node.pages || ""} ${node.type}`);
    return haystack.includes(query);
  });
}

function getVisibleNodeIds() {
  const visible = new Set(["book", "workflow"]);
  const modules = state.graph.nodes.filter((node) => node.type === "module").map((node) => node.id);
  modules.forEach((id) => visible.add(id));

  const query = normalize(state.query);
  if (!query && state.typeFilter === "all") {
    state.graph.nodes
      .filter((node) => node.type === "chapter")
      .forEach((node) => visible.add(node.id));
    return visible;
  }

  const matches = getMatches().slice(0, 36);
  matches.forEach((node) => {
    visible.add(node.id);
    connectedEdges(node.id).forEach((edge) => {
      visible.add(edge.source);
      visible.add(edge.target);
    });
  });

  if (state.activeNodeId) {
    visible.add(state.activeNodeId);
    connectedEdges(state.activeNodeId).slice(0, 24).forEach((edge) => {
      visible.add(edge.source);
      visible.add(edge.target);
    });
  }

  return visible;
}

function getLayout(nodes) {
  const positions = new Map();
  const byType = (type) => nodes.filter((node) => node.type === type);
  positions.set("book", { x: 120, y: 380 });
  positions.set("workflow", { x: 1060, y: 380 });

  const modules = byType("module");
  modules.forEach((node, index) => {
    positions.set(node.id, { x: 330, y: 210 + index * 170 });
  });

  const chapters = byType("chapter");
  const chapterGroups = {
    part_foundation: chapters.filter((node) => node.module === "part_foundation"),
    part_complex: chapters.filter((node) => node.module === "part_complex"),
    part_application: chapters.filter((node) => node.module === "part_application"),
  };
  const groupY = { part_foundation: 180, part_complex: 380, part_application: 585 };
  Object.entries(chapterGroups).forEach(([moduleId, group]) => {
    const startX = 495;
    group.forEach((node, index) => {
      positions.set(node.id, {
        x: startX + (index % 6) * 92,
        y: groupY[moduleId] + Math.floor(index / 6) * 62,
      });
    });
  });

  const remaining = nodes.filter((node) => !positions.has(node.id));
  remaining.forEach((node, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    positions.set(node.id, {
      x: 700 + col * 106,
      y: 110 + row * 60,
    });
  });

  return positions;
}

function nodeSize(node) {
  if (node.type === "book") return { w: 158, h: 64, r: 24 };
  if (node.type === "module") return { w: 156, h: 56, r: 22 };
  if (node.type === "chapter") return { w: 128, h: 46, r: 18 };
  if (node.type === "workflow") return { w: 144, h: 56, r: 22 };
  return { w: 116, h: 42, r: 18 };
}

function splitLabel(label, max = 7) {
  const text = String(label);
  if (text.length <= max) return [text];
  return [text.slice(0, max), text.slice(max, max * 2)];
}

function svgNode(node, position, isDim) {
  const size = nodeSize(node);
  const color = colors[node.type] || "#6a6f7a";
  const active = node.id === state.activeNodeId ? " active" : "";
  const dim = isDim ? " dim" : "";
  const lines = splitLabel(node.label, node.type === "chapter" ? 7 : 8);
  const labelY = lines.length === 1 ? 5 : -2;
  const caption = node.pages ? `<text class="caption" x="0" y="${size.h / 2 - 9}" text-anchor="middle">p${escapeHtml(node.pages)}</text>` : "";

  return `
    <g class="kg-node${active}${dim}" data-node-id="${escapeHtml(node.id)}" transform="translate(${position.x}, ${position.y})">
      <rect x="${-size.w / 2}" y="${-size.h / 2}" width="${size.w}" height="${size.h}" rx="${size.r}" fill="${color}"></rect>
      ${lines
        .map((line, index) => `<text x="0" y="${labelY + (index - (lines.length - 1) / 2) * 15}" text-anchor="middle" font-size="${node.type === "chapter" ? 11 : 12}">${escapeHtml(line)}</text>`)
        .join("")}
      ${caption}
    </g>
  `;
}

function svgEdge(edge, positions) {
  const source = nodeById(edge.source);
  const target = nodeById(edge.target);
  const s = positions.get(edge.source);
  const t = positions.get(edge.target);
  if (!source || !target || !s || !t) return "";
  const semantic = ["包含", "覆盖", "包含步骤"].includes(edge.relation) ? "" : " semantic";
  const dx = Math.max(40, Math.abs(t.x - s.x) * 0.34);
  const d = `M ${s.x} ${s.y} C ${s.x + dx} ${s.y}, ${t.x - dx} ${t.y}, ${t.x} ${t.y}`;
  return `<path class="kg-edge${semantic}" d="${d}"></path>`;
}

function renderExplorer() {
  const visibleIds = getVisibleNodeIds();
  const nodes = state.graph.nodes.filter((node) => visibleIds.has(node.id));
  const edges = state.graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const positions = getLayout(nodes);
  const matches = new Set(getMatches().map((node) => node.id));
  const hasQuery = normalize(state.query) || state.typeFilter !== "all";

  $("graphSvg").innerHTML = `
    <g>${edges.map((edge) => svgEdge(edge, positions)).join("")}</g>
    <g>${nodes.map((node) => svgNode(node, positions.get(node.id), hasQuery && !matches.has(node.id) && node.id !== state.activeNodeId)).join("")}</g>
  `;

  $("graphSvg").querySelectorAll(".kg-node").forEach((el) => {
    el.addEventListener("click", () => {
      state.activeNodeId = el.dataset.nodeId;
      renderExplorer();
      renderNodePanel(state.activeNodeId);
    });
  });

  renderResultStrip();
  renderNodePanel(state.activeNodeId);
}

function renderResultStrip() {
  const matches = getMatches().slice(0, 16);
  if (!normalize(state.query) && state.typeFilter === "all") {
    $("resultStrip").innerHTML = "";
    return;
  }
  if (!matches.length) {
    $("resultStrip").innerHTML = `<div class="node-chip">没有匹配节点。换一个关键词，例如“诊断”“模型评价”“协变量”。</div>`;
    return;
  }
  $("resultStrip").innerHTML = matches
    .map((node) => `<button class="node-chip" type="button" data-node-id="${escapeHtml(node.id)}">${escapeHtml(node.label)} <small>${typeLabels[node.type] || node.type}</small></button>`)
    .join("");
  $("resultStrip").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeNodeId = button.dataset.nodeId;
      renderExplorer();
      document.querySelector("#explore").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderNodePanel(id) {
  const node = nodeById(id) || state.graph.nodes[0];
  const relations = connectedEdges(node.id).slice(0, 12);
  const relationHtml = relations
    .map((edge) => {
      const item = relationLabel(edge, node.id);
      return `<li><strong>${escapeHtml(edge.relation)}</strong> ${item.arrow} ${escapeHtml(item.other?.label || "")}<br><small>${escapeHtml(edge.detail || "")}</small></li>`;
    })
    .join("");
  const badges = [
    `<span class="node-chip">${escapeHtml(typeLabels[node.type] || node.type)}</span>`,
    node.pages ? `<span class="node-chip">页码 ${escapeHtml(node.pages)}</span>` : "",
  ].join("");

  $("nodePanel").innerHTML = `
    <p class="eyebrow">Node detail</p>
    <h3>${escapeHtml(node.label)}</h3>
    <div>${badges}</div>
    <p>${escapeHtml(node.summary || "这个节点暂无摘要。")}</p>
    <h4>怎么学</h4>
    <p>${learningHint(node)}</p>
    <h4>相邻关系</h4>
    <ul class="relation-list">${relationHtml || "<li>暂无相邻关系。</li>"}</ul>
  `;
}

function learningHint(node) {
  if (node.type === "chapter") return "先读本章目录，再搜索章内核心概念。做项目时把它转成一张检查清单。";
  if (node.type === "evaluation" || node.type === "diagnostic") return "把它放在模型验收阶段使用，不要只凭 OFV 或收敛信息下结论。";
  if (node.type === "method") return "先确认适用条件、统计假设和失败场景，再把它写进脚本。";
  if (node.type === "model") return "先问它解释什么机制，再问数据是否支持这个复杂度。";
  if (node.type === "data") return "先检查缺失、极端值、编码和样本量，数据问题会直接变成模型偏倚。";
  return "把它和相邻节点一起学：一个概念通常要配合估计、评价和应用才完整。";
}

function renderLessons() {
  $("lessonList").innerHTML = lessons
    .map((lesson, index) => `
      <button class="lesson-card${index === 0 ? " active" : ""}" type="button" data-index="${index}">
        <strong>${escapeHtml(lesson.title)}</strong>
        <span>${escapeHtml(lesson.time)} · ${lesson.nodes.map((id) => nodeById(id)?.label).filter(Boolean).slice(0, 3).join(" / ")}</span>
      </button>
    `)
    .join("");

  $("lessonList").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      $("lessonList").querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderLessonDetail(Number(button.dataset.index));
    });
  });

  renderLessonDetail(0);
}

function renderLessonDetail(index) {
  const lesson = lessons[index];
  const chips = lesson.nodes
    .map((id) => nodeById(id))
    .filter(Boolean)
    .map((node) => `<button class="node-chip" type="button" data-node-id="${escapeHtml(node.id)}">${escapeHtml(node.label)}</button>`)
    .join("");

  $("lessonDetail").innerHTML = `
    <p class="eyebrow">${escapeHtml(lesson.time)}</p>
    <h3>${escapeHtml(lesson.title)}</h3>
    <p><strong>你要学会：</strong>${escapeHtml(lesson.goal)}</p>
    <p><strong>常见错误：</strong>${escapeHtml(lesson.avoid)}</p>
    <p><strong>马上行动：</strong>${escapeHtml(lesson.action)}</p>
    <div class="quick-stats">${chips}</div>
  `;

  $("lessonDetail").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeNodeId = button.dataset.nodeId;
      state.query = nodeById(state.activeNodeId)?.label || "";
      $("searchInput").value = state.query;
      renderExplorer();
      document.querySelector("#explore").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderChecklist() {
  $("checklistGrid").innerHTML = checklist
    .map((item) => `
      <article class="check-card">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.text)}</p>
      </article>
    `)
    .join("");
}

function wireSearch() {
  $("searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderExplorer();
  });
}

async function init() {
  try {
    state.graph = await loadGraph();
    renderStats();
    renderTypeFilters();
    renderLessons();
    renderChecklist();
    wireSearch();
    renderExplorer();
  } catch (error) {
    $("quickStats").innerHTML = `<span>${escapeHtml(error.message)}</span>`;
    $("nodePanel").innerHTML = `
      <p class="eyebrow">Data error</p>
      <h3>知识图谱数据未载入</h3>
      <p>请确认 <code>data/knowledge-graph.json</code> 存在。若直接双击本地 HTML，浏览器可能限制读取本地 JSON，建议用 GitHub Pages 或本地 HTTP 服务打开。</p>
    `;
  }
}

init();
