<div align="right">

[English](../docs/enigma-frontend.md) · 🌐 **中文**

</div>

<div align="center">

# 🎨 Enigma Frontend

### 把一台 1918 年的密码机，画进 2025 年的浏览器

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" />
  <img alt="CRA" src="https://img.shields.io/badge/Create_React_App-09D3AC?logo=createreactapp&logoColor=white&style=flat-square" />
</p>

</div>

---

## 📸 界面预览

<p align="center">
  <img src="../pics/enigma-frontend-overview.png" alt="Enigma 前端整体界面" width="420" />
</p>

<p align="center">
  <em>整体界面：转子区、灯板、键盘、信号路径面板、插线板、输入/输出条。</em>
</p>

---

## ✨ 这是什么？

Enigma Visualizer 的 **主前端**：用 React + TypeScript 构建的交互式 UI，让你可以——

- 🎛️ 旋转转子、切换反射器
- 🔌 在插线板上**拖拽连线**
- ⌨️ 按下屏幕键盘，看灯板逐字符亮起
- 🔍 跟踪每一束电流在 Enigma 内部的完整路径

---

## 🎛️ 各部件长这样

### 转子区

![转子与反射器](../pics/rotors.png)

最左是反射器（UKW B），右侧是三个转子。每个转子可下拉切换型号、滚动可见字母，也可以用 ▲ / ▼ 按钮单步推进。

### 插线板

![插线板（空）](../pics/plugboard.png)

点击两个字母即可连成一对；再点已连线字母即拔掉电缆。

![插线板（已连线）](../pics/plugboard-wired.png)

连线后的插线板：两对已建立（`A ↔ M`、`C ↔ Z`）。右上角计数器按历史规则限制最多 10 对。

---

## 🚀 启动

```bash
npm install
npm start
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，开始按键。

> 💡 默认连接的后端地址：
> ```
> http://localhost:8000
> ```
> 请先启动 [enigma-api](../services/enigma-api/) 服务。

---

## 🧩 目录速览

```text
src/
├─ 🧱 components/        转子 · 反射器 · 插线板 · 键盘 · 灯板
├─ 🛰️  services/api.ts   后端 API 请求封装
└─ 🚪 App.tsx            应用入口组件
```

| 路径 | 职责 |
|---|---|
| `src/components` | 各个可视化部件（Rotor / Reflector / Plugboard / Keyboard / Lampboard） |
| `src/services/api.ts` | 调用后端 `/rotors`、`/reflectors`、`/encrypt` |
| `src/App.tsx` | 顶层组装与状态管理 |

---

## 🛠️ 常用脚本

| 命令 | 作用 |
|---|---|
| `npm start` | 启动开发服务器（默认 3000 端口） |
| `npm run build` | 构建生产产物到 `build/` |
| `npm test` | 运行单元测试 |

---

## 🔗 相关文档

- 🏗️ [整体架构](architecture.md)
- 🔌 [API 字段说明](api.md)
- 🛠️ [开发指南](development.md)
