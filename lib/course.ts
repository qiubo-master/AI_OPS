export type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  note: string;
  source: string;
};

export type Course = {
  id?: string;
  title: string;
  subtitle: string;
  audience: string;
  duration: string;
  objective: string;
  slides: Slide[];
  status?: "draft" | "review" | "published";
  version?: number;
  updatedAt?: string;
};

export const initialCourse: Course = {
  title: "轮胎基础知识与标准服务流程",
  subtitle: "门店技师标准化培训 · 试点课程",
  audience: "轮胎技师 / 服务顾问 / 新店店长",
  duration: "约 24 分钟",
  objective: "掌握轮胎标识、基础检查与门店标准接待交付流程",
  slides: [
    {
      eyebrow: "01 · 课程导入",
      title: "为什么轮胎服务必须标准化",
      body: "轮胎连接车辆与路面。专业服务不止是完成安装，更要把安全检查、适配确认与交付说明做到一致。",
      points: ["降低错配与返工风险", "统一技师与服务顾问沟通口径", "让车主理解每一步服务依据"],
      note: "开场先强调安全与专业价值，不承诺具体事故概率。",
      source: "培训知识库 · 轮胎服务SOP v3.2",
    },
    {
      eyebrow: "02 · 基础知识",
      title: "读懂 225/55 R17 97W",
      body: "一组标识同时描述断面宽度、扁平比、结构、轮辋直径、负荷指数与速度级别。",
      points: ["225：断面宽度（mm）", "55：扁平比", "R17：子午线结构与17英寸轮辋", "97W：负荷与速度级别"],
      note: "提醒学员：实际适配必须核对车型、年款、前后轴和原厂规格。",
      source: "培训知识库 · 轮胎规格识别指南 v2.7",
    },
    {
      eyebrow: "03 · 标准流程",
      title: "接车检查：先确认，再施工",
      body: "围绕车辆、轮胎、订单和客户诉求完成四项确认，并记录可追溯结果。",
      points: ["车辆与订单信息核对", "胎压、磨损、损伤与生产日期检查", "前后轴规格及安装方向确认", "异常项拍照并与客户确认"],
      note: "鼓包、露帘线、严重失压等情况按安全规则升级处理。",
      source: "培训知识库 · 门店轮胎接车检查清单 v4.1",
    },
  ],
};
