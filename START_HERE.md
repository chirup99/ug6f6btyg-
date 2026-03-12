# ⚡ START HERE - Absolute Beginner Guide

## 🎯 What You Need to Know

You're probably used to running programs by **double-clicking a file**.

**This project is different!** You run it using **commands in a terminal**.

---

## 📺 Visual Guide

### Where is the Terminal?

```
┌─────────────────────────────────────────────────────┐
│ VS Code Window                                       │
│                                                      │
│  Your code files appear here                        │
│  (you can see all the .ts, .tsx files)             │
│                                                      │
├─────────────────────────────────────────────────────┤
│ ► TERMINAL (the black window at bottom)             │
│                                                      │
│   $ npm run dev    ← You type commands here         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 COPY-PASTE THIS

### First Time Only:
```bash
npm install
npm run db:push
```

### Every Time You Want to Run:
```bash
npm run dev
```

---

## ✅ What Success Looks Like

After typing `npm run dev`, you should see something like:

```
serving on port 5000
✅ Live WebSocket price streaming system started successfully
```

Then open your browser and go to: **http://localhost:5000**

---

## ❌ Common Beginner Mistakes

### ❌ WRONG: Double-clicking files
Don't try to open and run `index.ts` or `App.tsx` directly

### ✅ RIGHT: Using terminal commands
Open terminal and type `npm run dev`

---

### ❌ WRONG: Running in Node.js
Don't try to run this with "Run" button in VS Code

### ✅ RIGHT: Using npm commands
Use the terminal to run `npm run dev`

---

## 🎓 Understanding the Basics

### What is `npm`?
Think of it as a manager that knows how to start your app

### What is `npm run dev`?
It's a command that:
1. Starts your backend server
2. Starts your frontend website
3. Connects them together
4. Opens it on port 5000

### What is the terminal?
A text-based way to give commands to your computer (instead of clicking)

---

## 📞 Quick Reference

| I want to... | Command to type |
|--------------|----------------|
| Install everything first time | `npm install` |
| Start the app | `npm run dev` |
| Stop the app | Press `Ctrl + C` |
| Check if it's working | Open `http://localhost:5000` |

---

## 🆘 Still Confused?

1. Open VS Code
2. Open Terminal (bottom of window or press `Ctrl + \``)
3. Type: `npm install` and press Enter
4. Wait for it to finish
5. Type: `npm run dev` and press Enter
6. Open browser to `http://localhost:5000`

**That's the entire process!** No files to click, just those terminal commands.
