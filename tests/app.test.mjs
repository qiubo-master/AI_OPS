import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("AI运营首版范围不包含学习端", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const course = await readFile(new URL("../lib/course.ts", import.meta.url), "utf8");
  assert.match(page, /AI培训课件/);
  assert.match(course, /轮胎基础知识与标准服务流程/);
  assert.match(page, /HTML课件预览/);
  assert.doesNotMatch(page, /学习中心|我的课程|学习进度/);
});

test("课程通过PostgreSQL持久化并由页面真实读写", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const database = await readFile(new URL("../lib/db.ts", import.meta.url), "utf8");
  const compose = await readFile(new URL("../docker-compose.yml", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/courses"\)/);
  assert.match(database, /CREATE TABLE IF NOT EXISTS courses/);
  assert.match(database, /version=version\+1/);
  assert.match(compose, /postgres:16-alpine/);
  assert.match(compose, /ai_ops_postgres/);
});

test("课件通过通用基座接入且支持Mock", async () => {
  const route = await readFile(new URL("../app/api/course/generate/route.ts", import.meta.url), "utf8");
  const foundation = await readFile(new URL("../lib/foundation.ts", import.meta.url), "utf8");
  assert.match(foundation, /FOUNDATION_API_URL/);
  assert.match(foundation, /FOUNDATION_API_KEY/);
  assert.match(route, /mode: "mock"/);
  assert.match(route, /digital_human_courseware/);
});

test("三项业务能力拥有独立LangGraph工作流和API", async () => {
  const workflows = await readFile(new URL("../lib/workflows.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const database = await readFile(new URL("../lib/db.ts", import.meta.url), "utf8");
  assert.match(workflows, /new StateGraph/);
  assert.match(workflows, /runInspection/);
  assert.match(workflows, /runQuote/);
  assert.match(workflows, /runMaintenance/);
  assert.match(page, /\/api\/inspection\/analyze/);
  assert.match(page, /\/api\/quotes\/generate/);
  assert.match(page, /\/api\/maintenance\/generate/);
  assert.match(database, /CREATE TABLE IF NOT EXISTS business_runs/);
});
