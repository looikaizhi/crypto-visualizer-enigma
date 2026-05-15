<div align="right">

[English](../services/enigma-api/README.md) · 🌐 **中文**

</div>

<div align="center">

# ⚙️ Enigma API

### 一台用 Python 跑起来的 Enigma 机器，藏在一个 FastAPI 服务里

<p>
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white&style=flat-square" />
  <img alt="Pydantic" src="https://img.shields.io/badge/Pydantic-2-E92063?logo=pydantic&logoColor=white&style=flat-square" />
  <img alt="Uvicorn" src="https://img.shields.io/badge/Uvicorn-499848?logo=gunicorn&logoColor=white&style=flat-square" />
</p>

</div>

---

## ✨ 它做什么？

一个**纯净、类型严谨、自带 Swagger 文档**的后端服务，负责：

- 🎛️ 提供可选的**转子**与**反射器** wiring 配置
- 🔐 接收前端的按键请求，**单字符**完成完整 Enigma 加密
- 🧭 返回密文、转子位置以及电流穿过每一层的**完整路径**

---

## 🚀 启动

<details open>
<summary><b>Windows PowerShell</b></summary>

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
</details>

<details>
<summary><b>Linux / macOS</b></summary>

```bash
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
</details>

服务地址：`http://localhost:8000`
交互式 API 文档：`http://localhost:8000/docs` 📘

---

## 🔌 端点速查

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/rotors` | 拿到所有可选转子 wiring |
| `GET` | `/reflectors` | 拿到所有可选反射器 wiring |
| `POST` | `/encrypt` | 单字符加密 |

完整字段与示例 → [api.md](api.md)

---

## 🧩 目录速览

```text
app/
├─ 🚪 main.py                FastAPI 应用入口
├─ 🛣️  routes/enigma.py       Enigma API 路由
├─ 🔢 core/constants.py      转子与反射器常量
├─ ⚙️ core/machine.py        Enigma 核心模型（齿轮在这里转）
└─ 📦 models/schemas.py      请求与响应模型（Pydantic）
```

| 文件 | 职责 |
|---|---|
| `app/main.py` | 应用入口、中间件、路由挂载 |
| `app/routes/enigma.py` | HTTP 路由层 |
| `app/core/machine.py` | Enigma 物理模型：转子步进、反射、插线板 |
| `app/core/constants.py` | 历史上真实的 wiring 表（I、II、III、B、C 等） |
| `app/models/schemas.py` | API 请求/响应数据契约 |

---

## 🧪 测试

```bash
pytest
```

---

## 🔗 相关文档

- 🏗️ [整体架构](architecture.md)
- 🔌 [API 字段说明](api.md)
- 🛠️ [开发指南](development.md)
