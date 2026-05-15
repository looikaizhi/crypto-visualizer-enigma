<div align="right">

[English](../docs/directory-layout.md) · 🌐 **中文**

</div>

# 🗂️ 目录结构

> 一份让贡献者**不用问就知道东西放哪**的地图。

---

## 📦 当前布局

```text
crypto-visualizer-enigma/
│
├─ 🎨 apps/
│   └─ enigma-frontend/        正式前端 · React + TypeScript
│
├─ ⚙️ services/
│   └─ enigma-api/             后端 API · FastAPI + Pydantic
│
├─ 🧪 prototypes/
│   └─ plugboard-drag-demo/    实验沙盒 · 插线板拖拽
│
├─ 📚 docs/                    架构 / API / 开发 / 目录文档（英文）
├─ 🀄 docs_cn/                 中文翻译
├─ 📜 specs/                   业务逻辑测试与改造记录（内部）
├─ 📄 LICENSE
└─ 📖 README.md
```

---

## 📐 规则

| 目录 | 放什么 | 为什么 |
|---|---|---|
| 🎨 `apps/` | **正式**前端 / 桌面 / 移动应用 | 用户直接使用、需要长期维护的产品级代码 |
| ⚙️ `services/` | 后端 API、Worker、其他长生命周期服务 | 与"应用"对应，可独立部署 |
| 🧪 `prototypes/` | 实验、验证、演示用的小项目 | 想自由发挥而不污染正式产品 |
| 📚 `docs/` · 🀄 `docs_cn/` | 项目级说明文档（英 / 中） | 给读者一站式入口 |
| 📜 `specs/` | 测试计划、改造方案、结果记录 | 给开发者复盘和接手 |

---

## 🚫 不属于源码结构的

为了让目录树清爽，这些**不算**源码组织的一部分：

- 🗃️ 依赖目录（`node_modules/`、`.venv/`）
- 🛠️ 构建产物（`build/`、`dist/`）
- 💾 缓存（`.pytest_cache/`、`.playwright/`）
- 🔧 IDE / 工具配置（`.vscode/`、`.idea/`）

它们会被 `.gitignore` 屏蔽。

---

## ➕ 新增模块怎么放？

| 你在做的事 | 放进哪里 |
|---|---|
| 给完整 Enigma 加一个新 UI 功能 | `apps/enigma-frontend/` |
| 加一个新加密算法的后端服务 | `services/<new-service-name>/` |
| 想验证某个交互、动画、想法 | `prototypes/<your-demo>/` |
| 写设计文档 / 教程 | `docs/`（英文）和/或 `docs_cn/`（中文） |

---

🔙 回 [项目首页](README.md) · 🏗️ 看 [架构](architecture.md)
