<div align="right">

🌐 **English** · [中文](../docs_cn/enigma-api.md)

</div>

<div align="center">

# ⚙️ Enigma API

### A real Enigma machine, in Python, hiding behind a FastAPI service.

<p>
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white&style=flat-square" />
  <img alt="Pydantic" src="https://img.shields.io/badge/Pydantic-2-E92063?logo=pydantic&logoColor=white&style=flat-square" />
  <img alt="Uvicorn" src="https://img.shields.io/badge/Uvicorn-499848?logo=gunicorn&logoColor=white&style=flat-square" />
</p>

</div>

---

## ✨ What does it do?

A **clean, strictly-typed, Swagger-equipped** backend that:

- 🎛️ Exposes the available **rotor** and **reflector** wirings
- 🔐 Accepts a single-character keystroke and runs the **full Enigma pipeline**
- 🧭 Returns ciphertext, new rotor positions, and the **complete current-path trace** through every layer

---

## 🚀 Get started

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

Service: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs` 📘

---

## 🔌 Endpoints at a glance

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/rotors` | All available rotor wirings |
| `GET` | `/reflectors` | All available reflector wirings |
| `POST` | `/encrypt` | Single-character encryption |

Full field reference → [api.md](api.md)

---

## 🧩 Directory tour

```text
services/enigma-api/app/
├─ 🚪 main.py                FastAPI app entry
├─ 🛣️  routes/enigma.py       Enigma routes
├─ 🔢 core/constants.py      Rotor & reflector wirings
├─ ⚙️ core/machine.py        Core model (the gears turn here)
└─ 📦 models/schemas.py      Request / response models (Pydantic)
```

| File | Responsibility |
|---|---|
| [services/enigma-api/app/main.py](../services/enigma-api/app/main.py) | App bootstrap, middleware, router mount |
| [services/enigma-api/app/routes/enigma.py](../services/enigma-api/app/routes/enigma.py) | HTTP routing layer |
| [services/enigma-api/app/core/machine.py](../services/enigma-api/app/core/machine.py) | Enigma physical model: stepping, reflecting, plugging |
| [services/enigma-api/app/core/constants.py](../services/enigma-api/app/core/constants.py) | Historically accurate wirings (I, II, III, B, C, …) |
| [services/enigma-api/app/models/schemas.py](../services/enigma-api/app/models/schemas.py) | API request / response data contracts |

---

## 🧪 Tests

```bash
cd services/enigma-api
pytest
```

---

## 🔗 Related docs

- 🏗️ [Architecture](architecture.md)
- 🔌 [API reference](api.md)
- 🛠️ [Development guide](development.md)
