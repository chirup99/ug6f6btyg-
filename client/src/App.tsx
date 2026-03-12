import React, { useState, useEffect } from "react";

// Global window type declarations for tab state management
declare global {
  interface Window {
    getActiveTab?: () => string;
    setActiveTab?: (tab: string) => void;
    stopNewsAudio?: () => void;
    toggleNav?: () => void;
  }
}
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Home as HomeIcon, BarChart3, Sun, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Code, 
  PenTool, 
  Target, 
  BookOpen, 
  Grid3X3,
  Send,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Dashboard from "@/pages/home";
import Landing from "@/pages/landing";
import PrivacyPolicy from "@/pages/privacy";
import NotFound from "@/pages/not-found";
import PublicHeatmap from "@/pages/public-heatmap";
import SharedReport from "@/pages/shared-report";
import TradingJournalDemo from "@/pages/trading-journal-demo";
import MarketNews from "@/pages/market-news";
import NeoFeedSocialFeed from "@/components/neofeed-social-feed";
import ZerodhaDebug from "@/pages/zerodha-debug";
import { AngelOneGlobalAutoConnect } from "@/hooks/useAngelOneAutoconnect";
import { getCognitoToken, getCognitoUser, initializeCognito } from "@/cognito";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// New Home Page Component
function NewHome() {
  const [searchQuery, setSearchQuery] = useState("");
  const { getUserDisplayName } = useCurrentUser();
  const displayName = getUserDisplayName().split(' ')[0];

  const actionButtons = [
    {
      name: "Research",
      icon: Search,
      color: "bg-gray-700 hover:bg-gray-600 text-gray-200",
      description: "Search and analyze",
    },
    {
      name: "Claude Sonnet 4",
      icon: null,
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      description: "AI assistance",
      badge: "1",
    },
    {
      name: "Code",
      icon: Code,
      color: "bg-gray-700 hover:bg-gray-600 text-gray-200",
      description: "Programming help",
    },
    {
      name: "Write",
      icon: PenTool,
      color: "bg-green-600 hover:bg-green-700 text-white",
      description: "Content creation",
    },
    {
      name: "Strategize",
      icon: Target,
      color: "bg-purple-600 hover:bg-purple-700 text-white",
      description: "Plan and organize",
    },
    {
      name: "Learn",
      icon: BookOpen,
      color: "bg-orange-600 hover:bg-orange-700 text-white",
      description: "Educational content",
    },
    {
      name: "From your apps",
      icon: Grid3X3,
      color: "bg-pink-600 hover:bg-pink-700 text-white",
      description: "App integrations",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full space-y-8 sm:space-y-12">
        {/* Greeting */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal text-gray-100">
              What's new, {displayName}?
            </h1>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-3xl mx-auto">
          <Input
            placeholder="How can I help you today?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 sm:h-14 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 pr-12 text-base sm:text-lg rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Button
            size="sm"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-gray-300"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
          {actionButtons.map((button, index) => (
            <Button
              key={index}
              variant="secondary"
              className={`${button.color} border-0 h-10 sm:h-11 px-3 sm:px-4 rounded-full font-medium transition-all duration-200 relative text-sm sm:text-base`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                {button.icon && <button.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                <span className="whitespace-nowrap">{button.name}</span>
                {button.badge && (
                  <Badge variant="secondary" className="bg-white text-blue-600 ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold">
                    {button.badge}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  // Passcode protection state
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isDashboardAuthenticated, setIsDashboardAuthenticated] = useState(false);

  // Store scroll position and tab state for different routes
  const scrollPositions = React.useRef<Record<string, number>>({});
  const tabStates = React.useRef<Record<string, string>>({});

  // Save scroll position and tab state before navigating away
  const saveScrollPosition = (currentPath: string) => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    scrollPositions.current[currentPath] = scrollY;
    
    // Save active tab state for home page
    if (currentPath === "/" && window.getActiveTab) {
      const currentTab = window.getActiveTab();
      tabStates.current[currentPath] = currentTab;
      console.log("💾 Saved tab state:", currentTab, "for path:", currentPath);
    }
  };

  // Restore scroll position and tab state after navigation
  const restoreScrollPosition = (newPath: string) => {
    const savedPosition = scrollPositions.current[newPath];
    const savedTab = tabStates.current[newPath];
    
    console.log("🔄 Restoring for path:", newPath, "- savedTab:", savedTab, "savedPosition:", savedPosition);
    
    if (savedPosition !== undefined) {
      // Use a small delay to ensure the content is rendered
      setTimeout(() => {
        window.scrollTo(0, savedPosition);
      }, 50);
    }
    
    // Restore active tab for home page
    if (newPath === "/" && savedTab && window.setActiveTab) {
      console.log("📍 Restoring tab:", savedTab);
      setTimeout(() => {
        window.setActiveTab?.(savedTab);
        console.log("✅ Tab restored to:", savedTab);
      }, 150);
    }
  };

  // Handle passcode submission
  const handlePasscodeSubmit = () => {
    if (passcodeInput === '1302') {
      setIsDashboardAuthenticated(true);
      setShowPasscodeModal(false);
      setPasscodeInput('');
      handleNavigation('/dashboard');
    } else {
      setPasscodeInput('');
      // Could add error feedback here
    }
  };

  // Handle navigation with scroll preservation
  const handleNavigation = (newPath: string) => {
    // Save current scroll position
    saveScrollPosition(location);
    
    // For main navigation buttons (Home/Trading), reset to default tab
    if (newPath === "/app" || newPath === "/trading") {
      // Clear saved tab state to force default tab
      delete tabStates.current[newPath];
      console.log("🏠 Cleared tab state for main navigation to:", newPath);
      
      // Force reset to default tab immediately
      if (window.setActiveTab) {
        setTimeout(() => {
          window.setActiveTab?.("trading-home");
          console.log("🔄 Force reset to trading-home tab");
        }, 50);
      }
    }
    
    // For dashboard navigation button, activate dashboard tab
    if (newPath === "/dashboard") {
      // Clear saved tab state and set to dashboard
      delete tabStates.current[newPath];
      console.log("📊 Cleared tab state for dashboard navigation to:", newPath);
      
      // Force set to dashboard tab immediately
      if (window.setActiveTab) {
        setTimeout(() => {
          window.setActiveTab?.("dashboard");
          console.log("📊 Force set to dashboard tab");
        }, 50);
      }
    }
    
    // Navigate to new path
    setLocation(newPath);
    
    // Restore scroll position for the new path
    restoreScrollPosition(newPath);
  };

  const { currentUser, getUserDisplayName, isLoggedIn } = useCurrentUser();
  const currentUserDisplayName = getUserDisplayName();
  
  const navigation = [
    {
      name: "Home",
      href: "/app",
      icon: HomeIcon,
      current: location === "/app",
    },
    {
      name: "Theme",
      href: "#",
      icon: theme === 'dark' ? Sun : Moon,
      current: false,
      isThemeToggle: true,
    },
    {
      name: "Profile",
      href: "#",
      icon: null,
      current: false,
      isProfile: true,
      displayName: currentUserDisplayName,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Desktop: Fixed Vertical Navigation (hidden on mobile) */}
      <div className={cn(
        "hidden md:flex fixed right-0 top-0 w-20 h-full bg-gray-950 border-l border-gray-800 flex-col items-center py-6 space-y-6 z-[100] transition-transform duration-300 group",
        location === "/voice" ? "translate-x-[calc(100%-4px)] hover:translate-x-0" : "translate-x-full hover:translate-x-0"
      )}>
        {/* Invisible trigger area that stays on screen to detect hover */}
        <div className="absolute right-0 top-0 w-4 h-full -left-4" />
        {navigation.map((item) => {
          if (item.isProfile) {
            return (
              <Button
                key={item.name}
                variant="ghost"
                size="default"
                className={cn(
                  "w-12 h-12 p-0 rounded-xl transition-all duration-200 flex items-center justify-center overflow-visible",
                  "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
                title={item.name}
                onClick={() => {
                  if (window.toggleNav) {
                    window.toggleNav();
                  }
                }}
                data-testid="button-profile-menu-toggle"
              >
                <Avatar className="w-10 h-10 rounded-lg border border-white/10">
                  <AvatarImage src={currentUser?.profilePicUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold text-sm rounded-lg">
                    {currentUserDisplayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            );
          }
          
          const Icon = item.icon;
          if (!Icon) return null;
          
          return (
            <Button
              key={item.name}
              variant="ghost"
              size="default"
              className={cn(
                "w-12 h-12 p-0 rounded-xl transition-all duration-200",
                item.current
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
              onClick={() => {
                if (item.isThemeToggle) {
                  toggleTheme();
                } else if (item.href === '/dashboard' && !isDashboardAuthenticated) {
                  setShowPasscodeModal(true);
                } else {
                  handleNavigation(item.href);
                }
              }}
              title={item.name}
            >
              <Icon className="h-6 w-6" />
            </Button>
          );
        })}
      </div>

      {/* Main Content - responsive margin/padding */}
      <div className="min-h-screen">
        {children}
      </div>

      {/* Passcode Modal */}
      <Dialog open={showPasscodeModal} onOpenChange={setShowPasscodeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Passcode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter passcode"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePasscodeSubmit();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasscodeModal(false);
                  setPasscodeInput('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handlePasscodeSubmit}>
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/app">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/dashboard">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/trading">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/trading-master">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/voice">
        <MainLayout>
          <NeoFeedSocialFeed />
        </MainLayout>
      </Route>
      <Route path="/journal-demo">
        <MainLayout>
          <TradingJournalDemo />
        </MainLayout>
      </Route>
      <Route path="/home" component={NewHome} />
      <Route path="/share/:userId" component={PublicHeatmap} />
      <Route path="/share/heatmap/:userId" component={PublicHeatmap} />
      <Route path="/shared/:reportId" component={SharedReport} />
      <Route path="/market-news" component={MarketNews} />
      <Route path="/zerodha-debug" component={ZerodhaDebug} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initializeCognito();
    
    const checkCognitoUser = async () => {
      try {
        const user = await getCognitoUser();
        if (user && user.userId) {
          console.log('👤 [App] User authenticated:', user.email);
          localStorage.setItem('currentUserId', user.userId);
          localStorage.setItem('currentUserEmail', user.email || '');
          localStorage.setItem('currentUsername', user.email || '');
          if (user.displayName) {
            localStorage.setItem('currentDisplayName', user.displayName);
            localStorage.setItem('currentUserName', user.displayName);
          }
          
          // Enhanced: Redirect from auth pages if session active
          const currentPath = window.location.pathname;
          if (currentPath === '/landing' || currentPath === '/login') {
            console.log('🚀 [App] User already authenticated on auth page, redirecting to home...');
            window.location.href = '/';
            return;
          }
          
          const idToken = await getCognitoToken();
          if (idToken) {
            const response = await fetch('/api/user/profile', {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.profile) {
                if (data.profile.username) {
                  localStorage.setItem('currentUsername', data.profile.username);
                }
                if (data.profile.displayName) {
                  localStorage.setItem('currentDisplayName', data.profile.displayName);
                  localStorage.setItem('currentUserName', data.profile.displayName);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('No authenticated user or error:', error);
      }
    };
    
    checkCognitoUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AngelOneGlobalAutoConnect />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
