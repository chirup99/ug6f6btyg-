# Quick Start Guide for VS Code

## ⚡ Fast Setup (3 Simple Steps)

### 1️⃣ Open Terminal in VS Code
Press `` Ctrl + ` `` (backtick) or go to **Terminal → New Terminal**

### 2️⃣ Install Everything
```bash
npm install
```

### 3️⃣ Run the App
```bash
npm run dev
```

That's it! Open **http://localhost:5000** in your browser.

---

## 🔄 Daily Usage

**To start the app:**
```bash
npm run dev
```

**To stop the app:**
Press `Ctrl + C` in the terminal

---

## ❓ Troubleshooting

**Problem: "tsx: not found"**
Solution:
```bash
npm install
```

**Problem: Database errors**
Solution:
```bash
npm run db:push
```

**Problem: Port already in use**
Solution: Kill the process using port 5000 or change the port:
```bash
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# On Mac/Linux
lsof -ti:5000 | xargs kill -9
```

---

## 📂 What Each Folder Does

| Folder | Purpose |
|--------|---------|
| `client/` | Your website's frontend (what users see) |
| `server/` | Your backend API (handles data and logic) |
| `shared/` | Code used by both frontend and backend |
| `docs/` | All documentation and guides |
| `data/` | Trading data and analysis files |

---

## 🎓 Learn More

- **Frontend**: The `client/src/` folder has all React components
- **Backend**: The `server/` folder has all API routes
- **Database**: Check `shared/schema.ts` for database structure

For detailed documentation, see the `docs/` folder.
