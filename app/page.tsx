"use client";

import { useEffect, useMemo, useState } from "react";
import { Course, initialCourse } from "@/lib/course";
import type { InspectionResult, MaintenanceResult, QuoteResult } from "@/lib/business";

const nav = ["工作台", "AI培训课件", "AI图像质检", "AI检测报价", "AI养护方案"];

export default function Home() {
  const [active, setActive] = useState("AI培训课件");
  const [course, setCourse] = useState(initialCourse);
  const [slideIndex, setSlideIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("正在连接课程数据库…");
  const [role, setRole] = useState("总部培训运营");
  const slide = course.slides[slideIndex] ?? course.slides[0];
  const completion = useMemo(() => Math.round(((slideIndex + 1) / course.slides.length) * 100), [slideIndex, course.slides.length]);

  useEffect(() => {
    fetch("/api/courses")
      .then(async (response) => {
        if (!response.ok) throw new Error("load failed");
        return response.json() as Promise<{ courses: Course[] }>;
      })
      .then(({ courses }) => {
        if (courses[0]) setCourse(courses[0]);
        setNotice(courses[0] ? "数据库已加载 · 当前为持久化草稿" : "数据库已连接 · 等待创建课程");
      })
      .catch(() => setNotice("数据库连接失败 · 当前显示本地兜底内容"));
  }, []);

  async function saveDraft() {
    setSaving(true);
    setNotice("正在保存到PostgreSQL…");
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(course),
      });
      if (!response.ok) throw new Error("save failed");
      const data = (await response.json()) as { course: Course };
      setCourse(data.course);
      setNotice(`已保存到数据库 · 版本 v${data.course.version ?? 1}`);
    } catch {
      setNotice("保存失败 · 请检查数据库状态");
    } finally {
      setSaving(false);
    }
  }

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
      setNotice(data.mode === "live" ? "生成完成并已入库 · 已调用智能客服API" : "生成完成并已入库 · 当前使用Mock模型数据");
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
              {index > 0 && <em>已接入</em>}
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
          <BusinessModule active={active} />
        ) : (
          <>
            <section className="hero-row">
              <div><span className="pill">MVP试点课程</span><h2>{course.title}</h2><p>{course.objective}</p><div className="meta"><span>受众 · {course.audience}</span><span>时长 · {course.duration}</span><span>数据库版本 · v{course.version ?? 1}</span></div></div>
              <div className="hero-actions"><button className="secondary" disabled={saving} onClick={saveDraft}>{saving ? "保存中…" : "保存草稿"}</button><button className="primary" disabled={generating} onClick={generateCourse}>{generating ? "生成中…" : "AI重新生成"}</button></div>
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

function BusinessModule({ active }: { active: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("等待提交任务");
  const [imageId, setImageId] = useState("img_demo_tire_001");
  const [vehicle, setVehicle] = useState("2021款 大众朗逸 1.4T");
  const [findings, setFindings] = useState("右前轮异常磨损，制动时轻微抖动");
  const [mileage, setMileage] = useState("60000");
  const [result, setResult] = useState<InspectionResult | QuoteResult | MaintenanceResult | null>(null);

  if (active === "工作台") {
    return <section className="module-board"><span className="pill">AI能力总览</span><h2>四个业务模块已接入统一大模型基座</h2><div className="capability-grid">{["数字人培训课件", "AI图像质检", "AI检测报价", "AI养护方案"].map((item) => <article key={item}><b>{item}</b><p>阿里云LangGraph编排 · AutoDL Foundation API · PostgreSQL审计</p><span>可用</span></article>)}</div></section>;
  }

  const configs = {
    "AI图像质检": { title: "门店与车辆图像智能检测", desc: "调用YOLO、OCR、Qwen-VL完整视觉分析，再由巡检工作流完成规则校验与人工复核分流。", action: "开始视觉检测" },
    "AI检测报价": { title: "检测结果与维修报价生成", desc: "融合视觉结果、维修知识和业务规则，生成可解释的项目与预估报价。", action: "生成检测报价" },
    "AI养护方案": { title: "个性化养护方案", desc: "根据车型、里程和车况检索养护知识，由文本基座生成分级养护建议。", action: "生成养护方案" },
  } as const;
  const config = configs[active as keyof typeof configs];
  if (!config) return null;

  async function submit() {
    setBusy(true); setNotice("LangGraph工作流执行中…"); setResult(null);
    const endpoint = active === "AI图像质检" ? "/api/inspection/analyze" : active === "AI检测报价" ? "/api/quotes/generate" : "/api/maintenance/generate";
    const body = active === "AI图像质检" ? { imageId, scene: "tire_inspection" } : active === "AI检测报价" ? { imageId, vehicle, findings } : { vehicle, mileage: Number(mileage), usage: "城市通勤" };
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json() as { run?: { result: InspectionResult | QuoteResult | MaintenanceResult; mode: string; traceId: string }; message?: string };
      if (!response.ok || !payload.run) throw new Error(payload.message || "执行失败");
      setResult(payload.run.result); setNotice(`${payload.run.mode === "live" ? "通用基座" : "Mock基座"}执行完成 · Trace ${payload.run.traceId.slice(0, 12)}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "执行失败"); }
    finally { setBusy(false); }
  }

  return <section className="business-module">
    <div className="module-head"><span className="pill">Foundation API · LangGraph</span><h2>{config.title}</h2><p>{config.desc}</p></div>
    <div className="business-grid"><div className="task-form">
      {(active === "AI图像质检" || active === "AI检测报价") && <label>基座图片ID<input value={imageId} onChange={(e) => setImageId(e.target.value)} /><small>图片先上传到AutoDL通用基座，业务端只传image_id。</small></label>}
      {(active === "AI检测报价" || active === "AI养护方案") && <label>车辆信息<input value={vehicle} onChange={(e) => setVehicle(e.target.value)} /></label>}
      {active === "AI检测报价" && <label>检测发现<textarea value={findings} onChange={(e) => setFindings(e.target.value)} /></label>}
      {active === "AI养护方案" && <label>当前里程<input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} /></label>}
      <button className="primary module-submit" disabled={busy} onClick={submit}>{busy ? "执行中…" : config.action}</button><p className="module-notice">{notice}</p>
    </div><div className="result-panel">{result ? <ResultView result={result} /> : <div className="result-empty"><b>运行结果</b><p>提交任务后，这里展示结构化结论、依据、报价或养护项目。每次调用都会写入数据库。</p></div>}</div></div>
  </section>;
}

function ResultView({ result }: { result: InspectionResult | QuoteResult | MaintenanceResult }) {
  if ("findings" in result) return <><span className={`risk ${result.riskLevel}`}>{result.riskLevel.toUpperCase()}</span><h3>{result.summary}</h3>{result.findings.map((item) => <article className="result-item" key={item.code}><b>{item.name} · {Math.round(item.confidence * 100)}%</b><p>{item.action}</p></article>)}<small>需要人工复核：{result.requiresReview ? "是" : "否"}</small></>;
  if ("total" in result) return <><h3>{result.diagnosis}</h3>{result.items.map((item) => <article className="result-item" key={item.name}><b>{item.name}</b><p>{item.reason}</p><span>¥{item.unitPrice * item.quantity + item.laborPrice}</span></article>)}<div className="result-total">预估合计 <b>¥{result.total}</b></div><small>{result.disclaimer}</small></>;
  return <><h3>{result.strategy}</h3>{result.items.map((item) => <article className="result-item" key={item.name}><b>{item.priority} · {item.name}</b><p>{item.reason}</p><span>{item.cycle}</span></article>)}<div className="result-total">下次建议 <b>{result.nextVisit}</b></div></>;
}
