import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AngelOneStatus,
  AngelOneApiStatistics,
  AngelOneSystemStatus,
  AngelOneLiveMarketPrices,
} from "@/components/auth-button-angelone";

interface TradingDashboardTabProps {
  setActiveTab: (tab: string) => void;
}

export function TradingDashboardTab({ setActiveTab }: TradingDashboardTabProps) {
  const { toast } = useToast();

  // These state vars are only referenced inside {false && ...} dead-code blocks
  const [isAngelOneDialogOpen, setIsAngelOneDialogOpen] = useState(false);
  const [angelOneClientCodeInput, setAngelOneClientCodeInput] = useState("");
  const [angelOneApiKeyInput, setAngelOneApiKeyInput] = useState("");
  const [showAngelOneSecret, setShowAngelOneSecret] = useState(false);
  const upstoxIsConnected = false;
  const zerodhaIsConnected = false;
  const dhanIsConnected = false;
  const handleAngelOneConnect = () => {};

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-orange-400 fill-orange-400" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600">Trading Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground hidden sm:block">Real-time market data via Angel One SmartAPI</p>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => setActiveTab('trading-home')}
            data-testid="button-back-trading-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                          {/* Angel One connect button and dialog removed from dashboard */}
                          {false && (
                            <Button
                              onClick={() => setIsAngelOneDialogOpen(true)}
                              variant="outline"
                              className={`w-full h-10 ${
                                (upstoxIsConnected || zerodhaIsConnected || dhanIsConnected)
                                  ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-50'
                                  : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                              }`}
                              data-testid="button-angelone-dialog"
                              disabled={upstoxIsConnected || zerodhaIsConnected || dhanIsConnected}
                            >
                              <img 
                                src="https://www.angelone.in/wp-content/uploads/2023/10/angel-one-logo.png" 
                                alt="Angel One" 
                                className="h-4 mr-2"
                              />
                              Connect Angel One
                            </Button>
                          )}
                          {false && (
                          <Dialog open={isAngelOneDialogOpen} onOpenChange={setIsAngelOneDialogOpen}>
                              <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-2xl max-h-[90dvh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <img 
                                      src="https://www.angelone.in/wp-content/uploads/2023/10/angel-one-logo.png" 
                                      alt="Angel One" 
                                      className="h-5"
                                    />
                                    Connect Angel One
                                  </DialogTitle>
                                  <DialogDescription>
                                    Enter your Angel One API credentials to link your account.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="clientCode">Client Code</Label>
                                    <Input
                                      id="clientCode"
                                      placeholder="P176266"
                                      value={angelOneClientCodeInput}
                                      onChange={(e) => setAngelOneClientCodeInput(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="apiKey">API Key</Label>
                                    <div className="relative">
                                      <Input
                                        id="apiKey"
                                        type={showAngelOneSecret ? "text" : "password"}
                                        placeholder="Enter your API Key"
                                        value={angelOneApiKeyInput}
                                        onChange={(e) => setAngelOneApiKeyInput(e.target.value)}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowAngelOneSecret(!showAngelOneSecret)}
                                      >
                                        {showAngelOneSecret ? (
                                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-medium text-muted-foreground uppercase">Redirect URL</span>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 px-2 text-[10px]"
                                        onClick={() => {
                                          const url = `${window.location.origin}/api/broker/angelone/callback`;
                                          navigator.clipboard.writeText(url);
                                          toast({ title: "Copied!", description: "Redirect URL copied to clipboard" });
                                        }}
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                    </div>
                                    <code className="text-[10px] break-all text-slate-600 dark:text-slate-400">
                                      {window.location.origin}/api/broker/angelone/callback
                                    </code>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button 
                                    onClick={handleAngelOneConnect} 
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={!angelOneApiKeyInput || !angelOneClientCodeInput}
                                  >
                                    Connect Account
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                {/* Angel One Status - Compact */}
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Status</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <AngelOneStatus />
                  </CardContent>
                </Card>

                {/* Live Market Prices - Compact */}
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Prices</CardTitle>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <AngelOneLiveMarketPrices />
                  </CardContent>
                </Card>

                {/* Angel One API Statistics - Compact */}
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Stats</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <AngelOneApiStatistics />
                  </CardContent>
                </Card>

                {/* Angel One System Status - Compact */}
                <Card className="hover-elevate md:col-span-2 lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Status & Activity</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <AngelOneSystemStatus />
                  </CardContent>
                </Card>
      </div>
    </div>
  );
}
