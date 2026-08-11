"use client";

import { useMemo, useState } from "react";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  note: string;
  source: string;
};

type Course = {
  title: string;
  subtitle: string;
  audience: string;
  duration: string;
  objective: string;
  slides: Slide[];
};

const initialCourse: Course = {
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

const nav = ["工作台", "AI培训课件", "AI图像质检", "AI检测报价", "AI养护方案"];

export default function Home() {
  const [active, setActive] = useState("AI培训课件");
  const [course, setCourse] = useState(initialCourse);
  const [slideIndex, setSlideIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("当前为草稿 · 引用检查已通过");
  const [role, setRole] = useState("总部培训运营");
  const slide = course.slides[slideIndex] ?? course.slides[0];
  const completion = useMemo(() => Math.round(((slideIndex + 1) / course.slides.length) * 100), [slideIndex, course.slides.length]);

  async function generateCourse() {
    setGenerating(true);
    setNotice("正在调用智能客服大模型与RAG接口…");
    try {
      const response = await fetch("/api/course/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: course.title, audience: course.audience }),
      });
      if (!response.ok) throw new Error("generation failed");
      const data = (await response.json()) as { course: Course; mode: string };
      setCourse(data.course);
      setSlideIndex(0);
      setNotice(data.mode === "live" ? "生成完成 · 已调用智能客服API" : "生成完成 · 当前使用可演示Mock数据");
    } catch {
      setNotice("生成失败 · 已保留当前草稿，请检查接口配置");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">AI</span><div><b>运营工作台</b><small>门店智能生产力</small></div></div>
        <nav aria-label="主导航">
          {nav.map((item, index) => (
            <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => setActive(item)}>
              <span>{["⌂", "▤", "◫", "￥", "✦"][index]}</span>{item}
              {index > 1 && <em>规划中</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><span className="status-dot" />智能客服AI底座已连接<small>模型网关 · RAG · 审计</small></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p>AI运营 / 培训课件</p><h1>课件生产台</h1></div>
          <div className="top-actions"><select value={role} onChange={(e) => setRole(e.target.value)} aria-label="当前角色"><option>总部培训运营</option><option>区域运营</option><option>门店店长</option><option>门店技师</option></select><span className="avatar">何</span></div>
        </header>

        {active !== "AI培训课件" ? (
          <div className="empty-module"><span>即将开放</span><h2>{active}</h2><p>首期先完成AI培训课件的生产、审核与发布闭环。</p><button onClick={() => setActive("AI培训课件")}>返回培训课件</button></div>
        ) : (
          <>
            <section className="hero-row">
              <div><span className="pill">MVP试点课程</span><h2>{course.title}</h2><p>{course.objective}</p><div className="meta"><span>受众 · {course.audience}</span><span>时长 · {course.duration}</span><span>版本 · v0.1</span></div></div>
              <div className="hero-actions"><button className="secondary">保存草稿</button><button className="primary" disabled={generating} onClick={generateCourse}>{generating ? "生成中…" : "AI重新生成"}</button></div>
            </section>

            <div className="flowbar"><span className="done">1 课程配置</span><i /><span className="done">2 AI生成</span><i /><span className="current">3 内容编辑</span><i /><span>4 审核发布</span><div className="flow-notice">{notice}</div></div>

            <section className="editor-grid">
              <div className="outline-panel">
                <div className="panel-title"><div><small>课程结构</small><b>{course.slides.length} 个章节页面</b></div><button aria-label="添加页面">＋</button></div>
                <div className="outline-list">
                  {course.slides.map((item, index) => (
                    <button key={`${item.title}-${index}`} className={slideIndex === index ? "outline-card selected" : "outline-card"} onClick={() => setSlideIndex(index)}>
                      <span>{String(index + 1).padStart(2, "0")}</span><div><b>{item.title}</b><small>{item.eyebrow}</small></div>{slideIndex === index && <em>编辑中</em>}
                    </button>
                  ))}
                </div>
                <div className="outline-progress"><div><span>课件完整度</span><b>{completion}%</b></div><progress value={completion} max="100" /></div>
              </div>

              <div className="preview-panel">
                <div className="preview-toolbar"><span><b>HTML课件预览</b><small>16:9 · 实时渲染</small></span><div><button>桌面</button><button className="selected-tool">适应窗口</button></div></div>
                <article className="course-slide">
                  <div className="slide-accent" /><div className="slide-top"><span>{slide.eyebrow}</span><b>途虎门店标准服务培训</b></div>
                  <div className="slide-content"><div className="slide-copy"><h3>{slide.title}</h3><p>{slide.body}</p><ul>{slide.points.map((point) => <li key={point}><span>✓</span>{point}</li>)}</ul></div><div className="wheel-visual"><div className="wheel-ring"><span>STANDARD</span><b>{slideIndex + 1}</b><small>TIRES</small></div><div className="road-line" /></div></div>
                  <div className="slide-footer"><span>AI生成 · 人工审核后发布</span><span>{slideIndex + 1} / {course.slides.length}</span></div>
                </article>
                <div className="slide-nav"><button disabled={slideIndex === 0} onClick={() => setSlideIndex((v) => Math.max(0, v - 1))}>← 上一页</button><span>{course.slides.map((_, index) => <i key={index} className={index === slideIndex ? "active-dot" : ""} />)}</span><button disabled={slideIndex === course.slides.length - 1} onClick={() => setSlideIndex((v) => Math.min(course.slides.length - 1, v + 1))}>下一页 →</button></div>
              </div>

              <div className="inspector-panel">
                <div className="tabs"><button className="tab-active">内容</button><button>讲稿</button><button>引用</button></div>
                <label>页面标题<input value={slide.title} onChange={(e) => { const slides=[...course.slides]; slides[slideIndex]={...slide,title:e.target.value}; setCourse({...course,slides}); }} /></label>
                <label>核心说明<textarea value={slide.body} onChange={(e) => { const slides=[...course.slides]; slides[slideIndex]={...slide,body:e.target.value}; setCourse({...course,slides}); }} /></label>
                <div className="evidence-card"><span>✓</span><div><b>知识引用已关联</b><p>{slide.source}</p></div><button>查看</button></div>
                <div className="speaker-note"><small>讲师提示</small><p>{slide.note}</p></div>
                <button className="regenerate">✦ 仅重新生成当前页</button>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
