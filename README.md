# AI 运营工作台

面向运营、门店店长和技师的 AI 课件生产工具。首期聚焦“轮胎基础知识与标准服务流程”，复用既有智能客服大模型 API 与 RAG API，提供课件生成、编辑和 16:9 HTML 预览，不包含学习中心或轻量学习功能。

## 本地运行

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

未配置智能客服接口时，系统自动使用内置演示数据，便于界面联调。配置方式见 `.env.example`。

## 质量检查

```bash
pnpm lint
pnpm test
pnpm build
```

## Linux 容器运行

```bash
docker compose up -d --build
curl http://127.0.0.1:3000/api/health
```

默认资源建议为 2 核 CPU、2 GB 内存。大模型和 RAG 均作为外部服务调用，本项目容器不部署或训练模型。

## 发布边界

- `.github/workflows/ci.yml` 在推送和 PR 时仅执行代码校验。
- `.github/workflows/deploy.yml` 仅支持手动触发，供现有 CICD 中台调用。
- 推送代码不会自动发布到云服务器。

## 文档

- `docs/01-需求分析.md`
- `docs/02-项目立项书.md`
- `docs/03-Gate0评审材料.md`
- `docs/04-AI运营工作台-PRD.md`
- `docs/05-AI运营工作台-架构设计.md`
