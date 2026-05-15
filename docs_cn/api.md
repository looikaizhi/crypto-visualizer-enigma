<div align="right">

[English](../docs/api.md) · 🌐 **中文**

</div>

# 🔌 API 说明

> Enigma 后端是一个 **薄而锋利** 的 FastAPI 服务：三个端点，把整个 Enigma 装在 HTTP 之后。
> 后端入口：[`services/enigma-api/app/main.py`](../services/enigma-api/app/main.py)
> 默认地址：`http://localhost:8000` · Swagger UI：`http://localhost:8000/docs`

---

## 📋 端点一览

| 方法 | 路径 | 描述 |
|:---:|---|---|
| 🟢 `GET` | [`/rotors`](#-get-rotors) | 列出所有可用转子 wiring |
| 🟢 `GET` | [`/reflectors`](#-get-reflectors) | 列出所有可用反射器 wiring |
| 🔵 `POST` | [`/encrypt`](#-post-encrypt) | 单字符加密并返回完整电流路径 |

---

## 🟢 `GET /rotors`

拿到全部可选**转子**（历史型号 I、II、III 等）的接线表。

前端通常在启动时调用一次，作为配置面板的下拉数据源。

---

## 🟢 `GET /reflectors`

拿到全部可选**反射器**（B、C 等）的接线表。

反射器决定 Enigma "返回路径" 的固定映射，是其加密对称性的来源。

---

## 🔵 `POST /encrypt`

**对单个字符**完成一次完整 Enigma 加密：
转子先步进 → 输入信号经过插线板 → 三层正向转子 → 反射器 → 三层反向转子 → 再经插线板 → 输出。

### 📨 请求示例

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

| 字段 | 类型 | 说明 |
|---|---|---|
| `plaintext` | `string` (1 字符) | 要加密的字母（A–Z） |
| `rotors` | `Rotor[]` (3 项) | 从左到右的三个转子配置 |
| `reflector` | `string` | 反射器型号（如 `"B"`、`"C"`） |
| `plugboard` | `[string, string][]` | 插线板配对，每对两个字母 |

### 📬 响应示例

```json
{
  "ciphertext": "G",
  "rotor_positions": ["B", "A", "A"],
  "plugResult": ["M", "G"],
  "forwardResult": {},
  "backwardResult": {}
}
```

| 字段 | 说明 |
|---|---|
| `ciphertext` | 最终加密后的字符 |
| `rotor_positions` | 加密后**新的**三个转子位置（已步进） |
| `plugResult` | 进入插线板与离开插线板的字符 |
| `forwardResult` | 正向（输入侧 → 反射器）每一层的映射轨迹 |
| `backwardResult` | 反向（反射器 → 输出侧）每一层的映射轨迹 |

> 💡 `forwardResult` / `backwardResult` 让前端能把电流"逐层点亮"，这是可视化的核心。

---

## 🧪 试一试

启动后端后，用 `curl` 或在 Swagger UI 上直接试：

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

🔙 回到 [项目首页](README.md) · 🏗️ 看 [架构说明](architecture.md)
