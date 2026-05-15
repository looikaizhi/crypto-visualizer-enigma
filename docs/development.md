<div align="right">

🌐 **English** · [中文](../docs_cn/development.md)

</div>

# 🛠️ Development guide

> Two terminals is all you need to get the whole thing running. Here's how.

---

## ✅ Prerequisites

| Tool | Version |
|---|---|
| 🐍 Python | **3.13** |
| 🟢 Node.js | 16+ (LTS recommended) |
| 📦 npm | Bundled with Node |
| 🪟 / 🐧 / 🍎 | Windows / Linux / macOS |

---

## ⚙️ Backend

Dependencies are pinned for Python 3.13.

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

Once running:

| Resource | URL |
|---|---|
| 🌐 Service root | `http://localhost:8000` |
| 📘 Swagger UI | `http://localhost:8000/docs` |
| 📕 ReDoc | `http://localhost:8000/redoc` |

> 💡 `--reload` restarts the server when you change Python code — debugging stays smooth.

---

## 🎨 Frontend

```bash
cd apps/enigma-frontend
npm install
npm start
```

Default URL:

```
http://localhost:3000
```

The frontend talks to `http://localhost:8000` by default, so make sure both are running.

---

## 🧪 Plugboard prototype (optional)

```bash
cd prototypes/plugboard-drag-demo
npm install
npm start
```

This directory exists to validate the **drag-to-wire** interaction. It **does not** talk to the backend; you can launch it standalone to iterate on UX.

---

## 🧯 Troubleshooting

<details>
<summary><b>Backend fails with "ModuleNotFoundError"</b></summary>

Make sure the virtualenv is activated, then run `pip install -r requirements.txt` again.
</details>

<details>
<summary><b>Frontend opens but encryption doesn't respond</b></summary>

Usually the backend isn't running. Check that `http://localhost:8000/docs` opens. If port 8000 is busy, run the API on another port:
`python -m uvicorn app.main:app --reload --port 8001`, and update the API base URL in the frontend accordingly.
</details>

<details>
<summary><b>Can I use a Python version other than 3.13?</b></summary>

Dependencies are validated on 3.13. 3.10+ usually works but isn't guaranteed. Use `pyenv` or `conda` to switch.
</details>

---

## 🔗 Next steps

- 🏗️ How modules talk to each other → [architecture.md](architecture.md)
- 🔌 Calling the API directly → [api.md](api.md)
- 🗂️ Where should I put new files? → [directory-layout.md](directory-layout.md)
