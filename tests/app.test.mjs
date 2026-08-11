import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("AI运营首版范围不包含学习端", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /AI培训课件/);
  assert.match(page, /轮胎基础知识与标准服务流程/);
  assert.match(page, /HTML课件预览/);
  assert.doesNotMatch(page, /学习中心|我的课程|学习进度/);
});

test("模型和RAG通过环境变量接入且支持Mock", async () => {
  const route = await readFile(new URL("../app/api/course/generate/route.ts", import.meta.url), "utf8");
  assert.match(route, /CSS_LLM_API_URL/);
  assert.match(route, /CSS_RAG_API_URL/);
  assert.match(route, /mode: "mock"/);
  assert.match(route, /knowledge_domain: "training"/);
});
