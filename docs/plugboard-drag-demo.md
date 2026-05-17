<div align="right">

🌐 **English** · [中文](../docs_cn/plugboard-drag-demo.md)

</div>

<div align="center">

# 🧪 Plugboard Drag Demo

### 🔌 A tiny standalone sandbox: draw a cable between any two letters with your mouse.

</div>

---

## ✨ What is it?

The smallest runnable prototype of Enigma's **plugboard drag-to-wire** interaction.

> No backend, no encryption — just answering one question: **does dragging a cable feel right?**

<p align="center">
  <img src="../pics/plugboard.png" alt="Empty plugboard" width="520" />
</p>

<p align="center">
  <em>The blank board: 26 sockets laid out QWERTZ-style, waiting for a cable.</em>
</p>

<p align="center">
  <img src="../pics/plugboard-wired.png" alt="Plugboard with two cables" width="520" />
</p>

<p align="center">
  <em>After two pairs are wired (<code>A ↔ M</code>, <code>C ↔ Z</code>) — each cable gets its own colour so overlaps stay readable.</em>
</p>

> 💡 The screenshots above are captured from the full app's plugboard, which uses the same interaction model this prototype was built to validate.

---

## 🚀 Get started

```bash
cd prototypes/plugboard-drag-demo
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
📦 [`apps/enigma-frontend`](../apps/enigma-frontend/) · see [enigma-frontend.md](enigma-frontend.md)

That's where the real encryption, lampboard, rotors and backend integration are.
