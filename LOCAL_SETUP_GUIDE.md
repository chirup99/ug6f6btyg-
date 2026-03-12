# 🖥️ Running This Project Locally on VS Code

This guide will help you run your Replit project on VS Code locally.

## 📋 Prerequisites

1. **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** - [Download](https://www.postgresql.org/download/)
3. **Git** - [Download](https://git-scm.com/downloads)
4. **VS Code** - [Download](https://code.visualstudio.com/)

## 🚀 Setup Steps

### 1. Clone/Download Your Project
If you haven't already, download or clone your project to your local machine.

### 2. Install Dependencies
Open terminal in VS Code and run:
```bash
npm install
```

### 3. Set Up PostgreSQL Database Locally

**Option A: Using PostgreSQL GUI (pgAdmin)**
1. Open pgAdmin
2. Create a new database (e.g., `trading_app`)
3. Note your credentials (username, password, host, port)

**Option B: Using Command Line**
```bash
# Create a new database
createdb trading_app

# Or use psql
psql -U postgres
CREATE DATABASE trading_app;
\q
```

### 4. Create `.env` File

Create a `.env` file in your project root (same directory as `package.json`):

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/trading_app
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=trading_app

# Server
PORT=5000
NODE_ENV=development

# Firebase (Get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Fyers API
FYERS_APP_ID=your-app-id
FYERS_SECRET_KEY=your-secret-key
FYERS_ACCESS_TOKEN=your-access-token
FYERS_REDIRECT_URL=http://localhost:5000/api/fyers/callback
```

### 5. Push Database Schema

Run the database migration:
```bash
npm run db:push
```

This will create all the necessary tables in your PostgreSQL database.

### 6. Run the Development Server

```bash
npm run dev
```

Your app should now be running at `http://localhost:5000`

## 🔑 Getting API Keys

### **Google Gemini AI**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy and add to `.env` as `GEMINI_API_KEY`

### **Firebase/Firestore**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Project Settings** → **Service Accounts**
3. Click **"Generate New Private Key"**
4. Download the JSON file
5. Extract these values to your `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### **Fyers API**
1. Go to [Fyers API Dashboard](https://myapi.fyers.in/dashboard)
2. Create/select your app
3. Copy:
   - App ID → `FYERS_APP_ID`
   - Secret Key → `FYERS_SECRET_KEY`
4. Generate access token through OAuth flow

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
# On Mac
brew services list

# On Windows
services.msc  # Check "postgresql" service

# Test connection
psql -U postgres -d trading_app
```

### Port Already in Use
If port 5000 is already in use, change `PORT=5000` to another port in `.env`

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure

```
your-project/
├── client/              # React frontend
├── server/              # Express backend
├── shared/              # Shared types/schema
├── .env                 # Your local environment variables (don't commit!)
├── .env.example         # Template for environment variables
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
└── drizzle.config.ts    # Database configuration
```

## ⚠️ Important Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Database URL format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
3. **Firebase Private Key**: Must include `\n` characters and be wrapped in quotes
4. **Development vs Production**: Set `NODE_ENV=development` for local development

## 🆚 Replit vs Local Differences

| Feature | Replit | VS Code (Local) |
|---------|--------|-----------------|
| Secrets | Built-in Secrets UI | `.env` file |
| Database | Auto-provisioned | Manual PostgreSQL setup |
| Port | Always 5000 | Configurable (default 5000) |
| Hot Reload | Automatic | Via `npm run dev` |
| Environment | Cloud | Local machine |

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Run development server
npm run dev

# Type check
npm run check

# Build for production
npm run build
npm start
```

## 🐛 Common Errors & Solutions

**Error: "DATABASE_URL not found"**
- Make sure `.env` file exists in project root
- Check that `DATABASE_URL` is properly set

**Error: "ECONNREFUSED"**
- PostgreSQL is not running
- Wrong host/port in DATABASE_URL

**Error: "Firebase error"**
- Check that Firebase credentials are correct
- Ensure `FIREBASE_PRIVATE_KEY` has proper line breaks (`\n`)

**Error: "Port 5000 already in use"**
- Change `PORT` in `.env` to another port (e.g., 3000, 8080)

---

## ✅ Verification Checklist

- [ ] Node.js installed
- [ ] PostgreSQL installed and running
- [ ] `.env` file created with all required variables
- [ ] Dependencies installed (`npm install`)
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Development server running (`npm run dev`)
- [ ] App accessible at `http://localhost:5000`

---

Need help? Check the logs in the terminal for specific error messages!
