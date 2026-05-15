<div align="right">

🌐 **English** · [中文](../docs_cn/architecture.md)

</div>

# 🏗️ Architecture

> One-line summary: **the frontend draws the machine, the backend turns the gears.**

---

## 🧱 Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   🎨 apps/enigma-frontend             Browser UI · interaction · viz  │
│       React + TypeScript                                             │
│                                                                      │
│                         ▲     HTTP / JSON                            │
│                         ▼                                            │
│                                                                      │
│   ⚙️ services/enigma-api              Enigma config + per-key API     │
│       FastAPI + Pydantic                                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

   🧪 prototypes/plugboard-drag-demo    Plugboard drag sandbox (isolated)
```

| Layer | Path | Responsibility |
|---|---|---|
| 🎨 Application | [`apps/enigma-frontend`](../apps/enigma-frontend/) | UI, interaction, current-path animation |
| ⚙️ Service | [`services/enigma-api`](../services/enigma-api/) | Encryption engine, config endpoints, strict typing |
| 🧪 Prototype | [`prototypes/plugboard-drag-demo`](../prototypes/plugboard-drag-demo/) | Drag-to-wire UX experiment, not part of the running app |

---

## 🔄 Main flow

A full "press a key → lamp lights up" cycle goes through this pipeline:

```
   👤 User taps key "A" on the on-screen keyboard
        │
        ▼
   🎨 Frontend                              ⚙️ Backend
   ─────────                                ────────
   ① on startup ── GET /rotors ───────────▶ returns rotor wirings
                  GET /reflectors ────────▶ returns reflector wirings
   ② user configures rotors / reflector / plugboard
   ③ key press ── POST /encrypt {char} ──▶ step rotors
                                            plugboard → 3 forward rotors
                                            → reflector
                                            → 3 backward rotors → plugboard
                ◀───── { ciphertext,        return cipher, positions, trace
                         rotor_positions,
                         forwardResult,
                         backwardResult }
   ④ update input / output text
   ⑤ light the ciphertext letter on the lampboard
   ⑥ replay forwardResult / backwardResult to animate the current path
```

---

## 🎯 Design principles

| Principle | How it shows up |
|---|---|
| 🪶 **Thin backend, lean requests** | One char per request, no server-side session state |
| 🔍 **Observable internals** | The backend returns **every intermediate mapping**, not just the ciphertext |
| 🧩 **Separation of concerns** | UI / state / API client live in distinct places; constants / models / routes each have their own home |
| 🧪 **Independently experimentable** | Prototypes live in `prototypes/` and can be run, played with, and debugged on their own |

---

## 🔗 Read next

- 🔌 [API field details](api.md)
- 🛠️ [Local development guide](development.md)
- 🗂️ [Directory organisation](directory-layout.md)
