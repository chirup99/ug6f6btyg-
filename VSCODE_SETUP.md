# VS Code Setup Guide

This guide explains how to run the trading platform in VS Code (or any local development environment).

## Quick Start for VS Code

### 1. Create `.env` File

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Add Your Fyers API Credentials

Edit the `.env` file with your actual credentials:

```env
# Get from: https://myapi.fyers.in/dashboard
FYERS_APP_ID=BUXMASTNCH-100
FYERS_SECRET_KEY=TMA74Z9O0Z
FYERS_ACCESS_TOKEN=your-actual-access-token-here

# Database URL (use your PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Environment
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Database

Make sure you have PostgreSQL installed and running, then push the schema:

```bash
npm run db:push
```

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Important Security Notes

⚠️ **Never commit the `.env` file to git** - It contains your sensitive API credentials. The `.env` file is already added to `.gitignore` to prevent accidental commits.

## Difference Between Replit and VS Code

- **Replit**: Uses encrypted secret storage (Secrets tab in the sidebar) - most secure
- **VS Code**: Uses `.env` file (make sure it's in `.gitignore`)

Both methods work with the same code - the application automatically loads credentials from either environment variables (Replit secrets) or the `.env` file (VS Code).

## Getting Fyers API Credentials

1. Go to https://myapi.fyers.in/dashboard
2. Create an app or use existing app
3. Copy the App ID and Secret Key
4. Generate an access token (valid for 24 hours)

## Troubleshooting

### "Access token not available"
- Check that your `.env` file has the correct `FYERS_ACCESS_TOKEN`
- Fyers tokens expire after 24 hours - generate a new one if needed

### Database connection errors
- Verify your `DATABASE_URL` is correct
- Make sure PostgreSQL is running locally
- Run `npm run db:push` to create the tables
