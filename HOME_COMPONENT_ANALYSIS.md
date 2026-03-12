# Home.tsx Component Analysis & Splitting Guide

**File Size:** 23,055 lines (VERY LARGE - needs refactoring!)

---

## Main Component Structure

### 1. **VOICE TAB (Audio/Social Feed)**
- **Start Line:** 11282
- **JSX Return:** `return (<main className="h-screen w-full">...)`
- **Content:** NeoFeedSocialFeed component (line 11287)
- **Status:** Separate return statement already - can extract easily!

```tsx
if (activeTab === "voice") {
  return (
    <main className="h-screen w-full">
      <NeoFeedSocialFeed onBackClick={() => setTabWithAuthCheck("trading-home")} />
    </main>
  )
}
```

---

### 2. **TUTOR TAB**
- **Start Line:** 11294
- **Content:** Educational/tutor interface
- **Status:** Separate return statement - can extract

---

### 3. **MAIN COMPONENT RETURN (Dashboard/Trading Home)**
- **Start Line:** 12232
- **Main Return Statement:** Large component with multiple tabs
- **Sidebar Navigation:** Lines 12237-12382

---

## Tab Contents (Inside Main Return)

### 3a. **DASHBOARD TAB** 
- **Line:** 12388
- **Condition:** `{activeTab === 'dashboard' && localStorage.getItem('currentUserEmail') === 'chiranjeevi.perala99@gmail.com' && (`
- **Content:** Admin dashboard (restricted to specific email)
- **Status:** Optional - can extract

---

### 3b. **TRADING HOME TAB** ⭐ (Largest - Contains Most Sections)
- **Start Line:** 12438
- **Condition:** `{activeTab === "trading-home" && (`
- **End Line:** ~15030 (before backtest tab)

#### Contents of Trading Home:

**3b-i. WORLD MAP SECTION**
- **Line:** 12731
- **Component:** `<WorldMap />`
- **Contains:** World map with market data visualization
- **Status:** Already a separate imported component - just extract usage

**3b-ii. SEARCH BAR SECTION**
- **Start Line:** 12769 (approx)
- **Content:** Large search/input section with AI integration
- **Contains:** 
  - Search input field
  - Suggestion buttons
  - Search results display
  - AI response handling
- **Est. Length:** 2000-3000 lines

**3b-iii. TAB BUTTONS SECTION**
- **Lines:** 12850-12900 (approx)
- **Content:** Button row for:
  - Watchlist
  - Market News
  - Social Feed
  - Trading Journal
  - Trade Challenge
- **Status:** Simple button group - easy to extract

**3b-iv. WATCHLIST SECTION**
- **Approximate Start:** Line 13000-14000
- **Content:**
  - Watchlist management
  - Stock search
  - Price tracking
  - News for selected stock
  - Quarterly data display
- **Est. Length:** 2000+ lines

**3b-v. SOCIAL FEED PREVIEW SECTION**
- **Approximate Lines:** 14100-14300
- **Content:** Card showing latest social feed posts
- **Status:** Uses NeoFeedSocialFeed component

**3b-vi. TRADING MASTER PREVIEW SECTION**
- **Approximate Lines:** 14300-14500
- **Content:** Card preview for Trading Master
- **Status:** Direct link to full Trading Master tab

**3b-vii. JOURNAL PREVIEW SECTION**
- **Approximate Lines:** 14500-14700
- **Content:** Card preview for Journal
- **Status:** Direct link to full Journal tab

**3b-viii. TECH NEWS SIDEBAR**
- **Approximate Lines:** 14100-14634
- **Content:** News carousel on the right
- **Status:** Independent section - easy to extract

---

### 3c. **BACKTEST TAB**
- **Start Line:** 15030
- **Condition:** `{activeTab === "backtest" && (`
- **Content:** Backtesting interface
- **Status:** Separate section - can extract

---

