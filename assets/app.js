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
    title: "第 1 课：PopPK 到底在解决什么",
    time: "12 分钟",
    level: "入门",
    nodes: ["pkpd_model", "math_model", "model_application"],
    goal: "理解 PopPK 的核心目标：用群体数据估计典型参数、个体差异和影响因素。",
    learn: [
      "为什么同一剂量下不同患者浓度差异很大。",
      "CL、V、Ka、F、IIV、RUV 分别在模型中扮演什么角色。",
      "PopPK 不是画曲线，而是回答剂量、暴露、变异和临床决策问题。",
    ],
    example: "氨磺必利项目的研究问题可以写成：在精神科患者中，肾功能和合并用药如何影响氨磺必利暴露，并能否支持剂量个体化？",
    avoid: "不要一开始就写代码。先把研究问题、终点、模型用途和验收标准写清楚。",
    action: "用一句话写出你的建模目的，并标注它属于解释、预测还是剂量决策。",
  },
  {
    title: "第 2 课：数据长什么样，错误从哪里来",
    time: "15 分钟",
    level: "入门",
    nodes: ["data_structure", "bql", "optimal_sampling"],
    goal: "看懂 PopPK 数据表：ID、TIME、AMT、DV、EVID、CMT、协变量和 BQL。",
    learn: [
      "给药记录和浓度记录为什么必须共用时间轴。",
      "BQL 不能随便删，因为它会影响低浓度段清除估计。",
      "采样设计决定模型能不能识别吸收、清除和分布。",
    ],
    example: "氨磺必利数据要先核查采血时间是否相对给药时间正确，合并用药哑变量是否按患者或采样时点编码一致。",
    avoid: "不要直接把宽表丢进模型；先确认长表结构、单位、缺失、异常值和 BQL 编码。",
    action: "做一张数据审查表：样本数、患者数、每人浓度数、BQL 比例、剂量范围、eGFR 范围。",
  },
  {
    title: "第 3 课：基础结构模型怎么搭",
    time: "18 分钟",
    level: "核心",
    nodes: ["parameter_estimation", "model_identifiability", "transit_compartment"],
    goal: "理解一室/二室、吸收、清除、分布这些结构选择如何影响参数解释。",
    learn: [
      "一室模型不是低级模型，而是数据能支持时的稳健选择。",
      "CL 决定暴露，V 决定浓度尺度，Ka 或延迟结构决定早期曲线形状。",
      "结构越复杂，越需要数据支持和可辨识性检查。",
    ],
    example: "氨磺必利若采样点较稀疏，盲目上二室或复杂吸收结构可能导致参数不可识别。",
    avoid: "不要因为 OFV 下降就接受复杂结构；先看参数 RSE、相关性、诊断图和生理范围。",
    action: "列出候选基础模型，并为每个模型写出你预期它改善哪一段曲线。",
  },
  {
    title: "第 4 课：随机效应和残差误差",
    time: "16 分钟",
    level: "核心",
    nodes: ["variability_model", "iov", "shrinkage", "ebe"],
    goal: "理解 IIV、IOV、RUV 和 shrinkage，知道为什么它们会影响协变量判断。",
    learn: [
      "ETA 描述个体间变异，不是普通残差。",
      "残差模型不合适会把结构错误伪装成随机噪声。",
      "shrinkage 高时，ETA-covariate 图容易给出假趋势或看不出真趋势。",
    ],
    example: "若氨磺必利 CL 的 ETA shrinkage 很高，就不能单靠 CL ETA 与 eGFR/BUN 的散点图判断协变量。",
    avoid: "不要把 EBE 图当成绝对证据；它只是提示，最终要靠模型和诊断共同判断。",
    action: "输出基础模型 shrinkage，并标注哪些参数适合做协变量筛选。",
  },
  {
    title: "第 5 课：估计、收敛和可辨识性",
    time: "18 分钟",
    level: "核心",
    nodes: ["model_identifiability", "structural_identifiability", "numerical_identifiability", "parameter_estimation"],
    goal: "知道模型跑完不等于模型可信，学会看收敛、RSE、边界、相关矩阵和假收敛。",
    learn: [
      "结构可辨识性回答理论上能不能估，数值可辨识性回答当前数据能不能稳。",
      "%RSE、condition number、参数相关性和协方差计算状态都要看。",
      "false convergence 或参数贴边时，OFV 没有解释价值。",
    ],
    example: "协变量筛选前，氨磺必利基础模型必须先通过收敛、参数精度和 shrinkage 门槛。",
    avoid: "不要让不稳定基础模型进入 SCM；后续所有协变量结论都会被污染。",
    action: "给基础模型做一张验收表：收敛、OFV、RSE、shrinkage、诊断、参数生理范围。",
  },
  {
    title: "第 6 课：协变量筛选怎么做才不乱",
    time: "22 分钟",
    level: "进阶",
    nodes: ["covariate_model", "d_optimal", "mixture_model", "covariate_model"],
    goal: "掌握协变量建模的原则：先预筛，再机制定位，再统计筛选，最后临床解释。",
    learn: [
      "连续协变量常用 log-centering，分类变量要看阳性人数。",
      "SCM 的前向/后向阈值只是统计工具，不是最终真理。",
      "协变量应该加到有机制意义的参数上，而不是全部塞进总 CL。",
    ],
    example: "氨磺必利中 eGFR 机制性进入 CLrenal，合并用药主分析放在非 eGFR 解释清除通道；MET/LI 才做肾通道敏感性分析。",
    avoid: "不要让同一个合并用药同时在 CLnr 和 CLrenal 中竞争，否则通道归因不稳。",
    action: "建立协变量候选表：变量、作用参数、中心化方式、预期方向、样本量门槛、是否主分析。",
  },
  {
    title: "第 7 课：模型评价和诊断图怎么看",
    time: "20 分钟",
    level: "核心",
    nodes: ["model_evaluation", "vpc", "npde", "diagnostics", "sse"],
    goal: "学会判断模型是否有系统偏倚，而不是只看图好不好看。",
    learn: [
      "DV-PRED 看总体预测，DV-IPRED 看个体拟合。",
      "CWRES-TIME 和 CWRES-PRED 用于发现时间或浓度相关偏倚。",
      "VPC/pcVPC 检查模型是否能重现观测分布。",
    ],
    example: "氨磺必利最终模型要按低/中/高浓度分层检查 |CWRES| > 2 的比例是否 <= 10%。",
    avoid: "不要只报告一张 GOF 图；关键协变量分层和浓度分层也要报告。",
    action: "输出 GOF、VPC、协变量分层 GOF、残差分层统计，并写出每张图的判断结论。",
  },
  {
    title: "第 8 课：模拟、剂量建议和报告",
    time: "18 分钟",
    level: "应用",
    nodes: ["trial_design", "decision_making", "dose_response", "model_application"],
    goal: "把模型从“参数表”变成临床可用的结论。",
    learn: [
      "模拟要围绕临床问题，而不是为了展示模型能模拟。",
      "剂量建议必须报告不确定性和适用范围。",
      "论文报告要讲清楚数据、模型、协变量、诊断、模拟和限制。",
    ],
    example: "如果 eGFR 显著影响氨磺必利 CLrenal，下一步应该模拟不同肾功能分层下的稳态浓度，而不是只报告 theta。",
    avoid: "不要把统计显著直接写成临床重要；要看效应大小是否足以改变剂量。",
    action: "设计 3 个模拟场景：正常肾功能、中度肾损害、低 eGFR 合并用药患者。",
  },
];

