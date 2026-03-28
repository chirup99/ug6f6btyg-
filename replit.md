# NeoFeed Trading Platform

## Overview
A full-stack trading platform built with React (frontend) and Express.js (backend), featuring real-time market data, social trading feeds, broker integrations, and AI-powered trading analysis.

## Architecture
- **Frontend**: React + Vite, TypeScript, TailwindCSS, Radix UI, TanStack Query, Wouter routing
- **Backend**: Express.js, TypeScript, Drizzle ORM, PostgreSQL (via Neon), WebSocket streaming
- **Storage**: AWS DynamoDB for social/user data, PostgreSQL for session/auth data
- **Auth**: AWS Cognito, Passport.js
- **AI**: Google Gemini, OpenAI

## Key Features
- Real-time stock market data via Angel One SmartAPI (WebSocket + REST)
- Social trading feed (posts, likes, comments, follows)
- Multi-broker support: Angel One, Dhan, Upstox, Fyers, Zerodha
- Trading journal and heatmaps (stored in AWS DynamoDB)
- AI-powered trading NLP agent
- Option chain viewer
- Trade challenge system
- Audio posts (TTS via MS Edge TTS)

## Project Structure
```
client/          - React frontend (Vite)
  src/
    pages/       - App views (Dashboard, Home, Landing, etc.)
    components/  - UI components (charts, feeds, broker panels)
    hooks/       - Custom hooks (market data, auth, brokers)
server/          - Express backend
  routes.ts      - All API routes (~20k lines)
  services/      - Broker service integrations
  storage.ts     - Data access layer (MemStorage + DynamoDB)
shared/          - Shared TypeScript types and Drizzle schema
scripts/         - Deployment and utility scripts
```

## Development
- **Start**: `npm run dev` — runs Express + Vite dev server on port 5000 (uses local tsx binary)
- **Build**: `npm run build` — builds frontend with Vite + bundles server with esbuild into `dist/`
- **DB Sync**: `npm run db:push` — syncs Drizzle schema to PostgreSQL

## Replit Setup Notes
- Dev script uses `node_modules/.bin/tsx` (not `npx tsx`) to avoid interactive install prompts
- Workflow: "Start application" runs `npm run dev`, listening on port 5000 (webview)
- HMR configured for Replit dev domain via REPLIT_DEV_DOMAIN env var

## Environment Variables
Key secrets managed via Replit environment:
- `ANGEL_ONE_CLIENT_CODE`, `ANGEL_ONE_PIN`, `ANGEL_ONE_API_KEY`, `ANGEL_ONE_TOTP_SECRET`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`, `AWS_COGNITO_USER_POOL_ID`, `AWS_COGNITO_APP_CLIENT_ID`
- `VITE_COGNITO_*` — frontend Cognito config
- `DATABASE_URL` — PostgreSQL connection string (Neon)
- `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY`

## Deployment
- **Target**: Autoscale
- **Build command**: `npm run build`
- **Run command**: `node ./dist/index.js`
- Port 5000 mapped to external port 80
