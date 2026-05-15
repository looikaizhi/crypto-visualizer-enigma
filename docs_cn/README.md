<div align="right">

[English](../README.md) · 🌐 **中文**

</div>

<div align="center">

# 🔐 Crypto Visualizer · Enigma

### ✨ 在浏览器里，亲手转动二战最神秘的密码机 ✨

**一台跑得起来、看得见、摸得着的 Enigma —— 用代码复刻一段改变历史的密码学传奇**

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white&style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
  <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-ff69b4?style=flat-square" />
</p>

[🚀 快速启动](#-30-秒上手) · [🧩 项目结构](#-项目全貌) · [📚 文档](#-文档导航) · [🤝 参与贡献](#-参与贡献)

</div>

---

## 💡 这是什么？

**Crypto Visualizer** 是一个 **交互式密码学可视化** 项目。我们把那台曾让英国 Bletchley Park 数学家彻夜难眠的 **Enigma 密码机** 搬进了浏览器 —— 不再是黑盒公式，而是**每一根插线、每一个转子、每一束电流路径**都看得见、点得到、改得了。

> *"加密不是魔法，是齿轮、电流和一点点机械的浪漫。"*

### 🎯 为什么你会喜欢它？

| | |
|---|---|
| 🎛️ **真实物理模型** | 转子步进、双步异常、反射器对称、插线板交换 —— 历史细节，逐一还原 |
| 👁️ **过程全可视** | 每一次按键，电流如何穿过 8 层映射，**一目了然** |
| 🧪 **前后端分离** | React + TypeScript 前端 · FastAPI + Pydantic 后端，干净的现代架构 |
| 🧩 **拖拽式交互** | 插线板像真机一样**鼠标拖线**连接 A↔Z，谁还看代码改配置 |
| 📖 **代码即教材** | 想懂 Enigma？想学 FastAPI？想练 React？三合一开源教程 |

---

## 🎬 它长这样

```
┌──────────────────────────────────────────────────────────────┐
│                  🔐  Enigma Visualizer                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   [ I  ]   [ II ]   [ III ]    ←  转子（可拖动旋转）          │
│     A         A         A                                    │
│                                                              │
│            ╔═══ Reflector B ═══╗                             │
│                                                              │
│     ┌─── Plugboard ───┐                                      │
│     │ A━━M  C━━Z  ... │      ← 拖拽连线，所见即所得           │
│     └─────────────────┘                                      │
│                                                              │
│   [Q W E R T Y U I O P]      ← 屏幕键盘                       │
│   ●·●·●·●·●·●·●·●·●·●        ← 灯板亮起密文字母              │
│                                                              │
│   in : HELLO                                                 │
│   out: MFNCZ                                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ 30 秒上手

> 💡 需要 Node.js 16+ 与 Python 3.13。

### 1️⃣ 启动后端

<details open>
<summary><b>Windows PowerShell</b></summary>

```powershell
cd services\enigma-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
</details>

<details>
<summary><b>Linux / macOS</b></summary>

```bash
cd services/enigma-api
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
</details>

✅ 后端默认运行在 `http://localhost:8000`，访问 `/docs` 即可看到自动生成的 Swagger UI。

### 2️⃣ 启动前端

```bash
cd apps/enigma-frontend
npm install
npm start
```

✅ 浏览器打开 `http://localhost:3000`，开始你的密码之旅。

### 3️⃣ （可选）单独玩插线板拖拽原型

```bash
cd prototypes/plugboard-drag-demo
npm install
npm start
```

---

## 🧭 项目全貌

```text
crypto-visualizer-enigma/
│
├─ 🎨 apps/
│   └─ enigma-frontend/        React + TypeScript · 主前端 UI
│
├─ ⚙️ services/
│   └─ enigma-api/             FastAPI + Pydantic · 加密引擎
│
├─ 🧪 prototypes/
│   └─ plugboard-drag-demo/    插线板拖拽交互原型
│
├─ 📚 docs/                    架构 · API · 开发 · 目录说明（英文）
├─ 🀄 docs_cn/                 中文文档（你正在这里）
└─ 📜 specs/                   业务逻辑测试与改造记录
```

---

## 📚 文档导航

| 想做什么？ | 看这里 |
|---|---|
| 🏗️ 了解整体架构和数据流 | [architecture.md](architecture.md) |
| 🔌 查询接口字段和示例 | [api.md](api.md) |
| 🛠️ 在本地搭好开发环境 | [development.md](development.md) |
| 🗂️ 看懂目录组织规则 | [directory-layout.md](directory-layout.md) |
| 🎨 前端模块说明 | [enigma-frontend.md](enigma-frontend.md) |
| ⚙️ 后端服务说明 | [enigma-api.md](enigma-api.md) |
| 🧪 插线板原型 | [plugboard-drag-demo.md](plugboard-drag-demo.md) |

🌍 **想看英文版？** 完整英文文档见仓库根目录的 [`README.md`](../README.md) 和 [`docs/`](../docs/)。

---

## 🧠 一点历史小料

> Enigma 由德国工程师 Arthur Scherbius 于 1918 年发明，二战期间被纳粹德国军方大规模使用。
> 英国数学家 **Alan Turing** 和 Bletchley Park 团队破译 Enigma，被估计**让二战提前 2~4 年结束**，
> 也直接催生了现代计算机科学的雏形 —— **图灵机**。

把它做成可视化工具，是我们对那段历史与那群人最朴素的致敬。

---

## 🤝 参与贡献

无论你是 **密码学爱好者**、**前端/后端开发者**，还是只是好奇心旺盛的学生：

- ⭐ **Star 一下** —— 让更多人看到这个项目
- 🐛 **提 Issue** —— 报告 bug 或提出新点子
- 🔧 **发 PR** —— 我们欢迎一切优化与扩展
- 💬 **聊一聊** —— 你对密码学的任何问题都欢迎来 Discussion 里抛出来

---

## 📜 License

[MIT](../LICENSE) © Crypto Visualizer Contributors

<div align="center">

**如果这个项目让你对密码学多了一分兴趣，请给我们一个 ⭐**

*Made with ❤️ for everyone curious about how secrets travel.*

</div>
