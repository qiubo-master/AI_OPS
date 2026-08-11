type GenerateRequest = { topic?: string; audience?: string };

const mockCourse = (topic: string, audience: string) => ({
  title: topic,
  subtitle: "门店技师标准化培训 · AI生成草稿",
  audience,
  duration: "约 30 分钟",
  objective: "理解轮胎基础标识，掌握接车检查、施工复核与交付说明的标准流程",
  slides: [
    { eyebrow: "01 · 课程导入", title: "标准服务，从安全确认开始", body: "轮胎服务涉及车辆适配、施工质量与行车安全。每个动作都需要依据和记录。", points: ["先确认车辆、订单与客户诉求", "对异常轮胎拍照并说明风险", "所有施工结果可追溯"], note: "用门店真实案例引入，但不得展示用户隐私。", source: "培训知识库 · 轮胎服务SOP v3.2" },
    { eyebrow: "02 · 轮胎标识", title: "六个信息读懂轮胎规格", body: "以225/55 R17 97W为例，依次识别断面宽度、扁平比、结构、轮辋、负荷和速度级别。", points: ["规格核对不能只看宽度", "前后轴可能采用不同规格", "最终以车型、年款和原厂数据为准"], note: "现场展示胎侧真实照片，要求学员逐项识别。", source: "培训知识库 · 轮胎规格识别指南 v2.7" },
    { eyebrow: "03 · 接车检查", title: "四项检查，避免带病施工", body: "接车后完成外观、胎压、磨损与规格检查，再确认是否进入施工环节。", points: ["检查鼓包、裂纹、扎伤和异常磨损", "记录胎压与花纹深度", "核对生产日期与安装方向"], note: "出现严重安全风险时停止常规流程并升级处理。", source: "培训知识库 · 门店接车检查清单 v4.1" },
    { eyebrow: "04 · 安装施工", title: "安装、紧固与复核", body: "按照设备操作规范完成拆装、动平衡和紧固，关键步骤双重确认。", points: ["保护轮辋与胎压传感器", "按规范完成动平衡", "使用合规工具与扭矩要求复核"], note: "具体参数必须来自有效设备手册和车型规范。", source: "培训知识库 · 轮胎安装作业指导书 v5.0" },
    { eyebrow: "05 · 交付说明", title: "让客户听懂服务结果", body: "交付时说明已完成项目、检查发现、使用注意和后续建议，避免模糊承诺。", points: ["展示施工与检查记录", "解释胎压和磨合注意事项", "告知复查方式与售后渠道"], note: "不得夸大风险或做无依据的更换推荐。", source: "培训知识库 · 轮胎服务交付话术 v2.1" },
  ],
});

async function callJson(url: string, body: unknown, token?: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  return response.json();
}

export async function POST(request: Request) {
  const input = (await request.json().catch(() => ({}))) as GenerateRequest;
  const topic = input.topic?.trim() || "轮胎基础知识与标准服务流程";
  const audience = input.audience?.trim() || "轮胎技师 / 服务顾问 / 新店店长";
  const llmUrl = process.env.CSS_LLM_API_URL;
  const ragUrl = process.env.CSS_RAG_API_URL;
  const token = process.env.CSS_API_TOKEN;

  if (!llmUrl || !ragUrl) {
    return Response.json({ mode: "mock", course: mockCourse(topic, audience) });
  }

  try {
    const evidence = await callJson(ragUrl, { query: topic, biz_line: "tire", knowledge_domain: "training", top_k: 8 }, token);
    const result = await callJson(llmUrl, {
      task: "training_course_generation",
      response_format: "json",
      topic,
      audience,
      evidence,
      requirements: { language: "zh-CN", format: "html_slides", require_citations: true, human_review: true },
    }, token);
    const course = (result as { course?: unknown }).course;
    if (!course) throw new Error("missing course");
    return Response.json({ mode: "live", course });
  } catch (error) {
    console.error("course generation upstream failure", error instanceof Error ? error.message : "unknown");
    return Response.json({ mode: "fallback", course: mockCourse(topic, audience) });
  }
}
