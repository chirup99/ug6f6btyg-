# 🗄️ Setting Up Local Database (Windows)

You got this error because the app needs a database, but you don't have one set up yet.

## 🎯 2 Options to Fix This

---

## ✅ OPTION 1: Use SQLite (Easiest - Recommended for Beginners)

I'll help you switch to SQLite, which doesn't require installing PostgreSQL.

**Just wait for me to make this change!**

---

## ✅ OPTION 2: Install PostgreSQL (More Setup)

If you want to use PostgreSQL like the production version:

### Step 1: Install PostgreSQL

Download and install from: https://www.postgresql.org/download/windows/

During installation:
- Remember your password
- Default port: 5432
- Default username: postgres

### Step 2: Create a Database

Open **pgAdmin** (installed with PostgreSQL):
1. Right-click "Databases"
2. Click "Create" → "Database"
3. Name it: `trading_db`
4. Click "Save"

### Step 3: Create .env File

1. Copy `.env.example` and rename it to `.env`
2. Update the DATABASE_URL:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/trading_db
```

Replace `YOUR_PASSWORD` with the password you set during installation.

### Step 4: Run Setup

```bash
npm install
npm run db:push
npm run dev
```

---

## ❓ Which Option Should You Choose?

- **New to databases?** → Wait for Option 1 (I'll switch to SQLite)
- **Want production setup?** → Use Option 2 (PostgreSQL)

Let me know which you prefer!
