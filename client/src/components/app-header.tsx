import { useQuery } from "@tanstack/react-query";
import { BarChart3, Settings } from "lucide-react";
import type { ApiStatus } from "@shared/schema";

export function AppHeader() {
  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-slate-800/95 via-blue-900/80 to-indigo-900/85 backdrop-blur-md shadow-2xl border-b-2 border-cyan-400/30">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-cyan-400/50">
                <BarChart3 className="text-white drop-shadow-sm" size={18} />
              </div>
              <h1 className="text-xl font-bold text-white drop-shadow-lg">CB Connect</h1>
            </div>
            <div className="hidden sm:block h-6 w-px bg-cyan-400/40"></div>
            <span className="hidden sm:inline-block text-sm text-cyan-200/90 font-medium">Fyers API Dashboard</span>
          </div>

          {/* API Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-black/30 px-4 py-2 rounded-lg border border-cyan-400/30 backdrop-blur-sm">
              <div className={`w-3 h-3 rounded-full shadow-lg ${
                apiStatus?.connected ? 'bg-emerald-400 animate-pulse ring-2 ring-emerald-400/50' : 'bg-red-400 ring-2 ring-red-400/50'
              }`}></div>
              <span className="text-sm font-bold text-white drop-shadow-sm">
                {apiStatus?.connected ? 'API Connected' : 'API Disconnected'}
              </span>
            </div>
            <button className="p-2 text-cyan-300 hover:text-white hover:bg-cyan-400/20 transition-all border border-cyan-400/30 hover:border-cyan-400/60 rounded-lg backdrop-blur-sm">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
