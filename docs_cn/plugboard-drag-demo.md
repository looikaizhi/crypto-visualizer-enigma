<div align="right">

[English](../docs/plugboard-drag-demo.md) · 🌐 **中文**

</div>

<div align="center">

# 🧪 Plugboard Drag Demo

### 🔌 一个独立的小沙盒：用鼠标在 A–Z 之间拉一根线

</div>

---

## ✨ 它是什么？

Enigma **插线板（Plugboard）拖拽连线**的最小可运行原型。

> 不连接后端、不跑加密 —— 只验证一件事：**鼠标拖动产生的"插线"交互够不够顺手。**

<p align="center">
  <img src="../pics/qa-plug.png" alt="插线板长条（接了四对）" width="780" />
</p>

<p align="center">
  <em>正式版主前端现在的插线板：26 个插孔单行排列，跳线以半圆弧形画在上方。图中已接 <code>F ↔ N</code>、<code>G ↔ H</code>、<code>I ↔ M</code>、<code>L ↔ V</code> 四对 —— 每根电缆颜色不同，交叉处依然清晰。右上角实时显示历史上限 10 对的使用计数。</em>
</p>

> 💡 上方截图取自 [`apps/enigma-frontend`](../apps/enigma-frontend/) 中的正式版插线板。本独立原型正是它**拖拽连线**机制的沙盒 —— 先在原型里反复打磨手感，再装进真机。

---

## 🚀 启动

```bash
npm install
npm start
```

打开浏览器，**按住任意字母往另一个字母拖**，松手即建立连接。再点一次连线可断开。

---

## 🎯 适合谁？

- 想在 **React** 里实现拖拽连线交互的同学
- 想拆解 Enigma 插线板**交互逻辑**而不被加密细节干扰的爱好者
- 给完整版前端做 **UX 验证沙盒** 的贡献者

---

## 👉 正式版在哪里？

完整的 Enigma 模拟器位于：
📦 [`apps/enigma-frontend`](../apps/enigma-frontend/)

那里有真正的加密、灯板、转子，以及和后端的完整对接。
