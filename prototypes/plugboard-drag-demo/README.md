<div align="right">

🌐 **English** · [中文](../../docs_cn/plugboard-drag-demo.md)

</div>

<div align="center">

# 🧪 Plugboard Drag Demo

### 🔌 A tiny standalone sandbox: draw a cable between any two letters with your mouse.

</div>

---

## ✨ What is it?

The smallest runnable prototype of Enigma's **plugboard drag-to-wire** interaction.

> No backend, no encryption — just answering one question: **does dragging a cable feel right?**

```
   A   B   C   D   E   F   G   ...   Z
   ●───────────────●     ●─────●
   c   a   b   l   e   s   d   r   a   w   n
```

---

## 🚀 Get started

```bash
npm install
npm start
```

In the browser, **press a letter, drag to another, release** to create a connection. Click an existing cable to remove it.

---

## 🎯 Who is it for?

- Anyone implementing **drag-to-connect** interactions in React
- Cryptography fans who want to dissect the **plugboard UX** without encryption noise
- Contributors looking for a **sandbox** to validate UX changes before touching the full app

---

## 👉 Where's the full version?

The complete Enigma simulator lives at:
📦 [`apps/enigma-frontend`](../../apps/enigma-frontend/)

That's where the real encryption, lampboard, rotors and backend integration are.
