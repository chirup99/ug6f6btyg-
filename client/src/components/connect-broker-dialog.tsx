import { Bitcoin, X, Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AuthButtonFyers } from "@/components/auth-button-fyers";

interface ConnectBrokerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  showDeltaExchange: boolean;
  setShowDeltaExchange: (v: boolean) => void;

  connectedBrokersCount: number;

  zerodhaIsConnected: boolean;
  setZerodhaAccessToken: (token: string | null) => void;
  setZerodhaIsConnected: (v: boolean) => void;

  upstoxIsConnected: boolean;
  upstoxAccessToken: string | null;
  setUpstoxAccessToken: (token: string | null) => void;
  setUpstoxIsConnected: (v: boolean) => void;

  angelOneIsConnected: boolean;
  userAngelOneIsConnected: boolean;
  setUserAngelOneToken: (token: string | null) => void;
  setUserAngelOneIsConnected: (v: boolean) => void;
  setUserAngelOneName: (name: string | null) => void;

  dhanIsConnected: boolean;
  setDhanAccessToken: (token: string | null) => void;
  setDhanIsConnected: (v: boolean) => void;
  setDhanClientName: (name: string | null) => void;

  fyersIsConnected: boolean | undefined;

  growwIsConnected: boolean;
  setGrowwIsConnected: (v: boolean) => void;
  setGrowwAccessToken: (token: string | null) => void;
  setGrowwUserId: (id: string | null) => void;
  setGrowwUserName: (name: string | null) => void;
  setBrokerFunds: (funds: number | null) => void;

  deltaExchangeIsConnected: boolean;
  setDeltaExchangeIsConnected: (v: boolean) => void;
  deltaExchangeApiKey: string;
  setDeltaExchangeApiKey: (key: string) => void;
  deltaExchangeApiSecret: string;
  setDeltaExchangeApiSecret: (secret: string) => void;
  setDeltaExchangeUserId: (id: string | null) => void;
  setDeltaExchangeAccountName: (name: string | null) => void;

  isUpstoxDialogOpen: boolean;
  setIsUpstoxDialogOpen: (v: boolean) => void;
  upstoxApiKeyInput: string;
  setUpstoxApiKeyInput: (v: string) => void;
  upstoxApiSecretInput: string;
  setUpstoxApiSecretInput: (v: string) => void;
  showUpstoxSecret: boolean;
  setShowUpstoxSecret: (v: boolean) => void;

  isAngelOneDialogOpen: boolean;
  setIsAngelOneDialogOpen: (v: boolean) => void;
  angelOneClientCodeInput: string;
  setAngelOneClientCodeInput: (v: string) => void;
  angelOneApiKeyInput: string;
  setAngelOneApiKeyInput: (v: string) => void;
  showAngelOneSecret: boolean;
  setShowAngelOneSecret: (v: boolean) => void;
  angelOnePinInput: string;
  setAngelOnePinInput: (v: string) => void;
  showAngelOnePin: boolean;
  setShowAngelOnePin: (v: boolean) => void;
  angelOneTotpInput: string;
  setAngelOneTotpInput: (v: string) => void;
  showAngelOneTotp: boolean;
  setShowAngelOneTotp: (v: boolean) => void;

  isDhanDialogOpen: boolean;
  setIsDhanDialogOpen: (v: boolean) => void;
  dhanClientIdInput: string;
  setDhanClientIdInput: (v: string) => void;
  dhanTokenInput: string;
  setDhanTokenInput: (v: string) => void;
  showDhanToken: boolean;
  setShowDhanToken: (v: boolean) => void;

  isGrowwDialogOpen: boolean;
  setIsGrowwDialogOpen: (v: boolean) => void;
  growwApiKeyInput: string;
  setGrowwApiKeyInput: (v: string) => void;
  growwApiSecretInput: string;
  setGrowwApiSecretInput: (v: string) => void;
  showGrowwSecret: boolean;
  setShowGrowwSecret: (v: boolean) => void;
  isGrowwConnecting: boolean;
  setIsGrowwConnecting: (v: boolean) => void;

  isFyersDialogOpen: boolean;
  setIsFyersDialogOpen: (v: boolean) => void;
  fyersAppId: string;
  setFyersAppId: (v: string) => void;
  fyersSecretId: string;
  setFyersSecretId: (v: string) => void;

  isDeltaExchangeDialogOpen: boolean;
  setIsDeltaExchangeDialogOpen: (v: boolean) => void;
  showDeltaSecret: boolean;
  setShowDeltaSecret: (v: boolean) => void;
  deltaWhitelistedIP: string;

  isZerodhaDialogOpen: boolean;
  setIsZerodhaDialogOpen: (v: boolean) => void;
  zerodhaApiKeyInput: string;
  setZerodhaApiKeyInput: (v: string) => void;
  zerodhaApiSecretInput: string;
  setZerodhaApiSecretInput: (v: string) => void;
  showZerodhaSecret: boolean;
  setShowZerodhaSecret: (v: boolean) => void;

  handleZerodhaConnect: () => void;
  submitZerodhaCredentials: () => Promise<void>;
  handleUpstoxConnect: () => Promise<void>;
  handleUpstoxDisconnect: () => Promise<void>;
  handleUserAngelOneConnect: () => Promise<void>;
  handleUserAngelOneDisconnect: () => void;
  handleDhanConnect: () => Promise<void>;
  submitDhanCredentials: () => Promise<void>;
  handleGrowwConnect: () => Promise<void>;
  submitGrowwCredentials: () => Promise<void>;
  handleGrowwDisconnect: () => void;
  handleDeltaExchangeConnect: () => Promise<void>;
  handleDeltaExchangeDisconnect: () => void;
}

