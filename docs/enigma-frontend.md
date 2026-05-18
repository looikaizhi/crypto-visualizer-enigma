<div align="right">

🌐 **English** · [中文](../docs_cn/enigma-frontend.md)

</div>

<div align="center">

# 🎨 Enigma Frontend

### A 1918 cipher machine, drawn into a 2025 browser — in brass and walnut.

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript&logoColor=white&style=flat-square" />
  <img alt="CRA" src="https://img.shields.io/badge/Create_React_App-09D3AC?logo=createreactapp&logoColor=white&style=flat-square" />
  <img alt="Single Viewport" src="https://img.shields.io/badge/Single--Viewport-Bento_Layout-d4a45c?style=flat-square" />
</p>

<img src="../pics/qa-layout-en.png" alt="Single-viewport bento layout" width="780" />

<sub><em>The whole machine on one screen. No scrolling, no hidden panels.</em></sub>

</div>

---

## ✨ What is this?

The **main UI** of the Enigma Visualizer — a React + TypeScript surface where you can:

- 🎛️ Pick rotor models, scroll positions with ▲ / ▼, switch reflectors
- 🔌 Wire plugboard cables on a single 26-socket strip
- ⌨️ Tap the QWERTZ keyboard or use your physical one — the lampboard answers
- ⚡ **Watch the electron travel** through five contact columns: brass forward, copper-cool back
- 🔍 Hover any of the 26 × 5 contacts for a plain-English mapping
- ⏯️ Replay the trace, single-step it, or slow it down
- 🌐 Switch the whole interface between **English** and **中文** from the topbar

---

## 🗺️ Layout — the bento grid

The desktop layout (`≥ 760 px`) is a **fixed three-row, three-column grid** that fills the viewport exactly:

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOPBAR (56px)   ENIGMA · Sound · Manual · Load Key · Reset · EN|中    │
├────────────┬─────────────────────────────────────┬───────────────────┤
│ CONFIG     │            MACHINE CORE             │   LAMP BOARD      │
│ RAIL       │     (5 contact columns + static     │   + OUTPUT TAPE   │
│ 240–288px  │      wires + live current path      ├───────────────────┤
│            │      + step timeline)               │   KEYBOARD        │
│            │                                     │   + INPUT  TAPE   │
├────────────┴─────────────────────────────────────┴───────────────────┤
│ PLUGBOARD STRIP — 26 sockets in one row, cables arc above            │
└──────────────────────────────────────────────────────────────────────┘
```

> 📱 Narrow screens (`< 760 px`) fall back to a vertical stack with the legacy 11-node SignalPath.

---

## 🎛️ Anatomy

### 🪵 The Machine Core — five contact columns

<p align="center">
  <img src="../pics/qa-core-idle-en.png" alt="Machine core at rest" width="640" />
</p>

The heart of the redesign. Each column draws **all 26 contacts** and **all 26 internal wires** for one stage of the Enigma signal chain:

| Column | What it shows |
|---|---|
| **PB** · Plugboard | The 26-letter swap table; plugged pairs render in their cable colour |
| **R3 / R2 / R1** · Rotors | The current model's wiring, rotated by `position`, offset by `ringSetting` |
| **UKW** · Reflector | 13 dual pairs drawn as bezier arcs (`A↔E`, `B↔J`, …) |

Above each rotor column: model dropdown, position ▲▼, and a **concentric ring chip** showing letter-ring vs contact-ring at a glance.

### ⚡ Live current path

<p align="center">
  <img src="../pics/qa-core-flow-full-en.png" alt="A keystroke traced through every column" width="640" />
</p>

Press a key and you see the **actual ten-hop path** through the machine, not an abstract node list:

- 🟡 **Forward** (brass, `→` arrowhead): `KEY → PB → R3 → R2 → R1 → UKW`
- 🔵 **Backward** (copper-cool, `←` arrowhead): `UKW → R1 → R2 → R3 → PB → LAMP`

Direction is encoded **twice** (colour + arrowhead) so it stays readable in any palette. A 11-dot timeline at the bottom lets you scrub, replay, or single-step.

### 🔌 Plugboard strip

<p align="center">
  <img src="../pics/qa-plug-en.png" alt="Single-row plugboard strip" width="720" />
</p>

The classic three-row plugboard has been compressed into **one clean row of 26 sockets**, with cables arcing as half-circles above. Click two letters to wire a pair, click a wired letter to pull. Each cable picks its own colour from a 10-step palette so crossings stay legible. The historical **10-pair limit** is shown top-right (`4 / 10` in the shot above).

### 💡 Side rail — lamps + keys, with their tapes

<p align="center">
  <img src="../pics/qa-side-en.png" alt="Lampboard and keyboard with tapes" width="280" />
</p>

The right rail glues each text strip to its native device:

- **Top:** Lampboard (QWERTZ glow lamps) + **`OUT` tape** — newest ciphertext on the right
- **Bottom:** On-screen keyboard (or use your physical one) + **`IN` tape** — newest plaintext on the right

Tapes use `direction: rtl` so the newest character is always visible without a scrollbar.

### 🛠️ Config rail (left)

A minimal left rail for global actions — Preset, Reset, Reflector cycle, plus toggles for **ring-setting mode**, **single-step**, and **slow** playback. The per-rotor controls live above their column in the Core, not here.

### 🔎 Touch the geometry

<p align="center">
  <img src="../pics/qa-hover-en.png" alt="Hover tooltip on a contact" width="480" />
</p>

Hover (or Tab + focus) any of the 130 contacts to read its mapping in plain English: `R2 outer ring X → inner contact V`. The tooltip is `aria-live="polite"` and respects `prefers-reduced-motion`.

### 🌐 Bilingual UI & onboarding

The whole interface speaks two languages. The **`EN` / `中`** toggle in the topbar flips every label, tooltip and caption between English and Simplified Chinese — powered by `react-i18next`, with the choice persisted to `localStorage["enigma-lang"]` (default: English).

On a first visit, a **3-step onboarding modal** — a brass "field manual" — walks newcomers through loading rotors, striking keys, and watching the current. It can be skipped, reopened from the **Manual** topbar button, and remembers dismissal via `localStorage["enigma-onboarded"]`.

---

## 🚀 Get started

```bash
cd apps/enigma-frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) and start typing.

