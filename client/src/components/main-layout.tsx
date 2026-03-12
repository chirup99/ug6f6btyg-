import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, BarChart3, Activity, Settings, Zap } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location, setLocation] = useLocation();

  const navigation = [
    {
      name: "Dashboard", 
      href: "/dashboard",
      icon: BarChart3,
      current: location === "/dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Vertical Navigation */}
      <div className="w-20 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-6 space-y-6">
        {navigation.map((item) => {
          const Icon = item.icon;
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
              onClick={() => setLocation(item.href)}
            >
              <Icon className="h-6 w-6" />
            </Button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}