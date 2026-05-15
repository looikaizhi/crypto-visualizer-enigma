<div align="right">

[English](../docs/development.md) · 🌐 **中文**

</div>

# 🛠️ 开发指南

> 把整个项目跑起来，只需要两个终端窗口。下面就是分步说明。

---

## ✅ 前置条件

| 工具 | 版本 |
|---|---|
| 🐍 Python | **3.13** |
| 🟢 Node.js | 16+（推荐 LTS） |
| 📦 npm | 跟随 Node |
| 🪟 / 🐧 / 🍎 | Windows / Linux / macOS 均可 |

---

## ⚙️ 后端

依赖已升级到 Python 3.13 兼容版本。

### 🪟 Windows PowerShell

```powershell
cd services\enigma-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### 🐧 Linux / 🍎 macOS

```bash
cd services/enigma-api
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

启动成功后：

| 资源 | 地址 |
|---|---|
| 🌐 服务根地址 | `http://localhost:8000` |
| 📘 Swagger UI | `http://localhost:8000/docs` |
| 📕 ReDoc | `http://localhost:8000/redoc` |

> 💡 `--reload` 在你修改 Python 代码后会自动重启，调试很顺。

---

## 🎨 前端

```bash
cd apps/enigma-frontend
npm install
npm start
```

默认访问：

```
http://localhost:3000
```

前端默认请求后端 `http://localhost:8000`，确保两者同时在跑。

---

## 🧪 插线板原型（可选）

```bash
cd prototypes/plugboard-drag-demo
npm install
npm start
```

该目录用于验证**拖拽连线交互**，**不连接后端**，可以单独打开调试 UX。

---

## 🧯 常见问题

<details>
<summary><b>启动后端报 "ModuleNotFoundError"</b></summary>

请确认你已经激活了虚拟环境，并且执行过 `pip install -r requirements.txt`。
</details>

<details>
<summary><b>前端能打开但加密没反应</b></summary>

通常是后端没启动。检查 `http://localhost:8000/docs` 能否打开。如果端口被占用，可改用 `python -m uvicorn app.main:app --reload --port 8001`，并同步修改前端的 API 地址。
</details>

<details>
<summary><b>Python 版本不是 3.13 也行吗？</b></summary>

依赖针对 3.13 验证过；3.10+ 通常可工作但不保证。建议使用 `pyenv` 或 `conda` 切换到 3.13。
</details>

---

## 🔗 下一步

- 🏗️ 想了解模块之间怎么对话？看 [architecture.md](architecture.md)
- 🔌 想直接调接口？看 [api.md](api.md)
- 🗂️ 想知道文件该放哪里？看 [directory-layout.md](directory-layout.md)
