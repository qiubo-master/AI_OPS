# AI 运营工作台

面向运营、门店店长和技师的AI运营工作台，包含数字人培训课件、AI图像质检、AI检测报价和AI养护方案。业务界面、LangGraph编排、规则、RAG命名空间和运行审计部署在阿里云AI运营服务；YOLO、OCR、Qwen-VL、文本模型和Embedding统一调用AutoDL大模型通用基座。

## 本地运行

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

未配置AutoDL通用基座时，系统自动使用确定性Mock结果，便于界面和数据库联调。配置方式见 `.env.example`。

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

默认资源建议为2核CPU、2GB内存。本项目不部署或训练大模型，通过`/foundation/v1`调用AutoDL通用基座。

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
- `docs/06-AI视觉能力与门店巡检-立项需求.md`
- `docs/07-AI视觉能力与门店巡检-产品PRD.md`
- `docs/08-AI视觉能力与门店巡检-架构设计.md`
- `docs/09-AI检测报价-立项需求.md`
- `docs/10-AI检测报价-产品PRD.md`
- `docs/11-AI检测报价-架构设计.md`
- `docs/12-AI养护方案-立项需求.md`
- `docs/13-AI养护方案-产品PRD.md`
- `docs/14-AI养护方案-架构设计.md`
- `docs/15-AI运营统一基座接入与业务编排架构.md`
