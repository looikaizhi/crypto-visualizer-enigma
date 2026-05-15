<div align="right">

🌐 **English** · [中文](../docs_cn/directory-layout.md)

</div>

# 🗂️ Directory layout

> A map that lets contributors know **where things live without asking**.

---

## 📦 Current layout

```text
crypto-visualizer-enigma/
│
├─ 🎨 apps/
│   └─ enigma-frontend/        Main frontend · React + TypeScript
│
├─ ⚙️ services/
│   └─ enigma-api/             Backend API · FastAPI + Pydantic
│
├─ 🧪 prototypes/
│   └─ plugboard-drag-demo/    Experimental sandbox · plugboard drag UX
│
├─ 📚 docs/                    Architecture / API / Development / Layout (English)
├─ 🀄 docs_cn/                 Chinese translations
├─ 📜 specs/                   Business-logic tests & change plans (internal)
├─ 📄 LICENSE
└─ 📖 README.md
```

---

## 📐 Rules

| Directory | What goes in | Why |
|---|---|---|
| 🎨 `apps/` | **Production** frontends / desktop / mobile apps | User-facing, product-grade code that needs long-term maintenance |
| ⚙️ `services/` | Backend APIs, workers, other long-lived services | Mirrors `apps/`, independently deployable |
| 🧪 `prototypes/` | Experiments, validations, demos | Free space to explore without polluting the product |
| 📚 `docs/` · 🀄 `docs_cn/` | Project-level documentation (EN / 中文) | One-stop entry for readers |
| 📜 `specs/` | Test plans, change plans, results | For developers to review and hand off |

---

## 🚫 Not part of the source layout

To keep the tree clean, these are **not** considered part of source organisation:

- 🗃️ Dependency dirs (`node_modules/`, `.venv/`)
- 🛠️ Build artefacts (`build/`, `dist/`)
- 💾 Caches (`.pytest_cache/`, `.playwright/`)
- 🔧 IDE / tool config (`.vscode/`, `.idea/`)

They are excluded via `.gitignore`.

---

## ➕ Where do I put a new module?

| What you're doing | Goes into |
|---|---|
| Adding a new UI feature to the Enigma app | `apps/enigma-frontend/` |
| Adding a new backend service (e.g. a new cipher) | `services/<new-service-name>/` |
| Validating an interaction, animation, or idea | `prototypes/<your-demo>/` |
| Writing a design note / tutorial | `docs/` (English) and/or `docs_cn/` (中文) |

---

🔙 Back to [project home](../README.md) · 🏗️ See [architecture](architecture.md)
