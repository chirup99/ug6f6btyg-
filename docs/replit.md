# CB Connect - Fyers API Dashboard

## Overview
CB Connect is a full-stack web application that provides a real-time dashboard for Fyers API connectivity and market data. Its primary purpose is to automate trading strategies through continuous scanning for specific market patterns (BATTU scanner), recording them, and executing trades based on predefined conditions until market close. The system includes robust stop-limit order management, dynamic historical analysis, and fast breakout simulation. It is designed for streamlined pattern analysis and breakout monitoring, with an adaptable architecture to support evolving user-defined trading methodologies, including advanced timeframe doubling and recursive analysis.

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX preferences: Fixed bottom navigation bars that don't scroll with content (like ChatGPT style).
Trading Master UI: Display "Orders" instead of "Insights" in the sentiment analysis section.

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript and Vite, styled with Tailwind CSS and shadcn/ui components for a professional, responsive design. The color scheme is indigo-themed, using clear green/red indicators for trading signals and orange for breakout lines. Interactive charts and dashboards provide real-time visual feedback.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, Wouter, shadcn/ui, Tailwind CSS, TanStack Query.
- **Backend**: Express.js, TypeScript, ES modules.
- **Database**: PostgreSQL with Drizzle ORM. Utilizes hybrid storage (in-memory for development, PostgreSQL for production).
- **Cloud Database**: Google Cloud Platform with separate database isolation:
  - **General App Data**: Firestore collection for social feed posts, user interactions, and market data caching (2-minute cache)
  - **BATTU Trading Data**: Dedicated Google Cloud database with isolated collections for scanner sessions, pattern detections, trade executions, and historical analysis results stored in Cloud Storage
