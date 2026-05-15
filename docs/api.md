<div align="right">

🌐 **English** · [中文](../docs_cn/api.md)

</div>

# 🔌 API Reference

> The Enigma backend is a **thin, sharp** FastAPI service: three endpoints, the whole machine behind HTTP.
> Entry point: [`services/enigma-api/app/main.py`](../services/enigma-api/app/main.py)
> Default base URL: `http://localhost:8000` · Swagger UI: `http://localhost:8000/docs`

---

## 📋 Endpoints

| Method | Path | Description |
|:---:|---|---|
| 🟢 `GET` | [`/rotors`](#-get-rotors) | List all available rotor wirings |
| 🟢 `GET` | [`/reflectors`](#-get-reflectors) | List all available reflector wirings |
| 🔵 `POST` | [`/encrypt`](#-post-encrypt) | Encrypt one character and return the full current-path trace |

---

## 🟢 `GET /rotors`

Fetch all available **rotor** wirings (historical models I, II, III, …).

The frontend typically calls this once on startup to populate the configuration dropdowns.

---

## 🟢 `GET /reflectors`

Fetch all available **reflector** wirings (B, C, …).

The reflector is the fixed mapping that bounces the current back through the rotors — the source of Enigma's symmetric-encryption property.

---

## 🔵 `POST /encrypt`

Run **one** Enigma encryption step:
rotors step → input through plugboard → 3 forward rotors → reflector → 3 backward rotors → plugboard → output.

### 📨 Request

```json
{
  "plaintext": "A",
  "rotors": [
    { "index": "I",   "wiring": "EKMFLGDQVZNTOWYHXUSPAIBRCJ", "position": "A" },
    { "index": "II",  "wiring": "AJDKSIRUXBLHWTMCQGZNPYFVOE", "position": "A" },
    { "index": "III", "wiring": "BDFHJLCPRTXVZNYEIWGAKMUSQO", "position": "A" }
  ],
  "reflector": "B",
  "plugboard": [["A", "M"], ["C", "Z"]]
}
```

| Field | Type | Description |
|---|---|---|
| `plaintext` | `string` (1 char) | The letter to encrypt (A–Z) |
| `rotors` | `Rotor[]` (3 items) | Left-to-right rotor configuration |
| `reflector` | `string` | Reflector model (e.g. `"B"`, `"C"`) |
| `plugboard` | `[string, string][]` | Plugboard pairs |

### 📬 Response

```json
{
  "ciphertext": "G",
  "rotor_positions": ["B", "A", "A"],
  "plugResult": ["M", "G"],
  "forwardResult": {},
  "backwardResult": {}
}
```

| Field | Description |
|---|---|
| `ciphertext` | Final encrypted character |
| `rotor_positions` | **New** rotor positions after stepping |
| `plugResult` | Letter entering and leaving the plugboard |
| `forwardResult` | Per-layer mapping trace: input side → reflector |
| `backwardResult` | Per-layer mapping trace: reflector → output side |

> 💡 `forwardResult` / `backwardResult` are what lets the frontend light up the current "layer by layer" — the core of the visualization.

---

## 🧪 Try it

After the backend is running, hit it with `curl` or via the Swagger UI:

```bash
curl -X POST http://localhost:8000/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "plaintext": "A",
    "rotors": [
      {"index":"I","wiring":"EKMFLGDQVZNTOWYHXUSPAIBRCJ","position":"A"},
      {"index":"II","wiring":"AJDKSIRUXBLHWTMCQGZNPYFVOE","position":"A"},
      {"index":"III","wiring":"BDFHJLCPRTXVZNYEIWGAKMUSQO","position":"A"}
    ],
    "reflector": "B",
    "plugboard": [["A","M"],["C","Z"]]
  }'
```

---

🔙 Back to [project home](../README.md) · 🏗️ See [architecture](architecture.md)
