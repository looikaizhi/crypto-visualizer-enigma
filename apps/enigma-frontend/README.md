<div align="right">

🌐 **English** · [中文](../../docs_cn/enigma-frontend.md)

</div>

<div align="center">

# 🎨 Enigma Frontend

### A 1918 cipher machine, drawn into a 2025 browser.

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" />
  <img alt="CRA" src="https://img.shields.io/badge/Create_React_App-09D3AC?logo=createreactapp&logoColor=white&style=flat-square" />
</p>

</div>

---

## ✨ What is this?

The **main UI** of the Enigma Visualizer — a React + TypeScript interactive surface that lets you:

- 🎛️ Rotate rotors, switch reflectors
- 🔌 **Drag cables** on the plugboard
- ⌨️ Press the on-screen keyboard and watch the lampboard light up
- 🔍 Trace every current path through Enigma's internals

---

## 🚀 Get started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) and start typing.

> 💡 By default it talks to the backend at:
> ```
> http://localhost:8000
> ```
> Start [enigma-api](../../services/enigma-api/) first.

---

## 🧩 Directory tour

```text
src/
├─ 🧱 components/        Rotor · Reflector · Plugboard · Keyboard · Lampboard
├─ 🛰️  services/api.ts   Backend API client
└─ 🚪 App.tsx            Application root
```

| Path | Responsibility |
|---|---|
| [src/components](src/components) | Visual parts (Rotor / Reflector / Plugboard / Keyboard / Lampboard) |
| [src/services/api.ts](src/services/api.ts) | Calls `/rotors`, `/reflectors`, `/encrypt` |
| [src/App.tsx](src/App.tsx) | Top-level composition & state |

---

## 🛠️ Common scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server on port 3000 |
| `npm run build` | Production build into `build/` |
| `npm test` | Run unit tests |

---

## 🔗 Related docs

- 🏗️ [Architecture](../../docs/architecture.md)
- 🔌 [API reference](../../docs/api.md)
- 🛠️ [Development guide](../../docs/development.md)
