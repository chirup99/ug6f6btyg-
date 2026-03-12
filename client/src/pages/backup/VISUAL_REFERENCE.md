# MAIN HOME SCREEN - VISUAL REFERENCE
## Based on Image: attached_assets/image_1764043777459.png

This document maps the visual elements from your screenshot to the code components.

---

## 📍 TOP SECTION - WORLD MAP (31vh on Desktop, 25vh on Mobile)
**Background**: White (#ffffff) on Desktop (Light mode), #1a1a1a (Dark mode)

```
┌─────────────────────────────────────────────────────┐
│  🌍 WORLD MAP - Interactive Globe                   │
│  Shows: USA, CANADA, INDIA, HONG KONG, TOKYO       │
│  With market indicators (+0.09%, +0.03%, etc.)     │
└─────────────────────────────────────────────────────┘
```
**Component**: `<WorldMap />`
**Location**: Lines 7694-7699 in home.tsx

---

## 📍 MIDDLE SECTION - WELCOME & SEARCH (Blue Background #1e40af)

### Welcome Header
```
✨ Welcome to Trading Platform
```
**Component**: Sparkles icon + h1 heading
**Location**: Lines 7704-7711
**Styling**: text-2xl font-normal text-gray-100

### Search Bar (Desktop Only)
```
┌──────────────────────────────────────────────────────┐
│ 🔍 Search stocks, technical analysis, social feed... │
└──────────────────────────────────────────────────────┘
```
**Component**: Shadcn Input with AI Bot button
**Location**: Lines 7714-7751
**Features**: 
- Expands on focus
- AI-powered search results
- Real-time suggestions

### Navigation Buttons (5 Pill-Shaped Buttons)
```
┌──────────────────────────────────────────────────────────┐
│ [Technical Analysis] [Social Feed] [Market News]        │
│ [Trading Journal] [Fundamentals]                         │
└──────────────────────────────────────────────────────────┘
```
**Location**: Lines 7943-8061
**Colors**:
- Technical Analysis: Cyan (bg-cyan-600)
- Social Feed: Pink (bg-pink-600)
- Market News: Green (bg-green-600)
- Trading Journal: Indigo (bg-indigo-600)
- Fundamentals: Orange (bg-orange-600)

---

## 📍 CARDS SECTION - WHITE CONTAINER

### Desktop Layout (4 Columns)
```
┌────────────────────────────────────────────────────────────┐
│  [Social Feed]  [Trading Master]  [Journal]  [Tech News]  │
│   💬 Blue       ⚡ Indigo        📊 Green    📰 Card      │
└────────────────────────────────────────────────────────────┘
```

### Mobile Layout (3 Cards + Swipeable)
```
┌──────────────────────────────────┐
│ [Social] [Master] [Journal]      │
│   💬       ⚡       📊           │
│                                  │
│    [Swipeable Tech News Card]    │
│    📰 Latest in technology       │
│    • • • • • • (6 dots)         │
└──────────────────────────────────┘
```

### Card 1: Social Feed
- **Color**: Blue (#3b82f6)
- **Icon**: MessageCircle
- **Label**: "Social Feed"
- **Action**: Navigate to voice tab
- **Location**: Lines 8240-8254 (Desktop), 8305-8319 (Mobile)

### Card 2: Trading Master
- **Color**: Indigo (#6366f1) on Desktop, Purple (#a855f7) on Mobile
- **Icon**: Activity (heartbeat/pulse)
- **Label**: "Trading Master"
- **Action**: handleTradingMasterAccess()
- **Location**: Lines 8257-8271 (Desktop), 8322-8336 (Mobile)

### Card 3: Journal
- **Color**: Emerald (#10b981) on Desktop, Green (#22c55e) on Mobile
- **Icon**: BarChart3
- **Label**: "Journal"
- **Action**: Navigate to journal tab
- **Location**: Lines 8274-8288 (Desktop), 8339-8353 (Mobile)

### Card 4: Tech News (Swipeable Card Stack)
- **Component**: SwipeableCardStack
- **Features**: 
  - 6 different cards (indicated by navigation dots)
  - Swipe left/right to navigate
  - Shows tech news content
- **Location**: Lines 8291-8298 (Desktop), 8357-8364 (Mobile)
- **Navigation Dots**: Lines 8368-8386

---

## 📍 BOTTOM SECTION - FLOATING TUTOR BUTTON

```
        ┌──────────┐
        │    ⬆️    │  Animated floating button
        │  Tutor   │  with pulse/ping effects
        └──────────┘
```

**Component**: Gradient Button with ChevronUp icon
**Location**: Lines 8390-8405
**Styling**: 
- Size: 16x16 (w-16 h-16)
- Gradient: violet-600 to indigo-600
- Animations: ping, pulse, bounce
- Border: 4px white/20% opacity

---

## 🎨 COLOR SCHEME

### Background Colors:
- World Map Section: `#ffffff` (Light mode), `#1a1a1a` (Dark mode)
- Blue Section: `#1e3a8a` (bg-blue-900)
- White Container: `#ffffff`

### Card Colors:
- Social Feed: `#3b82f6` (Blue 500)
- Trading Master: `#6366f1` (Indigo 500) / `#a855f7` (Purple 500 mobile)
- Journal: `#10b981` (Emerald 500) / `#22c55e` (Green 500 mobile)

### Navigation Button Colors:
- Technical Analysis: `#0891b2` (Cyan 600)
- Social Feed: `#db2777` (Pink 600)
- Market News: `#16a34a` (Green 600)
- Trading Journal: `#4f46e5` (Indigo 600)
- Fundamentals: `#ea580c` (Orange 600)

---

## 📱 RESPONSIVE BEHAVIOR

### Desktop (md: breakpoint and above):
- World Map: 31vh height
- Blue Section: 69vh height
- Cards: 4-column grid layout
- Search bar: Always visible
- Welcome text: Always visible
- All buttons visible

### Mobile:
- World Map: 25vh height (h-1/4)
- Blue Section: 75vh height
- Cards: 3-column row + swipeable card below
- Search bar: Positioned at top of white container
- Welcome text: Moved to blue section, smaller size
- Navigation dots visible for card navigation

---

## 🔗 KEY INTERACTIONS

1. **Search Bar**: 
   - Focus → Expands and shows AI results panel
   - Enter key → Triggers AI search
   - Bot button → Same as Enter key

2. **Navigation Buttons**:
   - Each button triggers handleSuggestionClick() with preset query

3. **Feature Cards**:
   - Desktop: Hover scale (105%)
   - Mobile: Active scale (95%)
   - All cards check authentication before navigation

4. **Tutor Button**:
   - Multiple animation layers (ping, pulse, bounce)
   - Navigates to tutor tab with auth check
   - Fixed position at screen bottom

5. **Swipeable Cards**:
   - Left/right swipe on mobile
   - Navigation dots show current position (6 total cards)
   - Clicking dots jumps to that card

---

## 📦 DEPENDENCIES

### Components:
- `<WorldMap />` - From '@/components/WorldMap'
- `<SwipeableCardStack />` - Card carousel component
- `<Input />` - From '@/components/ui/input'
- `<Button />` - From '@/components/ui/button'

### Icons (Lucide React):
- `Sparkles` - Welcome header
- `Bot` - AI search button
- `MessageCircle` - Social Feed card
- `Activity` - Trading Master card
- `BarChart3` - Journal card & Technical Analysis
- `ChevronUp` - Tutor button
- `X` - Close/Clear buttons
- `Newspaper` - Market News
- `FileText` - Trading Journal
- `User` - Social Feed button

---

## ✅ BACKUP STATUS
- **File**: `trading-home-tab-content.tsx.backup`
- **Size**: 53KB
- **Lines**: 905 lines (7664-8569)
- **Created**: November 25, 2025
- **Purpose**: Safe backup before removing other tabs

---

## 🚨 IMPORTANT NOTES

1. **Do NOT modify** this backup unless absolutely necessary
2. **Always check** this reference before making changes to home screen
3. **Mobile nav dots** are positioned absolutely outside white container
4. **Hamburger menu** (mobile only) is positioned at top-right
5. **All auth checks** use checkAuthAndNavigate() or setTabWithAuthCheck()
6. **Search state** is managed by multiple useState hooks
7. **Theme-aware** - Different backgrounds for light/dark modes

---

This backup preserves the complete main home screen exactly as shown in your image!
