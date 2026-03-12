# MAIN HOME SCREEN BACKUP
## Created: November 25, 2025

This file contains the complete backup of the main home screen (trading-home tab) from home.tsx.

## What is included:
1. **WorldMap Component** - Interactive global market map
2. **Welcome Message** - "Welcome to Trading Platform" header with Sparkles icon
3. **AI Search Bar** - Search input with AI-powered assistance
4. **AI Search Results** - Dynamic search results display with charts
5. **Navigation Buttons** - Quick access buttons:
   - Technical Analysis (Cyan)
   - Social Feed (Pink)
   - Market News (Green)
   - Trading Journal (Indigo)
   - Fundamentals (Orange)
6. **Three Feature Cards**:
   - Social Feed Card (Blue) - Links to voice/social feed
   - Trading Master Card (Indigo/Purple) - Links to trading master
   - Journal Card (Green/Emerald) - Links to trading journal
7. **Swipeable Tech News Cards** - SwipeableCardStack component
8. **Floating Tutor Button** - Animated AI Tutor access button
9. **Mobile Responsive Layout** - Complete mobile and desktop layouts

## Line Numbers in Original File:
- **Start Line**: 7664
- **End Line**: 8569
- **Total Lines**: ~905 lines

## Dependencies Required:
- WorldMap component (from '@/components/WorldMap')
- SwipeableCardStack component
- Lucide React icons: Sparkles, Bot, MessageCircle, Activity, BarChart3, X, ChevronUp, etc.
- Shadcn UI components: Input, Button
- React state hooks for search functionality

## State Variables Used:
- searchQuery
- isSearchActive
- searchResults
- isSearchLoading
- selectedSector
- currentCardIndex
- showTutorOverlay
- isNavOpen

## Key Functions Referenced:
- handleSearch()
- handleSuggestionClick()
- generateJournalAIReport()
- checkAuthAndNavigate()
- handleTradingMasterAccess()
- setTabWithAuthCheck()
- handleSectorChange()

## Purpose:
This backup ensures we can safely remove other tabs without affecting the main home screen.
The home screen is the default landing page that users see when they visit the trading platform.

## Notes:
- The layout is fully responsive with different mobile and desktop versions
- Mobile version has horizontal swipe navigation for news cards
- Desktop version shows all cards in a grid layout
- Search functionality integrates with AI for intelligent responses
- All interactive elements have proper authentication checks