const caseSteps = [
  {
    title: "1. 数据体检",
    text: "确认 ID、TIME、AMT、DV、EVID、WT、eGFR、BUN、UA、SEX、合并用药字段完整。输出缺失率、异常值和 BQL 比例。",
  },
  {
    title: "2. 机制基础模型",
    text: "继承双通道清除：CLrenal 由 eGFR 驱动，WT 用异速标尺固定。不要在协变量阶段改变基础结构。",
  },
  {
    title: "3. 协变量预筛",
    text: "连续变量检查分布和共线性；二分类合并用药要求阳性人数充足。样本太少只做探索性描述。",
  },
  {
    title: "4. 主 SCM",
    text: "BUN/UA 测试在 CLrenal 上；SEX/AGE/合并用药主分析测试在非 eGFR 解释清除通道或 V 上。",
  },
  {
    title: "5. 肾通道敏感性分析",
    text: "MET 和 LI 可分别测试到 CLrenal，但必须满足机制解释、RSE、诊断和稳定性，不能只凭 OFV 保留。",
  },
  {
    title: "6. 最终验收",
    text: "检查收敛、%RSE、方向合理性、GOF、VPC、CWRES 分层偏倚和模拟应用价值。",
  },
];

const quizQuestions = [
  {
    question: "基础模型 false convergence，但某个协变量加入后 OFV 大幅下降。应该怎么做？",
    options: ["保留该协变量", "先修基础模型，不能用不稳定模型做 SCM", "只要 RSE 小于 50% 就可以"],
    answer: 1,
    why: "协变量筛选依赖基础模型稳定。不稳定基础模型会让 OFV 改善失去解释意义。",
  },
  {
    question: "eGFR 已经机制性进入 CLrenal，还要把 eGFR 当普通协变量再加到总 CL 上吗？",
    options: ["不应重复加入", "应该加入，OFV 会更低", "只在女性患者加入"],
    answer: 0,
    why: "重复加入会造成共线性和重复解释，破坏机制通道含义。",
  },
  {
    question: "合并用药阳性人数只有 3 人，但 SCM 显著。最稳妥的解释是什么？",
    options: ["一定是强效药物相互作用", "可能由极少数样本驱动，应降级为探索性发现", "直接进入最终模型"],
    answer: 1,
    why: "二分类协变量样本太少时，LRT 和参数估计都不稳，不能作为主结论。",
  },
  {
    question: "ETA shrinkage 很高时，ETA-协变量散点图应该如何使用？",
    options: ["作为强证据", "完全不能看", "只能作为弱提示，需模型和诊断验证"],
    answer: 2,
    why: "高 shrinkage 会压缩 ETA，削弱或扭曲协变量趋势。",
  },
  {
    question: "最终模型报告中，哪个组合最完整？",
    options: ["OFV + 参数表", "GOF + VPC + RSE + shrinkage + 分层残差 + 临床解释", "只给最终公式"],
    answer: 1,
    why: "PopPK 模型可信度来自多维证据，不是单一统计指标。",
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
        <span>${escapeHtml(lesson.level)} · ${escapeHtml(lesson.time)}</span>
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
  const learnItems = lesson.learn.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  $("lessonDetail").innerHTML = `
    <p class="eyebrow">${escapeHtml(lesson.level)} · ${escapeHtml(lesson.time)}</p>
    <h3>${escapeHtml(lesson.title)}</h3>
    <div class="tutorial-meta">
      <span>学习目标</span>
      <p>${escapeHtml(lesson.goal)}</p>
    </div>
    <div class="lesson-sections">
      <section>
        <h4>你要掌握</h4>
        <ul>${learnItems}</ul>
      </section>
      <section>
        <h4>项目例子</h4>
        <p>${escapeHtml(lesson.example)}</p>
      </section>
      <section>
        <h4>常见错误</h4>
        <p>${escapeHtml(lesson.avoid)}</p>
      </section>
      <section>
        <h4>马上行动</h4>
        <p>${escapeHtml(lesson.action)}</p>
      </section>
    </div>
    <h4>对应图谱节点</h4>
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

function renderCaseLab() {
  $("caseSteps").innerHTML = caseSteps
    .map((step, index) => `
      <article class="case-step">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.text)}</p>
        </div>
      </article>
    `)
    .join("");
}

function renderQuiz() {
  $("quizBox").innerHTML = quizQuestions
    .map((item, index) => `
      <article class="quiz-card" data-question="${index}">
        <h3>${index + 1}. ${escapeHtml(item.question)}</h3>
        <div class="quiz-options">
          ${item.options
            .map((option, optionIndex) => `<button type="button" data-option="${optionIndex}">${escapeHtml(option)}</button>`)
            .join("")}
        </div>
        <p class="quiz-feedback" aria-live="polite"></p>
      </article>
    `)
    .join("");

  $("quizBox").querySelectorAll(".quiz-card").forEach((card) => {
    const questionIndex = Number(card.dataset.question);
    const question = quizQuestions[questionIndex];
    card.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = Number(button.dataset.option);
        const correct = selected === question.answer;
        card.querySelectorAll("button").forEach((item) => {
          item.classList.remove("correct", "wrong");
          if (Number(item.dataset.option) === question.answer) item.classList.add("correct");
        });
        if (!correct) button.classList.add("wrong");
        card.querySelector(".quiz-feedback").textContent = `${correct ? "答对。" : "这题要重看。"}${question.why}`;
      });
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
    renderCaseLab();
    renderQuiz();
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