- **API Design**: RESTful endpoints with JSON responses and centralized error handling.
- **Data Flow**: Frontend requests via React Query, processed by Express interacting with the storage layer. Polling is used for real-time updates.
- **Core Logic**:
    - **BATTU Scanner**: Continuously scans symbols and detects 1-3, 1-4, 2-3, 2-4 patterns, recording them to the database and executing trades.
    - **Timeframe Management**: Supports dynamic timeframe doubling (up to 80 minutes) and progressive analysis based on 6-candle completion.
    - **Candle Analysis**: Uses 1-minute precision data for slope calculations, Point A/B extraction, and 5th/6th candle predictions.
    - **Cycle 3 Real-Time Validation**: Tracks 1-minute data for accurate breakout monitoring and precise timestamp detection of breakouts within 1-minute candles.
    - **Stop Loss Logic**: Implements trigger-based stop loss where the 5th candle trigger uses the 4th candle high/low, and the 6th candle trigger uses the 5th candle high/low.
    - **Timestamp Synchronization**: Correctly handles historical vs. current timestamps to determine appropriate timeframe progression without getting stuck on completed timeframes.
    - **Date-Based Data Source Separation**: Distinguishes between historical dates (using only complete historical data) and the current date (combining historical data with live data for Cycle 3 validation).
    - **Unified Button Interface**: A single button system handles both historical data completion and live monitor activation, progressing sequentially from historical patterns to live monitoring.
    - **Live Monitor Continuation Logic**: Ensures the live monitor seamlessly continues from where historical timeframes completed.
    - **Backend Trade Closure**: Implements logic to close positions for completed historical patterns, preventing live data interaction with historical analyses.
    - **Strict Data Source Separation**: Ensures complete isolation between historical non-live market data and current live market data.
    - **Smart Data Availability Detection**: Intelligently detects available data for current dates, enabling historical + live data combination when sufficient data is available.
    - **Exchange-Specific Market Hours Support**: Supports dynamic market hours for different exchanges (e.g., NSE/BSE, MCX Gold futures) for accurate data filtering.
    - **Historical Data Fetching**: Ensures correct date-specific data retrieval for historical analysis.
    - **6th Candle Trade Closure**: Uses historical 6th candle timestamp for trade closure in historical data analysis.
    - **Sequential Processing**: Implements sequential processing where historical data completion occurs first, followed by live monitoring, preventing system overload.
    - **Trade Simulation Accuracy**: Prevents double-counting in trade simulations by checking for active scanners during pattern conversion.
    - **Architectural Change**: The system now functions purely as a historical analysis tool, treating all dates (including current) as historical data to simplify progression and eliminate dual-mode complexity.
    - **Critical Breakout Timing Fix (Aug 16, 2025)**: Fixed major timing flaw where breakout orders were placed at market open (9:15 AM) instead of actual 5th/6th candle completion times. Now uses 5th/6th candle endTime and validates candle completion before allowing breakouts. Prevents premature order placement and ensures authentic 4 Candle Rule compliance.
    - **Point B Timestamp Order Issue Fix (Aug 16, 2025)**: Resolved critical flaw where orders were placed immediately after Point B timestamp completion (4th candle close) with 34% time validation, instead of waiting for actual 5th/6th candle breakouts. System now only places orders when real candle breakouts occur, not based on Point B timing calculations. Eliminates false breakout signals triggered by timing validation rather than actual price breakouts.
    - **Cycle 3 Exact Breakout Timing Implementation (Aug 16, 2025)**: Implemented precise 1-minute breakout monitoring that tracks the exact moment when 5th/6th candles break the Point B breakout level. System now scans through 1-minute OHLC data to identify the specific minute and timestamp when price crosses the breakout threshold, providing authentic timing instead of approximated candle completion times. Displays exact breakout time and price from real market data with minute-level precision.
    - **5th Candle Pattern Record Component**: Added new Record window component for tracking 5th candle pattern triggers in real-time. Displays "Up-1-3, Down-1-4 → 5th Up1-3 (40min)" format patterns with accuracy calculations and trigger validation.
    - **Scanner Tab Implementation (Sep 11, 2025)**: Added comprehensive Scanner tab to Trading Master interface featuring interactive chart analysis functionality with real-time point selection on candlestick charts and intelligent pattern analysis display. Includes green point selection interface matching reference specifications, Recharts line chart visualization that updates based on selected points, comprehensive point management controls, and stable parent-child component integration with optimized performance and proper callback wiring.
    - **Advanced BATTU AI Stock Analysis Integration (Sep 7, 2025)**: Enhanced the BATTU AI chatbot in Trading Master tab to intelligently handle real stock price queries and fundamental analysis requests. The AI now automatically detects stock-related questions (e.g., "reliance price", "HDFC analysis") and fetches live stock data including current price, volume, market cap, P/E ratio, financial health metrics, and market sentiment. Responses are formatted in conversational, human-readable format with proper risk disclaimers, making the AI the comprehensive #1 BATTU trading assistant.
    - **Complete Deep Pattern Analysis Removal (Aug 10, 2025)**: All deep pattern analysis functionality has been completely removed from both backend and frontend. This includes `performDeepTAnalysis`, `performInternalPatternAnalysis`, recursive pattern functions, and the Deep Pattern Analysis Window component. The system now has a clean slate ready for new implementation using authentic Point A/B Analysis (4 Candle Rule Methodology) with real 1-minute data.
    - **Authentic C2 Block Internal Pattern Analysis Integration (Aug 11, 2025)**: Completely replaced virtual candle creation system with authentic Point A/B Analysis (4 Candle Rule Methodology). The new `authentic-c2-block-analyzer.ts` fetches REAL 1-minute data from Fyers API, applies genuine 4-candle rule patterns (1-3, 1-4, 2-3, 2-4), and creates authentic OHLC candles from real market data. Zero virtual/fake data - 100% synchronized with main pattern Point A/B methodology. Updated C2 Block Analysis API endpoint and UI to display authentic data usage.
    - **Comprehensive Timeframe Pattern Recording**: Records patterns across all timeframes (5min to 80min) and tracks incomplete candle metadata for debugging data extraction issues.
    - **Analysis Summary Date Range Mode Display Fix**: Fixed Analysis Summary window not displaying in date range mode by removing conditional hiding logic that prevented comprehensive pattern analysis, trade results, and performance metrics from showing during multi-date scanning operations.
    - **Order Management**: Comprehensive stop-limit order system with quantity calculations based on pattern type and risk management, with automatic order placement.
    - **Validation Rules**: Implements strict timing rules, invalidation penalties, and dual validation for block formation.
    - **Recursive Fractal Analysis**: Supports multi-timeframe recursive analysis for deeper pattern insights.
    - **BATTU API 6-Scenario Exit System (Aug 18, 2025)**: Implements comprehensive exit strategy with validated scenarios:
        * **Scenario A**: Fast Trending - Real-time slope value exceeds current price for momentum capture
        * **Scenario B**: 80% Target Achievement - Secures most projected profit at 80% of full candle projection
        * **Scenario C**: Market Close Protection - 95% candle duration completion or market close prevents overnight risk  
        * **Scenario D**: Risk Management Stop Loss - Uses 4th/5th candle extremes per 4 Candle Rule methodology
        * **Scenario E**: Target-Based Risk Elimination - At 50% of 100% target projection, moves stop to entry for risk-free position
        * **Scenario F**: Duration-Based Dynamic Stop Loss - At 50% candle duration, uses recent candle extremes (LOW for LONG, HIGH for SHORT) for trailing stop
    - **375 Candle Filter Removal (Aug 27, 2025)**: Completely removed the 375 candle limitation that was restricting historical data display to market hours (9:15 AM to 3:30 PM = 375 minutes). Historical Data tab now fetches and displays complete date range data without artificial limits. System can now process multi-day date ranges and continue fetching data beyond single-day market session limits.

### Feature Specifications
- Real-time Fyers API connectivity monitoring.
- Live market data streaming.
- Comprehensive BATTU scanner for pattern detection and trade execution.
- Advanced stop-limit order system with precise risk management.
- Dynamic parameter support for historical data analysis.
- Ultra-fast historical breakout simulation.
- Market-aware API system with dynamic market opening detection.
- Accurate pattern naming and slope calculations.
- Dual-formula exit system.
- Fully automated market-to-close scanner.
- Interactive trading chart with dual zoom controls and all 14 timeframes.
- Visual trendline charts with 6th candle extension and breakout line visualization.
- Scanner chart analysis with interactive point selection and pattern recognition display.

## External Dependencies

- **Fyers API v3.0.0**: For live market data streaming, historical data fetching, and order execution.
- **PostgreSQL**: Primary database for persistent storage.
- **Neon Database**: Serverless PostgreSQL hosting platform.
- **Google Cloud Platform**: Ultra-fast data storage and retrieval system with separate databases for general app data and BATTU trading data isolation.
- **Google Cloud Firestore**: Real-time NoSQL database for social feed posts, pattern analysis, and BATTU trading data.
- **Google Cloud Storage**: High-performance file storage for historical analysis results and large datasets.
- **Radix UI**: Headless component primitives for UI.
- **Lucide React**: Icon library.
- **Date-fns**: Date manipulation utility.
- **TanStack Query (React Query)**: For server state management and data fetching.