> 💡 The frontend talks to the backend at `http://localhost:8000`. Start [enigma-api](enigma-api.md) first.

---

## 🧩 Directory tour

```text
apps/enigma-frontend/src/
├─ 🧱 components/
│   ├─ EnigmaSimulator.tsx          ← the bento grid container
│   ├─ LanguageSwitcher.tsx         ← EN / 中 topbar toggle
│   ├─ onboarding/
│   │   └─ Onboarding.tsx           ← first-run 3-step field manual
│   └─ machine/
│      ├─ MachinePlate.tsx          ← topbar (title + actions + language)
│      ├─ MachineCore.tsx           ← 5-column core + current path
│      ├─ ContactColumn.tsx         ← one column = 26 contacts + wires
│      ├─ ConfigRail.tsx            ← left global-actions rail
│      ├─ Plugboard.tsx             ← bottom 26-socket strip
│      ├─ Rotor.tsx · RotorBank.tsx · Reflector.tsx
│      ├─ LampBoard.tsx + Keyboard.tsx
│      ├─ TapeDisplay.tsx           ← IN / OUT text strips
│      ├─ SignalPath.tsx            ← legacy 11-node fallback (< 760px)
│      └─ signal.ts · core.ts · layout.ts
├─ 🪝 hooks/
│   ├─ useMediaQuery.ts             ← narrow-screen detection
│   ├─ usePhysicalKeyboard.ts       ← physical-keyboard input
│   └─ useSound.ts                  ← key-click / lamp audio
├─ 🌐 i18n/
│   ├─ index.ts                     ← react-i18next setup
│   └─ locales/en.json · zh-CN.json ← UI strings
├─ 🛰️  services/api.ts              ← backend client
└─ 🚪 index.tsx                     ← app entry
```

| Path | Responsibility |
|---|---|
| [`components/EnigmaSimulator.tsx`](../apps/enigma-frontend/src/components/EnigmaSimulator.tsx) | Top-level grid container + state |
| [`components/machine/MachineCore.tsx`](../apps/enigma-frontend/src/components/machine/MachineCore.tsx) | Five-column cross-section + trace animation |
| [`components/machine/ContactColumn.tsx`](../apps/enigma-frontend/src/components/machine/ContactColumn.tsx) | One column = 26 contacts + internal wiring |
| [`components/machine/Plugboard.tsx`](../apps/enigma-frontend/src/components/machine/Plugboard.tsx) | The 26-socket strip in the bottom row |
| [`components/machine/ConfigRail.tsx`](../apps/enigma-frontend/src/components/machine/ConfigRail.tsx) | Global actions + advanced toggles |
| [`services/api.ts`](../apps/enigma-frontend/src/services/api.ts) | Calls `/api/rotors`, `/api/reflectors`, `/api/encrypt` |

---

## 🎨 Visual language

| Token | Used for |
|---|---|
| `--brass-light` `#d4a45c` | Forward current, contact dots, focus rings |
| `--copper-cool` `#2f7a8a` | Backward current after the reflector |
| `--wire-static` `rgba(212,164,92,0.15)` | The 130 always-drawn internal wires |
| `--core-bg` `#1a1410` | Machine Core panel background |
| `--notch` `#b3422e` | Red notch indicator on rotor letter rings |

All tokens live in [`styles/tokens.css`](../apps/enigma-frontend/src/styles/tokens.css) — change once, redress everything.

---

## 🛠️ Common scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server on port 3000 |
| `npm run build` | Production build into `build/` |
| `npm test` | Run unit tests |

---

## 🔗 Related docs

- 🏗️ [Architecture](architecture.md)
- 🔌 [API reference](api.md)
- 🛠️ [Development guide](development.md)
- 🧪 [Plugboard drag prototype](plugboard-drag-demo.md)