export function ConnectBrokerDialog({
  open,
  onOpenChange,
  showDeltaExchange,
  setShowDeltaExchange,
  connectedBrokersCount,
  zerodhaIsConnected,
  setZerodhaAccessToken,
  setZerodhaIsConnected,
  upstoxIsConnected,
  upstoxAccessToken,
  setUpstoxAccessToken,
  setUpstoxIsConnected,
  angelOneIsConnected,
  userAngelOneIsConnected,
  setUserAngelOneToken,
  setUserAngelOneIsConnected,
  setUserAngelOneName,
  dhanIsConnected,
  setDhanAccessToken,
  setDhanIsConnected,
  setDhanClientName,
  fyersIsConnected,
  growwIsConnected,
  setGrowwIsConnected,
  setGrowwAccessToken,
  setGrowwUserId,
  setGrowwUserName,
  setBrokerFunds,
  deltaExchangeIsConnected,
  setDeltaExchangeIsConnected,
  deltaExchangeApiKey,
  setDeltaExchangeApiKey,
  deltaExchangeApiSecret,
  setDeltaExchangeApiSecret,
  setDeltaExchangeUserId,
  setDeltaExchangeAccountName,
  isUpstoxDialogOpen,
  setIsUpstoxDialogOpen,
  upstoxApiKeyInput,
  setUpstoxApiKeyInput,
  upstoxApiSecretInput,
  setUpstoxApiSecretInput,
  showUpstoxSecret,
  setShowUpstoxSecret,
  isAngelOneDialogOpen,
  setIsAngelOneDialogOpen,
  angelOneClientCodeInput,
  setAngelOneClientCodeInput,
  angelOneApiKeyInput,
  setAngelOneApiKeyInput,
  showAngelOneSecret,
  setShowAngelOneSecret,
  angelOnePinInput,
  setAngelOnePinInput,
  showAngelOnePin,
  setShowAngelOnePin,
  angelOneTotpInput,
  setAngelOneTotpInput,
  showAngelOneTotp,
  setShowAngelOneTotp,
  isDhanDialogOpen,
  setIsDhanDialogOpen,
  dhanClientIdInput,
  setDhanClientIdInput,
  dhanTokenInput,
  setDhanTokenInput,
  showDhanToken,
  setShowDhanToken,
  isGrowwDialogOpen,
  setIsGrowwDialogOpen,
  growwApiKeyInput,
  setGrowwApiKeyInput,
  growwApiSecretInput,
  setGrowwApiSecretInput,
  showGrowwSecret,
  setShowGrowwSecret,
  isGrowwConnecting,
  setIsGrowwConnecting,
  isFyersDialogOpen,
  setIsFyersDialogOpen,
  fyersAppId,
  setFyersAppId,
  fyersSecretId,
  setFyersSecretId,
  isDeltaExchangeDialogOpen,
  setIsDeltaExchangeDialogOpen,
  showDeltaSecret,
  setShowDeltaSecret,
  deltaWhitelistedIP,
  isZerodhaDialogOpen,
  setIsZerodhaDialogOpen,
  zerodhaApiKeyInput,
  setZerodhaApiKeyInput,
  zerodhaApiSecretInput,
  setZerodhaApiSecretInput,
  showZerodhaSecret,
  setShowZerodhaSecret,
  handleZerodhaConnect,
  submitZerodhaCredentials,
  handleUpstoxConnect,
  handleUpstoxDisconnect,
  handleUserAngelOneConnect,
  handleUserAngelOneDisconnect,
  handleDhanConnect,
  submitDhanCredentials,
  handleGrowwConnect,
  submitGrowwCredentials,
  handleGrowwDisconnect,
  handleDeltaExchangeConnect,
  handleDeltaExchangeDisconnect,
}: ConnectBrokerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md rounded-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              Connect Your Broker
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${connectedBrokersCount >= 2 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {connectedBrokersCount}/2
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 transition-colors ${showDeltaExchange ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-slate-400'}`}
                onClick={() => setShowDeltaExchange(!showDeltaExchange)}
                title="Crypto Exchange"
              >
                <Bitcoin className="h-4 w-4" />
              </Button>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {showDeltaExchange ? (
            deltaExchangeIsConnected ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 cursor-default"
                >
                  <img
                    src="https://play-lh.googleusercontent.com/XAQ7c8MRAvy_mOUw8EGS3tQsn95MY7gJxtj-sSoVZ6OYJmjvt7KaGGDyT85UTRpLxL6d=w240-h480-rw"
                    alt="Delta Exchange India"
                    className="w-4 h-4 mr-2 rounded-full"
                  />
                  Delta Exchange
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 w-10 border border-slate-200 hover:border-red-100"
                  onClick={handleDeltaExchangeDisconnect}
                  title="Disconnect Delta Exchange"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-10 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                onClick={() => setIsDeltaExchangeDialogOpen(true)}
                data-testid="button-delta-exchange-dialog"
              >
                <img
                  src="https://play-lh.googleusercontent.com/XAQ7c8MRAvy_mOUw8EGS3tQsn95MY7gJxtj-sSoVZ6OYJmjvt7KaGGDyT85UTRpLxL6d=w240-h480-rw"
                  alt="Delta Exchange India"
                  className="w-4 h-4 mr-2 rounded-full"
                />
                Delta Exchange India
              </Button>
            )
          ) : (
            <div className="space-y-3">
              {zerodhaIsConnected ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 cursor-default"
                    data-testid="button-zerodha-connected-display"
                  >
                    <img
                      src="https://zerodha.com/static/images/products/kite-logo.svg"
                      alt="Zerodha"
                      className="w-4 h-4 mr-2"
                    />
                    Zerodha
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 w-10 border border-slate-200 hover:border-red-100"
                    onClick={() => {
                      localStorage.removeItem("zerodha_token"); document.cookie = "zerodha_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
                      setZerodhaAccessToken(null);
                      setZerodhaIsConnected(false);
                    }}
                    title="Disconnect Zerodha"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleZerodhaConnect}
                  variant="outline"
                  className={`w-full h-10 ${
                    (connectedBrokersCount >= 2 && !zerodhaIsConnected)
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                  }`}
                  data-testid="button-zerodha-dialog"
                  disabled={connectedBrokersCount >= 2 && !zerodhaIsConnected}
                >
                  <img
                    src="https://zerodha.com/static/images/products/kite-logo.svg"
                    alt="Zerodha"
                    className="w-4 h-4 mr-2"
                  />
                  Zerodha
                </Button>
              )}
              {upstoxIsConnected ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 cursor-default"
                    data-testid="button-upstox-connected-display"
                  >
                    <img src="https://assets.upstox.com/content/assets/images/cms/202494/MediumWordmark_UP(WhiteOnPurple).png" alt="Upstox" className="h-4 mr-2" />
                    Upstox
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 w-10 border border-slate-200 hover:border-red-100"
                    onClick={handleUpstoxDisconnect}
                    title="Disconnect Upstox"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Dialog open={isUpstoxDialogOpen} onOpenChange={setIsUpstoxDialogOpen}>
                  <Button
                    variant="outline"
                    className={`w-full h-10 ${
                      (connectedBrokersCount >= 2 && !upstoxIsConnected)
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                    }`}
                    data-testid="button-upstox-dialog"
                    disabled={connectedBrokersCount >= 2 && !upstoxIsConnected}
                    onClick={() => setIsUpstoxDialogOpen(true)}
                  >
                    <img src="https://assets.upstox.com/content/assets/images/cms/202494/MediumWordmark_UP(WhiteOnPurple).png" alt="Upstox" className="h-4 mr-2" />
                    Upstox
                  </Button>
                  <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <img src="https://assets.upstox.com/content/assets/images/cms/202494/MediumWordmark_UP(WhiteOnPurple).png" alt="Upstox" className="h-5" />
                        Connect Upstox Broker
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="upstox-api-key" className="text-slate-700 dark:text-slate-300">API Key</Label>
                        <Input
                          id="upstox-api-key"
                          placeholder="Enter your Upstox API Key"
                          value={upstoxApiKeyInput}
                          onChange={(e) => setUpstoxApiKeyInput(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="upstox-api-secret" className="text-slate-700 dark:text-slate-300">API Secret</Label>
                        <div className="relative">
                          <Input
                            id="upstox-api-secret"
                            type={showUpstoxSecret ? "text" : "password"}
                            placeholder="Enter your Upstox API Secret"
                            value={upstoxApiSecretInput}
                            onChange={(e) => setUpstoxApiSecretInput(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                            onClick={() => setShowUpstoxSecret(!showUpstoxSecret)}
                          >
                            {showUpstoxSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-full group hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors overflow-hidden">
                          <span className="text-[10px] text-slate-500 font-medium shrink-0">Redirect URL:</span>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold truncate block max-w-[200px]">{window.location.protocol}//{window.location.host}/api/upstox/callback</code>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0 ml-0.5"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/api/upstox/callback`);
                              toast({
                                title: "Copied",
                                description: "Redirect URL copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="h-2.5 w-2.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">
                          Generate API keys at: <a href="https://account.upstox.com/developer/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://account.upstox.com/developer/apps</a>
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={() => setIsUpstoxDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpstoxConnect}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!upstoxApiKeyInput || !upstoxApiSecretInput}
                      >
                        Connect Account
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {(angelOneIsConnected || userAngelOneIsConnected) ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 cursor-default"
                    data-testid="button-angelone-connected-display"
                  >
                    <img
                      src="https://play-lh.googleusercontent.com/Ic8lUYwMCgTePpo-Gbg0VwE_0srDj1xD386BvQHO_mOwsfMjX8lFBLl0Def28pO_Mvk=s48-rw?v=1701"
                      alt="Angel One"
                      className="h-4 mr-2 rounded-full"
                    />
                    Angel One
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 w-10 border border-slate-200 hover:border-red-100"
                    onClick={handleUserAngelOneDisconnect}
                    title="Disconnect Angel One"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Dialog open={isAngelOneDialogOpen} onOpenChange={setIsAngelOneDialogOpen}>
                  <Button
                    variant="outline"
                    className={`w-full h-10 ${
                      (connectedBrokersCount >= 2 && !(angelOneIsConnected || userAngelOneIsConnected))
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                    }`}
                    data-testid="button-angelone-dialog"
                    disabled={connectedBrokersCount >= 2 && !(angelOneIsConnected || userAngelOneIsConnected)}
                    onClick={() => setIsAngelOneDialogOpen(true)}
                  >
                    <img
                      src="https://play-lh.googleusercontent.com/Ic8lUYwMCgTePpo-Gbg0VwE_0srDj1xD386BvQHO_mOwsfMjX8lFBLl0Def28pO_Mvk=s48-rw?v=1701"
                      alt="Angel One"
                      className="h-4 mr-2 rounded-full"
                    />
                    Angel One
                  </Button>
                  <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <img
                          src="https://play-lh.googleusercontent.com/Ic8lUYwMCgTePpo-Gbg0VwE_0srDj1xD386BvQHO_mOwsfMjX8lFBLl0Def28pO_Mvk=s48-rw?v=1701"
                          alt="Angel One"
                          className="h-5 rounded-full"
                        />
                        Connect Angel One Broker
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="ao-client-code" className="text-slate-700 dark:text-slate-300">Client Code</Label>
                        <Input
                          id="ao-client-code"
                          placeholder="Enter your client ID"
                          value={angelOneClientCodeInput}
                          onChange={(e) => { setAngelOneClientCodeInput(e.target.value); localStorage.setItem("angel_one_client_code", e.target.value); }}
                          className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          data-testid="input-angelone-client-code"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ao-api-key" className="text-slate-700 dark:text-slate-300">API Key</Label>
                        <div className="relative">
                          <Input
                            id="ao-api-key"
                            type={showAngelOneSecret ? "text" : "password"}
                            placeholder="Enter your Angel One API Key"
                            value={angelOneApiKeyInput}
                            onChange={(e) => { setAngelOneApiKeyInput(e.target.value); localStorage.setItem("angel_one_api_key", e.target.value); }}
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                            data-testid="input-angelone-api-key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                            onClick={() => setShowAngelOneSecret(!showAngelOneSecret)}
                          >
                            {showAngelOneSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-fit group hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors">
                          <span className="text-[10px] text-slate-500 font-medium">Redirect URL:</span>
                          <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold truncate max-w-[180px]">{window.location.protocol}//{window.location.host}/api/broker/angelone/callback</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 hover:bg-slate-200 dark:hover:bg-slate-800 ml-0.5"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/api/broker/angelone/callback`);
                              toast({ title: "Copied", description: "Redirect URL copied to clipboard" });
                            }}
                          >
                            <Copy className="h-2.5 w-2.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Generate API key at: <a href="https://smartapi.angelone.in/publisher-login" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://smartapi.angelone.in</a>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ao-pin" className="text-slate-700 dark:text-slate-300">Login PIN</Label>
                        <div className="relative">
                          <Input
                            id="ao-pin"
                            type={showAngelOnePin ? "text" : "password"}
                            placeholder="Enter your Login PIN"
                            value={angelOnePinInput}
                            onChange={(e) => { setAngelOnePinInput(e.target.value); localStorage.setItem("angel_one_pin", e.target.value); }}
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                            data-testid="input-angelone-pin"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                            onClick={() => setShowAngelOnePin(!showAngelOnePin)}
                          >
                            {showAngelOnePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ao-totp" className="text-slate-700 dark:text-slate-300">TOTP (Secret Key or 6-digit Code)</Label>
                        <div className="relative">
                          <Input
                            id="ao-totp"
                            type={showAngelOneTotp ? "text" : "password"}
                            placeholder="Secret Key or 6-digit OTP"
                            value={angelOneTotpInput}
                            onChange={(e) => { setAngelOneTotpInput(e.target.value); localStorage.setItem("angel_one_totp", e.target.value); }}
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                            data-testid="input-angelone-totp"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                            onClick={() => setShowAngelOneTotp(!showAngelOneTotp)}
                          >
                            {showAngelOneTotp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                          <span className="font-semibold">Important:</span> Use the{" "}
                          <a href="https://smartapi.angelone.in" target="_blank" rel="noopener noreferrer" className="underline">Secret Key</a>{" "}
                          (provided during QR setup) for a permanent connection, or a 6-digit code from your Authenticator app (valid for 30 seconds).
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={() => setIsAngelOneDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUserAngelOneConnect}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!angelOneClientCodeInput || !angelOneApiKeyInput || !angelOnePinInput || !angelOneTotpInput}
                        data-testid="button-angelone-connect-submit"
                      >
                        Connect Account
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {dhanIsConnected ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 cursor-default"
                    data-testid="button-dhan-connected-display"
                  >
                    <img src="https://play-lh.googleusercontent.com/lVXf_i8Gi3C7eZVWKgeG8U5h_kAzUT0MrmvEAXfM_ihlo44VEk01HgAi6vbBNsSzBQ=w240-h480-rw?v=1701" alt="Dhan" className="h-4 mr-2" />
                    Dhan
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 w-10 border border-slate-200 hover:border-red-100"
                    onClick={() => {
                      localStorage.removeItem("dhan_token");
                      setDhanAccessToken(null);
                      setDhanIsConnected(false);
                    }}
                    title="Disconnect Dhan"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleDhanConnect}
                  variant="outline"
                  className={`w-full h-10 ${
                    (connectedBrokersCount >= 2 && !dhanIsConnected)
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                  }`}
                  data-testid="button-dhan-dialog"
                  disabled={connectedBrokersCount >= 2 && !dhanIsConnected}
                >
                  <img src="https://play-lh.googleusercontent.com/lVXf_i8Gi3C7eZVWKgeG8U5h_kAzUT0MrmvEAXfM_ihlo44VEk01HgAi6vbBNsSzBQ=w240-h480-rw?v=1701" alt="Dhan" className="h-4 mr-2" />
                  Dhan
                </Button>
              )}

              {/* Fyers */}
              {fyersIsConnected ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 cursor-default"
                  >
                    <img
                      src="https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw"
                      alt="Fyers"
                      className="w-4 h-4 mr-2 rounded-full"
                    />
                    Fyers
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 w-10 border border-slate-200 hover:border-red-100"
                    onClick={() => {
                      apiRequest("POST", "/api/fyers/disconnect").then(() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/fyers/status"] });
                        toast({ title: "Disconnected", description: "Fyers account disconnected" });
                      });
                    }}
                    title="Disconnect Fyers"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className={`w-full h-10 ${
                    (connectedBrokersCount >= 2 && !fyersIsConnected)
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 relative'
                  }`}
                  onClick={() => setIsFyersDialogOpen(true)}
                  disabled={connectedBrokersCount >= 2 && !fyersIsConnected}
                >
                  <img src="https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw" alt="Fyers" className="w-4 h-4 mr-2 rounded-full" />
                  Fyers
                </Button>
              )}

              {/* Groww */}
              {growwIsConnected ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 cursor-default"
                  >
                    <img src="https://play-lh.googleusercontent.com/LHjOai6kf1IsstKNWO9jbMxD-ix_FVYaJSLodKCqYQdoFVzQBuV9z5txxzcTagQcyX8=s48-rw" alt="Groww" className="w-4 h-4 mr-2 rounded-full" />
                    Groww
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 w-10 border border-slate-200 hover:border-red-100"
                    onClick={handleGrowwDisconnect}
                    title="Disconnect Groww"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleGrowwConnect}
                  variant="outline"
                  className={`w-full h-10 ${
                    (connectedBrokersCount >= 2 && !growwIsConnected)
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                  }`}
                  data-testid="button-groww-dialog"
                  disabled={connectedBrokersCount >= 2 && !growwIsConnected}
                >
                  <img src="https://play-lh.googleusercontent.com/LHjOai6kf1IsstKNWO9jbMxD-ix_FVYaJSLodKCqYQdoFVzQBuV9z5txxzcTagQcyX8=s48-rw" alt="Groww" className="w-4 h-4 mr-2 rounded-full" />
                  Groww
                </Button>
              )}

              {/* ICICI Securities */}
              <Button
                variant="outline"
                className="w-full h-10 bg-slate-50/50 dark:bg-slate-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 cursor-not-allowed relative hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                disabled
              >
                <img src="https://play-lh.googleusercontent.com/RqpvFiLwp9Vz8dY3QZplf7IZ0ZzCCjH9CVXlO61FIrCUQQCDfSrvPufjDw6sfbjTKg=w240-h480-rw" alt="ICICI Securities" className="w-4 h-4 mr-2 rounded-full" />
                ICICI Securities
                <span className="absolute top-1 right-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Coming Soon</span>
              </Button>

              {/* Alice Blue */}
              <Button
                variant="outline"
                className="w-full h-10 bg-slate-50/50 dark:bg-slate-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 cursor-not-allowed relative hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                disabled
              >
                <img src="https://play-lh.googleusercontent.com/tVA2zP_nU106-0ySk0z_5aJlbv1AC-IVBEnF5qcGnhk1dzoA0m0-lqTC45lnkQ-ZVpC_5CL-JCxgPMNlWLbV98g=w240-h480-rw" alt="Alice Blue" className="w-4 h-4 mr-2 rounded-full" />
                Alice Blue
                <span className="absolute top-1 right-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Coming Soon</span>
              </Button>

              {/* 5 Paisa */}
              <Button
                variant="outline"
                className="w-full h-10 bg-slate-50/50 dark:bg-slate-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 cursor-not-allowed relative hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                disabled
              >
                <img src="https://play-lh.googleusercontent.com/rWCMrTgGm6Y0ZJdJ6KKMOKi14Jxmxo_Rqjoh2rlRTizFJBRG_jPj2-p2VuAF6JCjmA=w240-h480-rw" alt="5 Paisa" className="w-4 h-4 mr-2 rounded-full" />
                5 Paisa
                <span className="absolute top-1 right-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Coming Soon</span>
              </Button>

              {/* M Stock */}
              <Button
                variant="outline"
                className="w-full h-10 bg-slate-50/50 dark:bg-slate-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 cursor-not-allowed relative hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                disabled
              >
                <img src="https://play-lh.googleusercontent.com/byfkRPgqNjHPRSrk9kQPc7ywPNqBVKMJU1lLZ_xRqGNn3fMlrh8uWc7b5A6iNDyC6w=w240-h480-rw" alt="M Stock" className="w-4 h-4 mr-2 rounded-full" />
                M Stock
                <span className="absolute top-1 right-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Coming Soon</span>
              </Button>

              {/* Kotak Neo */}
              <Button
                variant="outline"
                className="w-full h-10 bg-slate-50/50 dark:bg-slate-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 cursor-not-allowed relative hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                disabled
              >
                <img src="https://play-lh.googleusercontent.com/z0vvYS6PM9lwFsU_7h0sxuZtm8w5UDfFifFYUSlCqVk8i0xob2ERvFIgI1mU66PCLD4=s48-rw" alt="Kotak Neo" className="w-4 h-4 mr-2 rounded-full" />
                Kotak Neo
                <span className="absolute top-1 right-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Coming Soon</span>
              </Button>

              {/* Finvasia Shoonya */}
              <Button
                variant="outline"
                className="w-full h-10 bg-slate-50/50 dark:bg-slate-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 cursor-not-allowed relative hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                disabled
              >
                <img src="https://play-lh.googleusercontent.com/xt2t_1OlxJuL2C8555vjA9VLmBTqZt8pqb5nJ_QhtgJFOyeA3MqZvUskYAqcWaUrekrS=w240-h480-rw" alt="Finvasia" className="w-4 h-4 mr-2 rounded-full" />
                Finvasia
                <span className="absolute top-1 right-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Coming Soon</span>
              </Button>

              {/* Motilal Oswal */}
              <Button
                variant="outline"
                className="w-full h-10 bg-slate-50/50 dark:bg-slate-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 cursor-not-allowed relative hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                disabled
              >
                <img src="https://play-lh.googleusercontent.com/sdTW65mkcT7OaG6Rq_tpZcO8eslU1kWsI6saA773XR0rrxJaGIG2UeCGW8cS6PLfeg=w240-h480-rw" alt="Motilal Oswal" className="w-4 h-4 mr-2 rounded-full" />
                Motilal Oswal
                <span className="absolute top-1 right-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Coming Soon</span>
              </Button>
            </div>
          )}

          <Dialog open={isDhanDialogOpen} onOpenChange={setIsDhanDialogOpen}>
            <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <img src="https://play-lh.googleusercontent.com/lVXf_i8Gi3C7eZVWKgeG8U5h_kAzUT0MrmvEAXfM_ihlo44VEk01HgAi6vbBNsSzBQ=w240-h480-rw?v=1701" alt="Dhan" className="h-5" />
                  Connect Dhan Broker
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="dhan-client-id" className="text-slate-700 dark:text-slate-300">Client ID</Label>
                  <Input
                    id="dhan-client-id"
                    placeholder="Enter your Dhan Client ID"
                    value={dhanClientIdInput}
                    onChange={(e) => {
                      setDhanClientIdInput(e.target.value);
                      localStorage.setItem("dhan_client_id", e.target.value);
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dhan-access-token" className="text-slate-700 dark:text-slate-300">Access Token</Label>
                  <div className="relative">
                    <Input
                      id="dhan-access-token"
                      type={showDhanToken ? "text" : "password"}
                      placeholder="Enter your Dhan Access Token"
                      value={dhanTokenInput}
                      onChange={(e) => {
                        setDhanTokenInput(e.target.value);
                        localStorage.setItem("dhan_access_token", e.target.value);
                      }}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                      onClick={() => setShowDhanToken(!showDhanToken)}
                    >
                      {showDhanToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Generate access token at: <a href="https://dhanhq.co/docs/latest/trading-api/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://dhanhq.co/docs/latest/trading-api/</a>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsDhanDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitDhanCredentials}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!dhanClientIdInput || !dhanTokenInput}
                >
                  Connect Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isGrowwDialogOpen} onOpenChange={setIsGrowwDialogOpen}>
            <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <img src="https://play-lh.googleusercontent.com/LHjOai6kf1IsstKNWO9jbMxD-ix_FVYaJSLodKCqYQdoFVzQBuV9z5txxzcTagQcyX8=s48-rw" alt="Groww" className="h-5" />
                  Connect Groww Broker
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    <span className="font-semibold">Daily Approval Required:</span> Before connecting, go to the{" "}
                    <a href="https://groww.in/trade-api/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">Groww Cloud API Keys page</a>
                    {" "}and approve your API key for today.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groww-api-key" className="text-slate-700 dark:text-slate-300">API Key</Label>
                  <Input
                    id="groww-api-key"
                    placeholder="Enter your Groww API Key"
                    value={growwApiKeyInput}
                    onChange={(e) => setGrowwApiKeyInput(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groww-api-secret" className="text-slate-700 dark:text-slate-300">API Secret</Label>
                  <div className="relative">
                    <Input
                      id="groww-api-secret"
                      type={showGrowwSecret ? "text" : "password"}
                      placeholder="Enter your Groww API Secret"
                      value={growwApiSecretInput}
                      onChange={(e) => setGrowwApiSecretInput(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                      onClick={() => setShowGrowwSecret(!showGrowwSecret)}
                    >
                      {showGrowwSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Generate API keys at: <a href="https://groww.in/trade-api/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://groww.in/trade-api/api-keys</a>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsGrowwDialogOpen(false)} disabled={isGrowwConnecting}>
                  Cancel
                </Button>
                <Button
                  onClick={submitGrowwCredentials}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                  disabled={!growwApiKeyInput || !growwApiSecretInput || isGrowwConnecting}
                >
                  {isGrowwConnecting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : "Connect Account"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isZerodhaDialogOpen} onOpenChange={setIsZerodhaDialogOpen}>
            <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <img src="https://kite.zerodha.com/static/images/kite-logo.svg" alt="Zerodha" className="h-5" />
                  Connect Zerodha Broker
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="zerodha-api-key" className="text-slate-700 dark:text-slate-300">API Key</Label>
                  <Input
                    id="zerodha-api-key"
                    placeholder="Enter your Zerodha API Key"
                    value={zerodhaApiKeyInput}
                    onChange={(e) => {
                      setZerodhaApiKeyInput(e.target.value);
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zerodha-api-secret" className="text-slate-700 dark:text-slate-300">API Secret</Label>
                  <div className="relative">
                    <Input
                      id="zerodha-api-secret"
                      type={showZerodhaSecret ? "text" : "password"}
                      placeholder="Enter your Zerodha API Secret"
                      value={zerodhaApiSecretInput}
                      onChange={(e) => {
                        setZerodhaApiSecretInput(e.target.value);
                      }}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                      onClick={() => setShowZerodhaSecret(!showZerodhaSecret)}
                    >
                      {showZerodhaSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-full group hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors overflow-hidden">
                    <span className="text-[10px] text-slate-500 font-medium shrink-0">Redirect URL:</span>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold truncate block max-w-[200px]">{window.location.protocol}//{window.location.host}/api/zerodha/callback</code>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0 ml-0.5"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/api/zerodha/callback`);
                        toast({
                          title: "Copied",
                          description: "Redirect URL copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-2.5 w-2.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Generate API keys at: <a href="https://developers.kite.trade" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://developers.kite.trade</a>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsZerodhaDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitZerodhaCredentials}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!zerodhaApiKeyInput || !zerodhaApiSecretInput}
                >
                  Connect Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isFyersDialogOpen} onOpenChange={setIsFyersDialogOpen}>
            <DialogContent className="w-[95vw] sm:max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto">
              {!fyersIsConnected && (
                <AuthButtonFyers
                  externalAppId={fyersAppId}
                  externalSecretId={fyersSecretId}
                  onSuccess={() => setIsFyersDialogOpen(false)}
                  onClose={() => setIsFyersDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isDeltaExchangeDialogOpen} onOpenChange={setIsDeltaExchangeDialogOpen}>
            <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <img src="https://play-lh.googleusercontent.com/XAQ7c8MRAvy_mOUw8EGS3tQsn95MY7gJxtj-sSoVZ6OYJmjvt7KaGGDyT85UTRpLxL6d=w240-h480-rw" alt="Delta Exchange India" className="h-5 rounded-full" />
                  Connect Delta Exchange India
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="delta-api-key" className="text-slate-700 dark:text-slate-300">API Key</Label>
                  <Input
                    id="delta-api-key"
                    placeholder="Enter your Delta Exchange API Key"
                    value={deltaExchangeApiKey}
                    onChange={(e) => {
                      setDeltaExchangeApiKey(e.target.value);
                      localStorage.setItem("delta_api_key", e.target.value);
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    data-testid="input-delta-api-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delta-api-secret" className="text-slate-700 dark:text-slate-300">API Secret</Label>
                  <div className="relative">
                    <Input
                      id="delta-api-secret"
                      type={showDeltaSecret ? "text" : "password"}
                      placeholder="Enter your Delta Exchange API Secret"
                      value={deltaExchangeApiSecret}
                      onChange={(e) => {
                        setDeltaExchangeApiSecret(e.target.value);
                        localStorage.setItem("delta_api_secret", e.target.value);
                      }}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                      data-testid="input-delta-api-secret"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                      onClick={() => setShowDeltaSecret(!showDeltaSecret)}
                    >
                      {showDeltaSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-fit group hover:border-orange-200 dark:hover:border-orange-900/40 transition-colors">
                    <span className="text-[10px] text-slate-500 font-medium">Whitelisted IP:</span>
                    <code className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-bold">{deltaWhitelistedIP}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 hover:bg-slate-200 dark:hover:bg-slate-800 ml-0.5"
                      onClick={() => {
                        navigator.clipboard.writeText(deltaWhitelistedIP);
                        toast({
                          title: "Copied",
                          description: "IP address copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-2.5 w-2.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Create your API keys at: <a href="https://www.delta.exchange/app/account/manageapikeys" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">https://www.delta.exchange/app/account/manageapikeys</a>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsDeltaExchangeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeltaExchangeConnect}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={!deltaExchangeApiKey || !deltaExchangeApiSecret}
                >
                  Connect Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-center text-[10px] text-gray-500 py-3 border-t border-slate-100 dark:border-slate-800">
          Connect your broker account to auto-import trades
        </p>
      </DialogContent>
    </Dialog>
  );
}