### 3d. **TRADING MASTER TAB** ⭐
- **Start Line:** 15098
- **Condition:** `{activeTab === "trading-master" && (`
- **Component:** `<TradingMaster />`
- **Content:** Full trading charts and analysis
- **Est. Length:** 3000+ lines
- **Status:** Uses separate component - usage starts at 15110

---

### 3e. **JOURNAL TAB** ⭐
- **Start Line:** 15114
- **Condition:** `{activeTab === "journal" && (`
- **Est. End:** ~21794
- **Content:**
  - Journal UI controls
  - Chart display (manual search + heatmap)
  - Journal entries table
  - Performance metrics
  - Paper trading section
- **Est. Length:** 6000+ lines!
- **Status:** This is the largest single section

#### Journal Sub-sections:
- **Journal Chart Controls:** Lines 15145-15850
- **Search Chart Section:** Lines 15837-15900
- **Heatmap Section:** Lines 15901-16000
- **Paper Trading Panel:** Lines 16071-16500
- **Journal Entries & Analytics:** Lines 16500-21794

---

### 3f. **MOBILE PAPER TRADE TAB**
- **Start Line:** 21880
- **Condition:** `{activeTab === "journal" && mobileBottomTab === "paper-trade" && (`
- **Content:** Mobile-specific paper trading interface

---

## AUDIO MINICAST SECTION
- **Location:** Need to search more specifically
- **Likely in:** Social feed or separate section
- **Status:** Appears to be integrated into social feed

---

## Recommended Refactoring Order

### Phase 1: Easy Wins (Separate Return Statements)
1. ✅ **Voice/Social Feed Tab** (Line 11282) → Extract to `pages/voice.tsx`
2. ✅ **Tutor Tab** (Line 11294) → Extract to `pages/tutor.tsx`

### Phase 2: Component Extraction (Already Imported)
1. ✅ **WorldMap** (Line 12731) → Already in `components/world-map.tsx`
2. ✅ **TradingMaster** (Line 15110) → Already in `components/trading-master.tsx`

### Phase 3: Large Sections to Extract
1. **Journal Tab** (Lines 15114-21794) → Extract to `pages/journal.tsx` (6000+ lines!)
2. **Backtest Tab** (Line 15030+) → Extract to `pages/backtest.tsx`
3. **Dashboard Tab** (Line 12388) → Extract to `pages/dashboard.tsx` (optional)

### Phase 4: Within Trading Home
1. **Search Section** (Lines 12769+) → Extract to `components/trading-home-search.tsx`
2. **Watchlist Section** (Lines ~13000+) → Extract to `components/trading-home-watchlist.tsx`
3. **Tab Buttons** (Lines ~12850) → Extract to `components/trading-home-tabs.tsx`
4. **Tech News Sidebar** (Lines ~14100) → Extract to `components/tech-news-sidebar.tsx`

---

## Approximate Line Breakdown

| Section | Start | End | Est. Lines |
|---------|-------|-----|-----------|
| Imports & Hooks | 1 | 570 | 570 |
| Utility Functions | 570 | 12230 | 11,660 |
| Voice Tab Return | 11282 | 11292 | 10 |
| Tutor Tab Return | 11294 | ~11700 | 400 |
| Main Component | 12232 | 23055 | 10,823 |
| - Dashboard (inside) | 12388 | ~12438 | 50 |
| - Trading Home (inside) | 12438 | ~15030 | 2,592 |
| - Backtest (inside) | 15030 | ~15098 | 68 |
| - Trading Master (inside) | 15098 | ~15114 | 16 |
| - Journal (inside) | 15114 | ~21794 | 6,680 |
| - Mobile Paper Trade | 21880+ | 23055 | 1,175 |

---

## Critical Finding

⚠️ **The Journal section alone is 6,680+ lines!** This must be extracted first.

---

## Next Steps

1. **Start with Journal extraction** (biggest impact)
2. Extract tab-level components next
3. Then break down internal sections

Would you like me to help extract any specific section first?
