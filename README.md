<div align="right">

🌐 **English** · [中文](docs_cn/README.md)

</div>

<div align="center">

# 🔐 Crypto Visualizer · Enigma

### ✨ Turn the most famous cipher machine of WWII — right in your browser ✨

**A runnable, watchable, touchable Enigma — a piece of cryptographic history, brought back to life in code.**

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white&style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
  <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-ff69b4?style=flat-square" />
</p>

[🚀 Quick Start](#-30-second-setup) · [🧩 Project Layout](#-project-at-a-glance) · [📚 Docs](#-documentation) · [🤝 Contributing](#-contributing)

</div>

---

## 💡 What is this?

**Crypto Visualizer** is an **interactive cryptography playground**. We took the **Enigma machine** — the one that kept Bletchley Park's mathematicians awake at night — and put it inside your browser. No more black-box math: **every plug, every rotor, every electrical path** is something you can see, touch, and tweak.

> *"Encryption isn't magic — it's gears, wires, and a little bit of mechanical poetry."*

### 🎯 Why you'll love it

| | |
|---|---|
| 🎛️ **Faithful physical model** | Rotor stepping, the double-step anomaly, reflector symmetry, plugboard swaps — all the historical quirks |
| 👁️ **Fully visualised flow** | Watch the current travel through 8 layers of mapping on every keystroke |
| 🧪 **Clean modern stack** | React + TypeScript on the front · FastAPI + Pydantic on the back |
| 🧩 **Drag-to-wire plugboard** | Connect A ↔ Z by **dragging cables**, just like the real machine |
| 📖 **Code as a textbook** | Curious about cryptography? FastAPI? React? Three tutorials in one repo |

---

## 🎬 What it looks like

```
┌──────────────────────────────────────────────────────────────┐
│                  🔐  Enigma Visualizer                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   [ I  ]   [ II ]   [ III ]    ←  rotors (drag to rotate)    │
│     A         A         A                                    │
│                                                              │
│            ╔═══ Reflector B ═══╗                             │
│                                                              │
│     ┌─── Plugboard ───┐                                      │
│     │ A━━M  C━━Z  ... │      ← drag cables · WYSIWYG          │
│     └─────────────────┘                                      │
│                                                              │
│   [Q W E R T Y U I O P]      ← on-screen keyboard            │
│   ●·●·●·●·●·●·●·●·●·●        ← lampboard lights ciphertext   │
│                                                              │
│   in : HELLO                                                 │
│   out: MFNCZ                                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ 30-second setup

> 💡 You'll need Node.js 16+ and Python 3.13.

### 1️⃣ Start the backend

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

✅ The API runs at `http://localhost:8000`. Visit `/docs` for the auto-generated Swagger UI.

### 2️⃣ Start the frontend

```bash
cd apps/enigma-frontend
npm install
npm start
```

✅ Open `http://localhost:3000` and start your cryptographic journey.

### 3️⃣ (Optional) Try the plugboard prototype alone

```bash
cd prototypes/plugboard-drag-demo
npm install
npm start
```

---

## 🧭 Project at a glance

```text
crypto-visualizer-enigma/
│
├─ 🎨 apps/
│   └─ enigma-frontend/        React + TypeScript · main UI
│
├─ ⚙️ services/
│   └─ enigma-api/             FastAPI + Pydantic · encryption engine
│
├─ 🧪 prototypes/
│   └─ plugboard-drag-demo/    Drag-to-wire plugboard sandbox
│
├─ 📚 docs/                    Architecture · API · Development · Layout (English)
├─ 🀄 docs_cn/                 Chinese translations
└─ 📜 specs/                   Business-logic tests & change plans
```

---

## 📚 Documentation

| What do you want to do? | Go here |
|---|---|
| 🏗️ Understand the architecture and data flow | [docs/architecture.md](docs/architecture.md) |
| 🔌 Look up API fields and examples | [docs/api.md](docs/api.md) |
| 🛠️ Set up the dev environment locally | [docs/development.md](docs/development.md) |
| 🗂️ See how the directories are organised | [docs/directory-layout.md](docs/directory-layout.md) |
| 🎨 Frontend module guide | [docs/enigma-frontend.md](docs/enigma-frontend.md) |
| ⚙️ Backend service guide | [docs/enigma-api.md](docs/enigma-api.md) |
| 🧪 Plugboard drag prototype | [docs/plugboard-drag-demo.md](docs/plugboard-drag-demo.md) |

🌏 **Prefer Chinese?** Full documentation is available in [`docs_cn/`](docs_cn/README.md).

---

## 🧠 A bit of history

> Enigma was invented by German engineer Arthur Scherbius in 1918 and adopted at scale by the Nazi military during WWII.
> British mathematician **Alan Turing** and his team at **Bletchley Park** broke it — an effort widely credited with
> **shortening the war by 2–4 years**, and giving birth to the very idea of a programmable computer: the **Turing machine**.

Turning that machine into a visual playground is our small tribute to that era and the people who lived through it.

---

## 🤝 Contributing

Whether you're a **cryptography enthusiast**, a **frontend / backend developer**, or just someone with a curious mind:

- ⭐ **Star this repo** — help others discover it
- 🐛 **Open an Issue** — report bugs or pitch ideas
- 🔧 **Send a PR** — every improvement is welcome
- 💬 **Start a discussion** — any cryptography question is fair game

---

## 📜 License

[MIT](LICENSE) © Crypto Visualizer Contributors

<div align="center">

**If this project sparked even a little curiosity, please give it a ⭐**

*Made with ❤️ for everyone curious about how secrets travel.*

</div>
