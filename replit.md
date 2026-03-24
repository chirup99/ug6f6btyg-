# Replit Migration Notes

## Migration Status: Complete
- Fixed broken `tsx` symlink caused by deprecated `@esbuild-kit` devDependency aliases
- Removed `@esbuild-kit/core-utils` and `@esbuild-kit/esm-loader` npm aliases from devDependencies
- Database schema pushed to PostgreSQL via `drizzle-kit push`
- App runs on port 5000 (development), Vite HMR configured for Replit proxy (`wss`, port 443)
- Deployment configured: `npm run build` → `node ./dist/index.cjs`

# Overview

This project is a full-stack trading platform providing real-time market data analysis, AI-powered trading insights, and a social feed. It integrates an AI agent with web search for financial queries, live market data from Angel One WebSockets, and a unified sharing system for trading journal reports, allowing users to preview and share performance metrics. The business vision is to empower traders with sophisticated analytical tools, AI-driven insights, and a collaborative community to enhance decision-making.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript, Vite
**UI/UX**: Radix UI components with Tailwind CSS for a mobile-first, responsive design using shadcn/ui patterns. Features include bottom navigation for mobile and sidebar for desktop.
**State Management**: TanStack Query (React Query) for server state and real-time data updates.
**Routing**: Wouter for client-side routing.

## Backend Architecture

**Runtime**: Node.js with Express.js (TypeScript)
**API Pattern**: RESTful endpoints.
**Core Services**:
- **Market Data Service**: Fetches real-time and historical data from Angel One API and Yahoo Finance.
- **Pattern Recognition**: Identifies uptrend/downtrend using Point A/B analysis.
- **Trade Validation**: Applies timing rules for breakout detection.
**System Design**: Stateless API, separation of concerns, comprehensive error handling, and caching strategies for performance.

## Data Storage

**Database**: PostgreSQL (Neon serverless), AWS DynamoDB (for NeoFeed social features)
**ORM**: Drizzle ORM with TypeScript schema definitions (`shared/schema.ts`).
**Data Models**: User accounts, trading signals, cached market data, social feed posts, and user trading journal data.

## Authentication & Authorization

**Strategy**: AWS Cognito for NeoFeed social features, session-based for other features.
**User Management**: AWS Cognito handles user registration, login, and profile management with auto-confirmation (no email verification required). 
**NeoFeed Authentication Flow**: Username/password stored locally (currentUsername), profile data synced with DynamoDB user-profiles table.

## NeoFeed AWS Migration (Complete)

**Primary Data Source**: AWS DynamoDB (ap-south-2 Hyderabad region)
**Tables**:
- `neofeed-user-posts`: Social feed posts with author info, content, media
- `neofeed-likes`: Track user likes (pk: postId, sk: userId)
- `neofeed-retweets`: Track reposts (pk: postId, sk: userId)
- `neofeed-comments`: Post comments with author info
- `neofeed-user-profiles`: User profile data (displayName, bio, avatar)
- `neofeed-follows`: Follower/following relationships (pk: followerId, sk: followingId)
- `neofeed-audio-posts`: Audio minicast posts
- `neofeed-banners`: Feed banner content
- `neofeed-report-bugs`: Bug report submissions with media attachments (S3 storage)

**API Endpoints**:
- Follow: `POST /api/users/:username/follow` (requires currentUsername in body)
- Unfollow: `POST /api/users/:username/unfollow`
- Follow Status: `GET /api/users/:username/follow-status?currentUsername=xxx`
- Follower Count: `GET /api/users/:username/followers-count`
- Like/Unlike: `POST/DELETE /api/social-posts/:id/like` (requires userId in body)
- Repost: `POST/DELETE /api/social-posts/:id/repost` (requires userId in body)
- Comment: `POST /api/social-posts/:id/comment`
- Report Bug: `POST /api/bug-reports` (submit bug report)
- Bug Media Upload: `POST /api/bug-reports/upload-media` (upload up to 5 files, 10MB each)

## Key Architectural Patterns

- **BATTU 4-Candle Rule Methodology**: Involves data collection, block formation, Point A/B detection, pattern classification, slope calculation, timing validation, and recursive analysis (80min down to 5min).
- **Demo Mode**: Allows users to switch between shared demo data (Google Cloud Storage) and personal trading data (Firebase Firestore), with access controls for saving and deleting formats based on authentication status.
- **Audio MiniCast**: Enables users to create audio-based content from feed posts by selecting up to 5 posts, which are then displayed as swipeable cards with play controls in the feed.
- **Paper Trading Enhancements**: Option chain expiry dropdown limited to the 3 nearest expiry dates for better usability.

## AI Trading Agent Enhancements (December 2025)

**Real-Time Data Integration**:
- Uses Angel One API when authenticated for live market prices
- Falls back gracefully to Yahoo Finance when Angel One is not connected
- All stock queries include related news from Google News RSS

**Real Quarterly Performance Data**:
- `EnhancedFinancialScraper` scrapes real quarterly data from Moneycontrol and NSE
- Replaces random placeholder data with actual quarterly performance metrics
- Calculates real trends based on scraped financial data

**Stock Comparison Tool**:
- Properly fetches and displays data for ALL compared stocks
- Includes quarterly performance, trend analysis, and recent news for each stock
- Returns chart-ready data with PE, EPS, and recommendation for each stock

# Text-to-Speech (TTS) System

## OpenAI-Edge-TTS Integration (v2.0 - Premium Voice Quality)

The platform now uses **openai-edge-tts** compatible voice mapping for perfect voice quality.

**Voice Profiles**:
- **Samantha** (Female, bright & energetic) → `en-US-EmmaNeural`
- **Liam** (Male, professional & warm) → `en-US-EricNeural`
- **Sophia** (Female, confident & clear) → `en-US-AriaNeural`

**Supported Languages** (8+ Indian languages + English):
- English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada

**Features**:
- Free, open-source Microsoft Edge TTS (no API key required)
- Speed adjustment (0.25x to 4.0x playback speed)
- Natural, human-like voice synthesis
- `/api/tts/generate` endpoint for TTS generation
- `/v1/audio/speech` endpoint for OpenAI API compatibility

**Backend**: `server/tts-service.ts` (Sarvam TTS Service)
- Uses `edge-tts` library with OpenAI voice mapping
- Converts speed values to SSML rate format
- Returns base64-encoded MP3 audio

# External Dependencies

-   **Market Data Providers**:
    -   **Global Market Indices**: Web search-based data (DuckDuckGo, Google News) for S&P 500, S&P/TSX, Nifty 50, Nikkei 225, Hang Seng, with smart caching and refresh based on market hours.
    -   **Indian Market Data**: Fyers API v3 and Angel One SmartAPI for real-time and historical NSE/BSE data.
-   **Text-to-Speech**: Microsoft Edge TTS via `edge-tts` (free, no API key required)
-   **Cloud Services**:
    -   **Google Cloud Firestore**: Document storage.
    -   **Google Cloud Storage**: File and asset storage.
    -   **Google Generative AI**: AI-powered market analysis.
    -   **AWS S3**: Storage backend for uploaded files (via Uppy).
    -   **AWS DynamoDB**: Primary data source for NeoFeed social features.
-   **UI Component Libraries**: Radix UI, shadcn/ui, Framer Motion, Lucide React.
-   **Development Tools**: TypeScript, ESBuild, Drizzle Kit.