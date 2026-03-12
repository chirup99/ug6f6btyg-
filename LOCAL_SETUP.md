# Local Development Setup Guide (VSCode/Windows)

This guide will help you run the project on your local machine with VSCode.

## Prerequisites

1. **Node.js** - Already installed ✓
2. **PostgreSQL** - Required for database

### Installing PostgreSQL on Windows

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Remember the password you set for the `postgres` user
   - Keep the default port `5432`
   - Install pgAdmin (comes with PostgreSQL)
4. After installation, open pgAdmin and create a new database for your project

## Setup Steps

### Step 1: Create Environment File

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and set your database connection:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/your_database_name
   ```
   Replace:
   - `your_password` with the PostgreSQL password you set during installation
   - `your_database_name` with the name of the database you created in pgAdmin

### Step 2: Reset Database (Fix Migration Errors)

If you're getting the "column 'id' is in a primary key" error, run:

```bash
npx tsx scripts/reset-database.ts
```

This will clean all existing tables from your database.

### Step 3: Push Database Schema

```bash
npm run db:push
```

This will create all the necessary tables in your database.

### Step 4: Run the Application

```bash
npm run dev
```

The application will start on `http://localhost:5000`

## Troubleshooting

### Error: "psql is not recognized"
- Solution: Use pgAdmin GUI tool or follow Step 2 above

### Error: "column 'id' is in a primary key"
- Solution: Run `npx tsx scripts/reset-database.ts` then `npm run db:push`

### Error: "DATABASE_URL not found"
- Solution: Make sure you created the `.env` file in Step 1

### Error: "Connection refused"
- Solution: Make sure PostgreSQL service is running (check Windows Services)

## Optional: Add PostgreSQL to Windows PATH

1. Open System Properties (`Win + R` → type `sysdm.cpl`)
2. Click "Environment Variables"
3. Under "System variables", find "Path" and click "Edit"
4. Click "New" and add: `C:\Program Files\PostgreSQL\15\bin\` (adjust version number)
5. Click OK and restart your terminal

After this, you can use `psql` commands in your terminal.
