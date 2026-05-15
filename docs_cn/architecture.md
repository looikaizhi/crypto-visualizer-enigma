<div align="right">

[English](../docs/architecture.md) · 🌐 **中文**

</div>

# 🏗️ 架构说明

> 一句话总结：**前端画机器，后端转齿轮。**

---

## 🧱 分层

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   🎨 apps/enigma-frontend             浏览器 UI · 交互 · 可视化       │
│       React + TypeScript                                             │
│                                                                      │
│                         ▲     HTTP / JSON                            │
│                         ▼                                            │
│                                                                      │
│   ⚙️ services/enigma-api              Enigma 配置 + 单字符加密 API    │
│       FastAPI + Pydantic                                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

   🧪 prototypes/plugboard-drag-demo    插线板拖拽连线 · 独立沙盒
```

| 层 | 路径 | 职责 |
|---|---|---|
| 🎨 应用层 | [`apps/enigma-frontend`](../apps/enigma-frontend/) | 浏览器界面、用户交互、电流路径动画 |
| ⚙️ 服务层 | [`services/enigma-api`](../services/enigma-api/) | 加密引擎、配置接口、严格的类型契约 |
| 🧪 原型层 | [`prototypes/plugboard-drag-demo`](../prototypes/plugboard-drag-demo/) | 拖拽连线交互实验，不参与正式运行 |

---

## 🔄 主流程

一次完整的"按一个键 → 灯板亮一格"会经过这条管道：

```
   👤 用户点击屏幕键盘 "A"
        │
        ▼
   🎨 前端                                ⚙️ 后端
   ────────                              ────────
   ① 启动时 ──── GET /rotors ───────────▶ 返回转子 wiring 列表
              GET /reflectors ─────────▶ 返回反射器 wiring 列表
   ② 用户配置转子 / 反射器 / 插线板
   ③ 按键 ───── POST /encrypt {char} ──▶ 转子步进
                                         插线板 → 正向转子 ×3
                                         → 反射器
                                         → 反向转子 ×3 → 插线板
              ◀───── { ciphertext,      返回密文、新位置、路径
                       rotor_positions,
                       forwardResult,
                       backwardResult }
   ④ 更新输入/输出文本
   ⑤ 灯板亮起密文字母
   ⑥ 按 forwardResult / backwardResult 逐层高亮电流路径
```

---

## 🎯 设计原则

| 原则 | 怎么体现 |
|---|---|
| 🪶 **薄后端、瘦请求** | 一次加密只传一个字符，避免后端积累任何会话状态 |
| 🔍 **过程可观测** | 后端不只返回密文，还返回**每一层的中间映射**，供前端可视化 |
| 🧩 **关注点分离** | UI、状态、API 调用各在一处；常量、模型、路由各司其职 |
| 🧪 **可独立实验** | 原型放在 `prototypes/`，可以单跑、单玩、单调试 |

---

## 🔗 继续阅读

- 🔌 [API 字段细节](api.md)
- 🛠️ [本地开发指南](development.md)
- 🗂️ [目录组织规则](directory-layout.md)
