import { useState, useEffect, useCallback } from 'react';
import { Wallet, Banknote, Receipt, Activity, Info, UserPlus, X, Copy, CheckCircle, Plus, Users, Link2, ExternalLink, Share2, Gift, Clock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Line,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface FundsAnalysisProps {
  isConnected: boolean;
  isDemoMode: boolean;
  totalBrokerFunds: number;
  allBrokerFunds: Record<string, number>;
  journalFundBase: number;
  setJournalFundBase: React.Dispatch<React.SetStateAction<number>>;
  journalWalletUserId?: string | null;
  currentUserName?: string;
  currentUserEmail?: string;
  tradeHistoryData: any[];
  tradingDataByDate: Record<string, any>;
  activeBroker: string;
  performanceMetrics: { netPnL: number };
  setShowConnectDialog: (v: boolean) => void;
  getBrokerDisplayName: (id: string) => string;
  brokerIconMap: Record<string, string>;
  influencerPeriod?: { active: boolean; expiryDate: string; startDate: string; days: number } | null;
}

interface ReferralProfile {
  userId: string;
  code: string;
  userName: string;
  userEmail: string;
  referredUsers: Array<{ userId: string; name: string; email: string; joinedAt: string }>;
  referralApplied: boolean;
  referredByCode: string | null;
  referredByUserId: string | null;
}

export function FundsAnalysis({
  isConnected,
  isDemoMode,
  totalBrokerFunds,
  allBrokerFunds,
  journalFundBase,
  setJournalFundBase,
  journalWalletUserId,
  currentUserName,
  currentUserEmail,
  tradeHistoryData,
  tradingDataByDate,
  activeBroker,
  performanceMetrics,
  setShowConnectDialog,
  getBrokerDisplayName,
  brokerIconMap,
  influencerPeriod,
}: FundsAnalysisProps) {
  const { toast } = useToast();

  // Demo mode only applies when the user is not logged in (guest/unauthenticated)
  const isGuestMode = isDemoMode && !journalWalletUserId;

  const [showBrokerBreakupDialog, setShowBrokerBreakupDialog] = useState(false);
  const [showJournalChargesDialog, setShowJournalChargesDialog] = useState(false);
  const [influencerHideUI, setInfluencerHideUI] = useState<boolean>(() => {
    try { return localStorage.getItem('influencerHideUI') === 'true'; } catch { return false; }
  });
  const toggleInfluencerHideUI = () => setInfluencerHideUI(v => {
    const next = !v;
    try { localStorage.setItem('influencerHideUI', String(next)); } catch {}
    return next;
  });
  const [showBrokerageChargesDialog, setShowBrokerageChargesDialog] = useState(false);
  const [showReferDialog, setShowReferDialog] = useState(false);
  const [showReferredList, setShowReferredList] = useState(false);
  const [showAddFundDialog, setShowAddFundDialog] = useState(false);
  const [addFundAmount, setAddFundAmount] = useState('');
  const [addFundLoading, setAddFundLoading] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [applyReferralLoading, setApplyReferralLoading] = useState(false);
  const [referralProfile, setReferralProfile] = useState<ReferralProfile | null>(null);
  const [referralProfileLoading, setReferralProfileLoading] = useState(false);

  const myReferralCode = referralProfile?.code ?? '';
  const referralApplied = referralProfile?.referralApplied ?? false;
  const referredUsers = referralProfile?.referredUsers ?? [];

  const loadReferralProfile = useCallback(async () => {
    if (!journalWalletUserId) return;
    setReferralProfileLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentUserName) params.set('name', currentUserName);
      if (currentUserEmail) params.set('email', currentUserEmail);
      const res = await fetch(`/api/referral/${encodeURIComponent(journalWalletUserId)}?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.profile) setReferralProfile(data.profile);
      }
    } catch (e) {
      console.warn('⚠️ Could not load referral profile');
    } finally {
      setReferralProfileLoading(false);
    }
  }, [journalWalletUserId, currentUserName, currentUserEmail]);

  const refreshWalletBalance = useCallback(async () => {
    if (!journalWalletUserId) return;
    try {
      const res = await fetch(`/api/journal-wallet/${encodeURIComponent(journalWalletUserId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.wallet) setJournalFundBase(data.wallet.balance ?? journalFundBase);
      }
    } catch (e) {
      console.warn('⚠️ Could not refresh wallet balance');
    }
  }, [journalWalletUserId, journalFundBase, setJournalFundBase]);

  useEffect(() => {
    if (journalWalletUserId) loadReferralProfile();
  }, [journalWalletUserId, loadReferralProfile]);

  useEffect(() => {
    if (showReferDialog && journalWalletUserId) {
      loadReferralProfile();
      refreshWalletBalance();
    }
  }, [showReferDialog, journalWalletUserId, loadReferralProfile, refreshWalletBalance]);

  const handleAddFund = async () => {
    const amount = parseFloat(addFundAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount greater than 0.', variant: 'destructive' });
      return;
    }
    if (!journalWalletUserId) {
      toast({ title: 'Not logged in', description: 'Please log in to add funds.', variant: 'destructive' });
      return;
    }
    setAddFundLoading(true);
    try {
      const res = await fetch(`/api/journal-wallet/${encodeURIComponent(journalWalletUserId)}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, note: 'Manual top-up' })
      });
      const data = await res.json();
      if (data.success && data.wallet) {
        setJournalFundBase(data.wallet.balance);
        setAddFundAmount('');
        setShowAddFundDialog(false);
        toast({ title: '✅ Funds added!', description: `₹${amount.toLocaleString('en-IN')} added to your Journal Fund. New balance: ₹${data.wallet.balance.toFixed(2)}` });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      toast({ title: 'Failed to add funds', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setAddFundLoading(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCodeInput.trim()) {
      toast({ title: 'Enter a code', description: 'Please enter a referral code', variant: 'destructive' });
      return;
    }
    if (!journalWalletUserId) {
      toast({ title: 'Not logged in', description: 'Please log in to apply a referral code.', variant: 'destructive' });
      return;
    }
    setApplyReferralLoading(true);
    try {
      const res = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: journalWalletUserId,
          code: referralCodeInput.trim().toUpperCase(),
          userName: currentUserName || '',
          userEmail: currentUserEmail || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setJournalFundBase(data.newBalance);
        setReferralCodeInput('');
        await loadReferralProfile();
        toast({ title: '🎉 ₹200 Added!', description: 'Referral bonus applied — ₹200 added to your Journal Fund and ₹200 credited to your referrer!' });
      } else {
        toast({ title: 'Could not apply code', description: data.error || 'Please try again.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Failed to apply referral', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setApplyReferralLoading(false);
    }
  };

  const getReferralLink = () => {
    const base = window.location.origin;
    return myReferralCode ? `${base}/?ref=${myReferralCode}` : '';
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    if (!link) return;
    navigator.clipboard?.writeText(link);
    toast({ title: 'Link copied!', description: 'Share this link with friends to earn ₹200 each.' });
  };

  return (
    <>
      {/* Full Width Funds Analysis - New Empty Window */}
      {!isGuestMode && <div className="mt-6">
        <Card className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border-indigo-200/50 dark:border-indigo-500/30 shadow-xl overflow-hidden relative">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <CardHeader className="px-4 py-3 md:pb-2 relative z-10 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 md:p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                  <Wallet className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Funds Analysis</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70">
                    Monitor and manage your trading capital
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 md:p-6 relative z-10">
            {(() => {
              const displayFunds = Number(totalBrokerFunds) || 0;
              const displayBrokerFunds = allBrokerFunds;
              const needsBrokerForBalance = !isConnected;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
                  {/* Net Balance Card */}
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/40 dark:border-white/10 shadow-sm group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                      <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <Banknote className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[9px] md:text-xs px-1.5 py-0">Available</Badge>

                        {/* Multi-broker icons row */}
                        {Object.keys(displayBrokerFunds).length > 0 && (
                          <div
                            onClick={() => setShowBrokerBreakupDialog(true)}
                            className="flex -space-x-1.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {Object.keys(displayBrokerFunds).slice(0, 3).map((brokerId) => (
                              <div
                                key={brokerId}
                                className="inline-block h-5 w-5 md:h-6 md:w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-white p-0.5"
                                title={getBrokerDisplayName(brokerId)}
                              >
                                <img
                                  className="h-full w-full rounded-full object-contain"
                                  src={brokerIconMap[brokerId]}
                                  alt={brokerId}
                                />
                              </div>
                            ))}
                            {Object.keys(displayBrokerFunds).length > 3 && (
                              <div className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                +{Object.keys(displayBrokerFunds).length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {needsBrokerForBalance ? (
                      <div className="flex flex-col items-center justify-center py-2 md:py-4 text-center gap-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Balance</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">Connect a broker to view live balance</p>
                        <Button
                          size="sm"
                          onClick={() => setShowConnectDialog(true)}
                          className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] px-3 py-0.5 h-6 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow shadow-indigo-500/25"
                        >
                          Connect
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <p className="text-[10px] md:text-sm font-medium text-slate-500 dark:text-slate-400">Net Balance</p>
                          <h4 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-0.5">
                            {activeBroker === 'delta' ? '$' : '₹'}
                            {displayFunds.toLocaleString(activeBroker === 'delta' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h4>
                        </div>
                        <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Live</span>
                          <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                            <div className="w-1 h-1 rounded-full bg-emerald-500/20" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Journal Fund Card */}
                  {(() => {
                    const isLow = journalFundBase < 100;
                    const hasInfluencer = !!(influencerPeriod?.active && influencerPeriod.expiryDate && new Date(influencerPeriod.expiryDate) > new Date());
                    const isFree = hasInfluencer && !influencerHideUI;
                    const daysLeft = hasInfluencer ? Math.ceil((new Date(influencerPeriod!.expiryDate).getTime() - Date.now()) / 86400000) : 0;
                    return (
                      <div className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3 md:p-5 rounded-xl md:rounded-2xl border shadow-sm group hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative ${isFree ? 'border-pink-300/60 dark:border-pink-700/40' : 'border-white/40 dark:border-white/10'}`}>
                        {hasInfluencer && (
                          <button
                            onClick={toggleInfluencerHideUI}
                            className="absolute top-2.5 right-2.5 md:top-3 md:right-3 p-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
                            title={influencerHideUI ? "Show influencer view" : "Hide influencer tag"}
                            data-testid="button-influencer-hide-toggle"
                          >
                            {influencerHideUI ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                        )}
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                          <div className={`p-1.5 md:p-2 rounded-lg ${isFree ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400' : 'bg-green-500/10 text-green-600 dark:text-green-400'}`}>
                            {isFree ? <Gift className="w-4 h-4 md:w-5 md:h-5" /> : <Wallet className="w-4 h-4 md:w-5 md:h-5" />}
                          </div>
                          {isFree ? (
                            <Badge variant="outline" className="bg-pink-500/5 text-pink-600 border-pink-500/20 text-[9px] md:text-[10px] px-1.5 py-0 mr-5 md:mr-6">Free</Badge>
                          ) : (
                            <Badge variant="outline" className={`bg-green-500/5 text-green-600 border-green-500/20 text-[9px] md:text-[10px] px-1.5 py-0 ${hasInfluencer ? 'mr-5 md:mr-6' : ''}`}>Fund</Badge>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] md:text-sm font-medium text-slate-500 dark:text-slate-400">Available Balance</p>
                          <h4 className={`text-lg md:text-2xl font-black flex items-baseline gap-0.5 ${journalFundBase < 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                            ₹{Math.max(0, journalFundBase).toFixed(2)}
                          </h4>
                          {isFree ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-pink-500 shrink-0" />
                              <span className="text-[9px] md:text-[10px] font-bold text-pink-600 dark:text-pink-400">{daysLeft}d free</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowJournalChargesDialog(true)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors mt-1"
                              data-testid="button-journal-charges-info"
                            >
                              <span className="text-[9px] md:text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-tight">
                                {tradeHistoryData.length}t × ₹2+GST
                              </span>
                              <Info className="w-2.5 h-2.5 text-violet-400 dark:text-violet-500 shrink-0" />
                            </button>
                          )}
                        </div>
                        <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 md:gap-2">
                          <button
                            disabled
                            title="Payment gateway not integrated yet"
                            className="flex-1 py-1 md:py-1.5 px-2 md:px-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-[10px] md:text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed opacity-50"
                            data-testid="button-add-fund"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            Add
                          </button>
                          <button
                            onClick={() => setShowReferDialog(true)}
                            className="flex-1 py-1 md:py-1.5 px-2 md:px-3 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] md:text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                            data-testid="button-refer-friend"
                          >
                            <UserPlus className="w-2.5 h-2.5" />
                            Refer
                          </button>
                        </div>
                        {isFree ? (
                          <p className="text-[9px] text-pink-600 dark:text-pink-400 font-medium mt-1.5">🎁 No charges during free period</p>
                        ) : (
                          <p className="text-[9px] text-green-600 dark:text-green-400 font-medium mt-1.5">🎁 ₹1,000 joining offer applied</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Journal Charges Card */}
                  {(() => {
                    const tradeCount = tradeHistoryData.length;
                    const baseCharge = tradeCount * 2;
                    const gstAmount = baseCharge * 0.18;
                    const totalCharge = baseCharge + gstAmount;
                    const hasInfluencer = !!(influencerPeriod?.active && influencerPeriod.expiryDate && new Date(influencerPeriod.expiryDate) > new Date());
                    const isFree = hasInfluencer && !influencerHideUI;
                    const daysLeft = hasInfluencer ? Math.ceil((new Date(influencerPeriod!.expiryDate).getTime() - Date.now()) / 86400000) : 0;

                    const chargeTrendData = Object.keys(tradingDataByDate).sort().map(dateKey => {
                      const dayData = tradingDataByDate[dateKey];
                      const dayTrades = (dayData?.tradeHistory || []).length || (dayData?.tradingData?.performanceMetrics?.totalTrades || dayData?.performanceMetrics?.totalTrades || 0);
                      const dayBase = dayTrades * 2;
                      const dayTotal = dayBase * 1.18;
                      return { date: dateKey, trades: dayTrades, charge: parseFloat(dayTotal.toFixed(2)) };
                    }).filter(d => d.trades > 0);

                    const avgDailyTrades = chargeTrendData.length > 0
                      ? chargeTrendData.reduce((s, d) => s + d.trades, 0) / chargeTrendData.length
                      : 0;
                    const isOverTrading = !isFree && tradeCount > avgDailyTrades * 1.5 && avgDailyTrades > 0;

                    return (
                      <div
                        className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3 md:p-5 rounded-xl md:rounded-2xl border shadow-sm group hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer relative ${isFree ? 'border-pink-300/60 dark:border-pink-700/40' : 'border-white/40 dark:border-white/10'}`}
                        onClick={() => { if (!isFree) setShowJournalChargesDialog(true); }}
                        data-testid="journal-charges-card"
                      >
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                          <div className={`p-1.5 md:p-2 rounded-lg ${isFree ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400' : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'}`}>
                            {isFree ? <Gift className="w-4 h-4 md:w-5 md:h-5" /> : <Receipt className="w-4 h-4 md:w-5 md:h-5" />}
                          </div>
                          {isFree ? (
                            <Badge variant="outline" className="bg-pink-500/5 text-pink-600 border-pink-500/20 text-[9px] md:text-[10px] px-1.5 py-0">Free</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-violet-500/5 text-violet-600 border-violet-500/20 text-[9px] md:text-[10px] px-1.5 py-0">Fee</Badge>
                          )}
                        </div>
                        {isFree ? (
                          <div className="space-y-1">
                            <p className="text-[10px] md:text-sm font-medium text-slate-500 dark:text-slate-400">Journal Charges</p>
                            <h4 className="text-lg md:text-2xl font-black text-pink-600 dark:text-pink-400 flex items-baseline gap-0.5 line-through decoration-1 opacity-50">
                              ₹{totalCharge.toFixed(2)}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Gift className="w-3 h-3 text-pink-500" />
                              <span className="text-xs md:text-sm font-black text-green-600 dark:text-green-400">₹0 — Free!</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
                              <Clock className="w-2.5 h-2.5 text-pink-500 shrink-0" />
                              <span className="text-[9px] md:text-[10px] font-bold text-pink-600 dark:text-pink-400">{daysLeft}d left</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-[10px] md:text-sm font-medium text-slate-500 dark:text-slate-400">Journal Charges</p>
                            <h4 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-0.5">
                              ₹{totalCharge.toFixed(2)}
                            </h4>
                            <p className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500">
                              {tradeCount}t × ₹2 + 18% GST
                            </p>
                          </div>
                        )}
                        <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            {isOverTrading && <span className="text-orange-500">⚠</span>}
                            {isFree ? 'Free' : isOverTrading ? 'Over-Trading' : 'Today'}
                          </span>
                          <div className="flex gap-1">
                            <div className={`w-1 h-1 rounded-full ${isFree ? 'bg-pink-500' : 'bg-violet-500'}`} />
                            <div className={`w-1 h-1 rounded-full ${isFree ? 'bg-pink-500/40' : 'bg-violet-500/40'}`} />
                            <div className={`w-1 h-1 rounded-full ${isFree ? 'bg-pink-500/20' : 'bg-violet-500/20'}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* P&L Impact Card */}
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/40 dark:border-white/10 shadow-sm group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                      <div className="p-1.5 md:p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Activity className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <Badge variant="outline" className="bg-indigo-500/5 text-indigo-600 border-indigo-500/20 text-[9px] md:text-xs px-1.5 py-0">P&L</Badge>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] md:text-sm font-medium text-slate-500 dark:text-slate-400">Unrealized P&L</p>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Brokerage</span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="text-slate-400 hover:text-indigo-500 transition-colors">
                                <Info className="w-3 h-3" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90dvh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between gap-2 text-xl font-bold">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                      <Activity className="w-5 h-5" />
                                    </div>
                                    Charges Information
                                  </div>
                                  <DialogClose className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <X className="w-4 h-4" />
                                  </DialogClose>
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-slate-400">
                                  Latest F&O charges (India – NSE 2025-2026)
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                      <span></span> Government & Exchange Charges
                                    </h4>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                      <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/30 text-slate-500">
                                        <tr>
                                          <th className="px-4 py-2 font-bold">Charge</th>
                                          <th className="px-4 py-2 font-bold">Futures</th>
                                          <th className="px-4 py-2 font-bold">Options</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        <tr>
                                          <td className="px-4 py-2 font-medium">STT</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">0.02% on sell value</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">0.1% on sell premium</td>
                                        </tr>
                                        <tr>
                                          <td className="px-4 py-2 font-medium">Exchange transaction</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">0.00173%</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">0.03503% (premium)</td>
                                        </tr>
                                        <tr>
                                          <td className="px-4 py-2 font-medium">SEBI charges</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">₹10 per crore</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">₹10 per crore</td>
                                        </tr>
                                        <tr>
                                          <td className="px-4 py-2 font-medium">Stamp duty</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">0.002% buy side</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">0.003% buy side</td>
                                        </tr>
                                        <tr>
                                          <td className="px-4 py-2 font-medium">GST</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400" colSpan={2}>18% on brokerage + exchange + SEBI</td>
                                        </tr>
                                        <tr>
                                          <td className="px-4 py-2 font-medium">IPFT</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">0.0001%</td>
                                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">0.0005%</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                                  <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-2">Pro Tip</h5>
                                  <p className="text-sm text-amber-600 dark:text-amber-500 leading-relaxed">
                                    Most option traders remember this: ₹50 – ₹80 charges per trade (1 lot options) or ₹200 – ₹400 charges per lot in futures.
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <h4 className={`text-lg md:text-2xl font-black flex items-baseline gap-0.5 ${performanceMetrics.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {activeBroker === 'delta' ? '$' : '₹'}
                        {performanceMetrics.netPnL.toLocaleString(activeBroker === 'delta' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase">Brokerage:</span>
                        <span
                          className="text-[9px] md:text-[10px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          onClick={() => setShowBrokerageChargesDialog(true)}
                          data-testid="brokerage-amount-clickable"
                        >
                          {activeBroker === 'delta' ? '$' : '₹'}
                          {(() => {
                            const totalEstCharges = tradeHistoryData?.reduce((acc, trade) => {
                              const isBuy = trade.order === 'BUY';
                              const price = parseFloat(trade.price) || 0;
                              const qty = parseInt(trade.qty) || 0;
                              const tradeValue = price * qty;
                              const brokerage = 20;

                              let stt = 0;
                              let stamp = 0;

                              if (isBuy) {
                                stamp = tradeValue * 0.00003;
                                stt = 0;
                              } else {
                                stt = tradeValue * 0.001;
                                stamp = 0;
                              }

                              const exchange = tradeValue * 0.0003503;
                              const sebi = tradeValue * 0.0000001;
                              const ipft = tradeValue * 0.000005;
                              const gst = (brokerage + exchange + sebi + ipft) * 0.18;

                              return acc + brokerage + stt + exchange + sebi + stamp + ipft + gst;
                            }, 0) || 0;

                            return totalEstCharges.toLocaleString(activeBroker === 'delta' ? 'en-US' : 'en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            });
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Session</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                        <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                        <div className="w-1 h-1 rounded-full bg-indigo-500/20" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>}

      {/* Broker Breakup Dialog */}
      <Dialog open={showBrokerBreakupDialog} onOpenChange={setShowBrokerBreakupDialog}>
        <DialogContent className="max-w-[340px] p-0 bg-white dark:bg-[#1a1c2e] border-none rounded-[24px] shadow-2xl overflow-hidden [&>button]:hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-800 dark:text-slate-200">Capital Breakup</span>
              </div>
              <button
                onClick={() => setShowBrokerBreakupDialog(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(allBrokerFunds)
                .filter(([_, funds]) => (funds as number) > 0)
                .map(([brokerId, funds]) => (
                <div key={brokerId as string} className="flex items-center justify-between p-3 rounded-[18px] bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/30 dark:border-slate-700/20">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 p-1 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                        <img
                          className="w-full h-full object-contain rounded-full"
                          src={brokerIconMap[brokerId as string]}
                          alt={brokerId as string}
                        />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1a1c2e]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">{getBrokerDisplayName(brokerId as string)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Connected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-slate-900 dark:text-white">
                      {(brokerId as string) === "delta" ? "$" : "₹"}{(funds as number).toLocaleString((brokerId as string) === "delta" ? "en-US" : "en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] font-bold text-slate-300 dark:text-slate-500">
                      {((funds as number) / totalBrokerFunds * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800/30 flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.05em] text-slate-400 dark:text-slate-500">Total Assets</p>
              <p className="text-[18px] font-black text-indigo-600 dark:text-indigo-400">
                ₹{totalBrokerFunds.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setShowBrokerBreakupDialog(false)}
                className="w-full h-11 bg-[#0f172a] hover:bg-[#1e293b] dark:bg-slate-900 dark:hover:bg-slate-800 text-white rounded-[14px] text-[14px] font-bold transition-all shadow-lg active:scale-[0.98]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Journal Charges Dialog */}
      <Dialog open={showJournalChargesDialog} onOpenChange={setShowJournalChargesDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 px-4 md:px-6">
          <button
            onClick={() => setShowJournalChargesDialog(false)}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            data-testid="close-journal-charges-dialog"
          >
            <X className="w-4 h-4" />
          </button>
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-bold">
              <div className="p-1.5 md:p-2 bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400 shrink-0">
                <Receipt className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              Journal Charges
            </DialogTitle>
            <DialogDescription className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400">
              ₹2 per trade + 18% GST
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const tradeCount = tradeHistoryData.length;
            const baseCharge = tradeCount * 2;
            const gstAmount = parseFloat((baseCharge * 0.18).toFixed(2));
            const totalCharge = parseFloat((baseCharge + gstAmount).toFixed(2));

            const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const fomoTrendData = Object.keys(tradingDataByDate).sort().map(dateKey => {
              const dayData = tradingDataByDate[dateKey];
              const dayTrades = (dayData?.tradeHistory || []).length || (dayData?.tradingData?.performanceMetrics?.totalTrades || dayData?.performanceMetrics?.totalTrades || 0);
              const [, mm, dd] = dateKey.split('-');
              const label = `${MONTH_ABBR[parseInt(mm, 10) - 1]} ${parseInt(dd, 10)}`;
              return { date: label, fullDate: dateKey, trades: dayTrades };
            }).filter(d => d.trades > 0).slice(-30);

            const avgDailyTrades = fomoTrendData.length > 0
              ? fomoTrendData.reduce((s, d) => s + d.trades, 0) / fomoTrendData.length
              : 0;
            const avgDailyCharge = fomoTrendData.length > 0
              ? fomoTrendData.reduce((s, d) => s + d.trades * 2 * 1.18, 0) / fomoTrendData.length
              : 0;
            const isOverTrading = tradeCount > avgDailyTrades * 1.5 && avgDailyTrades > 0;
            const isFOMO = tradeCount > avgDailyTrades * 2 && avgDailyTrades > 0;

            return (
              <div className="space-y-3 md:space-y-5 py-1">
                {/* Charge Summary */}
                <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                  <div className="bg-violet-50 dark:bg-violet-500/10 rounded-lg px-2 md:px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between border border-violet-100 dark:border-violet-500/20 gap-1">
                    <p className="text-[9px] md:text-[10px] font-bold text-violet-500 uppercase tracking-wide">Trades</p>
                    <div className="md:text-right">
                      <p className="text-sm font-black text-violet-700 dark:text-violet-300">{tradeCount}</p>
                      <p className="text-[9px] text-violet-400">× ₹2</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 md:px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between border border-slate-200 dark:border-slate-700 gap-1">
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide">GST 18%</p>
                    <div className="md:text-right">
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">₹{gstAmount.toFixed(2)}</p>
                      <p className="text-[9px] text-slate-400">on ₹{baseCharge.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-2 md:px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between border border-emerald-100 dark:border-emerald-500/20 gap-1">
                    <p className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Total</p>
                    <div className="md:text-right">
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">₹{totalCharge.toFixed(2)}</p>
                      <p className="text-[9px] text-emerald-500">incl. GST</p>
                    </div>
                  </div>
                </div>

                {/* Per-trade Breakdown */}
                {tradeCount > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                      <h4 className="text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-300">Per-Trade Breakdown</h4>
                    </div>
                    <div className="max-h-40 md:max-h-48 overflow-y-auto">
                      <table className="w-full text-[10px] md:text-xs text-left">
                        <thead className="text-[9px] md:text-[10px] uppercase bg-slate-50/80 dark:bg-slate-800/30 text-slate-500 sticky top-0">
                          <tr>
                            <th className="px-1.5 md:px-3 py-1.5 font-bold">#</th>
                            <th className="px-1.5 md:px-3 py-1.5 font-bold">Trade</th>
                            <th className="px-1.5 md:px-3 py-1.5 font-bold text-right">Base</th>
                            <th className="px-1.5 md:px-3 py-1.5 font-bold text-right">GST</th>
                            <th className="px-1.5 md:px-3 py-1.5 font-bold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {tradeHistoryData.map((trade: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="px-1.5 md:px-3 py-1.5 text-slate-400">{idx + 1}</td>
                              <td className="px-1.5 md:px-3 py-1.5 max-w-[90px] md:max-w-none truncate">
                                <span className={`font-bold ${trade.order === 'BUY' ? 'text-emerald-600' : 'text-red-500'}`}>{trade.order}</span>
                                <span className="text-slate-600 dark:text-slate-400 ml-1 truncate">{trade.symbol || trade.name || '-'}</span>
                              </td>
                              <td className="px-1.5 md:px-3 py-1.5 text-right text-slate-600 dark:text-slate-400">₹2.00</td>
                              <td className="px-1.5 md:px-3 py-1.5 text-right text-slate-500">₹0.36</td>
                              <td className="px-1.5 md:px-3 py-1.5 text-right font-bold text-violet-600 dark:text-violet-400">₹2.36</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-violet-50 dark:bg-violet-500/10 border-t border-violet-100 dark:border-violet-500/20">
                          <tr>
                            <td className="px-1.5 md:px-3 py-1.5 font-bold text-violet-700 dark:text-violet-300 text-[9px] md:text-[10px]" colSpan={2}>{tradeCount} trades</td>
                            <td className="px-1.5 md:px-3 py-1.5 text-right font-bold text-violet-700 dark:text-violet-300">₹{baseCharge.toFixed(2)}</td>
                            <td className="px-1.5 md:px-3 py-1.5 text-right font-bold text-violet-700 dark:text-violet-300">₹{gstAmount.toFixed(2)}</td>
                            <td className="px-1.5 md:px-3 py-1.5 text-right font-black text-violet-700 dark:text-violet-300">₹{totalCharge.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* FOMO & Over-Trading Performance Trend */}
                {fomoTrendData.length > 1 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <h4 className="text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">FOMO Trend</h4>
                      <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-orange-500 rounded" /> Trades</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-violet-400 rounded" /> Avg</span>
                      </div>
                    </div>
                    <div className="p-2 md:p-3">
                      <ResponsiveContainer width="100%" height={130}>
                        <LineChart data={fomoTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                          <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={20} />
                          <Tooltip
                            content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                const d = payload[0]?.payload;
                                const pct = avgDailyTrades > 0 ? Math.round(((d.trades - avgDailyTrades) / avgDailyTrades) * 100) : 0;
                                const isOver = d.trades > avgDailyTrades * 1.5;
                                const isFomoDay = d.trades > avgDailyTrades * 2;
                                return (
                                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 shadow-lg text-[10px]">
                                    <p className="font-bold text-slate-700 dark:text-slate-200 mb-0.5">{label}</p>
                                    <p className="text-orange-500">{d.trades} trades</p>
                                    {isOver && <p className={`font-bold ${isFomoDay ? 'text-red-500' : 'text-orange-400'}`}>{isFomoDay ? '🔥 FOMO' : '⚠ Over'} +{pct}%</p>}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={avgDailyTrades} stroke="#8b5cf6" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: 'Avg', position: 'right', fontSize: 7, fill: '#8b5cf6' }} />
                          <ReferenceLine y={avgDailyTrades * 2} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'FOMO', position: 'right', fontSize: 7, fill: '#ef4444' }} />
                          <Line type="monotone" dataKey="trades" stroke="#f97316" strokeWidth={2} dot={({ cx, cy, payload, index }: any) => {
                            const isFomoDay = avgDailyTrades > 0 && payload.trades > avgDailyTrades * 2;
                            const isOverDay = avgDailyTrades > 0 && payload.trades > avgDailyTrades * 1.5;
                            const color = isFomoDay ? '#ef4444' : isOverDay ? '#f97316' : '#8b5cf6';
                            return <circle key={`fomo-dot-${index}`} cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
                          }} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Plans Section */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h4 className="text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-300">Choose Your Plan</h4>
                    <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 px-2 py-0.5 rounded-full">Pro Active</span>
                  </div>
                  <div className="p-2 md:p-3 grid grid-cols-2 gap-2 md:gap-3">
                    {/* Basic Plan — disabled, Pro is active */}
                    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col overflow-hidden opacity-60">
                      <div className="bg-slate-100 dark:bg-slate-800 px-2 md:px-3 py-1.5 md:py-2 text-center">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Basic</p>
                        <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">₹2<span className="text-[10px] md:text-xs font-normal text-slate-400">/trade</span></p>
                      </div>
                      <div className="p-2 md:p-3 flex-1 space-y-1 md:space-y-1.5 text-[9px] md:text-[10px]">
                        <div className="flex items-center gap-1 md:gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="font-bold">✓</span> Chart analysis</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-slate-400 line-through"><span>✗</span> Image uploads</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-slate-400 line-through"><span>✗</span> Past chart analysis</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-slate-400 line-through"><span>✗</span> Paper trading</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-slate-400 line-through"><span>✗</span> Multi-broker</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-slate-400 line-through"><span>✗</span> FOMO tracking</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-slate-400 line-through"><span>✗</span> Time analysis</div>
                      </div>
                      <div className="p-2 md:p-3 pt-0">
                        <button
                          disabled
                          className="w-full py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-bold cursor-not-allowed"
                          data-testid="activate-basic-plan"
                        >
                          Not Available
                        </button>
                      </div>
                    </div>

                    {/* Pro Plan — active by default */}
                    <div className="rounded-xl border-2 border-violet-500 dark:border-violet-400 bg-white dark:bg-slate-900 flex flex-col overflow-hidden relative ring-2 ring-violet-400/30 shadow-lg shadow-violet-500/10">
                      <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">60% OFF</div>
                      <div className="bg-violet-600 px-2 md:px-3 py-1.5 md:py-2 text-center">
                        <p className="text-[9px] md:text-[10px] font-bold text-violet-200 uppercase tracking-widest">Pro</p>
                        <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-0.5">
                          <p className="text-xs md:text-sm font-bold text-violet-300 relative">
                            ₹5
                            <span className="absolute inset-0 flex items-center">
                              <span className="w-full border-t-2 border-red-400" />
                            </span>
                          </p>
                          <p className="text-lg md:text-2xl font-black text-white">₹2<span className="text-[10px] md:text-xs font-normal text-violet-300">/trade</span></p>
                        </div>
                      </div>
                      <div className="p-2 md:p-3 flex-1 space-y-1 md:space-y-1.5 text-[9px] md:text-[10px]">
                        <div className="flex items-center gap-1 md:gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="font-bold">✓</span> Live chart analysis</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="font-bold">✓</span> Image uploads</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="font-bold">✓</span> Past chart analysis</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="font-bold">✓</span> Paper trading</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="font-bold">✓</span> 2 broker accounts</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="font-bold">✓</span> FOMO tracking</div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="font-bold">✓</span> Time analysis</div>
                      </div>
                      <div className="p-2 md:p-3 pt-0">
                        <div
                          className="w-full py-1.5 rounded-lg bg-violet-600 text-white text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 cursor-default"
                          data-testid="pro-plan-active"
                        >
                          <span>✓</span> Pro Active — ₹2/trade
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Brokerage Charges Dialog */}
      <Dialog open={showBrokerageChargesDialog} onOpenChange={setShowBrokerageChargesDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90dvh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Brokerage Charges Breakdown</DialogTitle>
            <DialogDescription>
              Detailed charge calculation for each trade in your session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-2 font-semibold">Trade</th>
                    <th className="text-left p-2 font-semibold">Type</th>
                    <th className="text-right p-2 font-semibold">Price</th>
                    <th className="text-right p-2 font-semibold">Qty</th>
                    <th className="text-right p-2 font-semibold">Value</th>
                    <th className="text-right p-2 font-semibold">Brokerage</th>
                    <th className="text-right p-2 font-semibold">STT</th>
                    <th className="text-right p-2 font-semibold">Exchange</th>
                    <th className="text-right p-2 font-semibold">SEBI</th>
                    <th className="text-right p-2 font-semibold">Stamp</th>
                    <th className="text-right p-2 font-semibold">IPFT</th>
                    <th className="text-right p-2 font-semibold">GST</th>
                    <th className="text-right p-2 font-semibold font-bold">Total Charges</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistoryData?.map((trade, idx) => {
                    const isBuy = trade.order === 'BUY';
                    const price = parseFloat(trade.price) || 0;
                    const qty = parseInt(trade.qty) || 0;
                    const tradeValue = price * qty;

                    const symbol = (trade.symbol || trade.name || '').toUpperCase();
                    const isFutures = /FUT/.test(symbol);
                    const isOptions = /(CE|PE)/.test(symbol);
                    const isEquity = !isFutures && !isOptions;

                    let brokerage = 20;
                    let stt = 0;
                    let stamp = 0;
                    let exchange = 0;
                    let sebi = 0;
                    let ipft = 0;

                    if (isEquity) {
                      brokerage = 20;
                      if (isBuy) {
                        stamp = tradeValue * 0.0001;
                        exchange = tradeValue * 0.00307;
                        sebi = tradeValue * 0.0000001;
                        stt = 0;
                      } else {
                        stt = tradeValue * 0.001;
                        exchange = tradeValue * 0.00307;
                        sebi = tradeValue * 0.0000001;
                        stamp = 0;
                      }
                    } else if (isFutures) {
                      brokerage = 20;
                      if (isBuy) {
                        stamp = tradeValue * 0.00002;
                        exchange = tradeValue * 0.0000183;
                        sebi = tradeValue * 0.0000001;
                        stt = 0;
                      } else {
                        stt = tradeValue * 0.0002;
                        exchange = tradeValue * 0.0000183;
                        sebi = tradeValue * 0.0000001;
                        stamp = 0;
                      }
                    } else if (isOptions) {
                      brokerage = 20;
                      if (isBuy) {
                        stamp = tradeValue * 0.00003;
                        exchange = tradeValue * 0.0003553;
                        sebi = tradeValue * 0.0000001;
                        stt = 0;
                      } else {
                        stt = tradeValue * 0.001;
                        exchange = tradeValue * 0.0003553;
                        sebi = tradeValue * 0.0000001;
                        stamp = 0;
                      }
                    }

                    const gst = (brokerage + exchange + sebi) * 0.18;
                    const totalCharges = brokerage + stt + exchange + sebi + stamp + gst;

                    return (
                      <tr
                        key={`${idx}`}
                        className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 ${
                          isBuy
                            ? 'bg-green-50/30 dark:bg-green-900/10'
                            : 'bg-red-50/30 dark:bg-red-900/10'
                        }`}
                      >
                        <td className="p-2 font-semibold">{idx + 1}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isBuy
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                          }`}>
                            {isBuy ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td className="text-right p-2">₹{price.toFixed(2)}</td>
                        <td className="text-right p-2">{qty}</td>
                        <td className="text-right p-2">₹{tradeValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="text-right p-2">₹{brokerage.toFixed(2)}</td>
                        <td className="text-right p-2">₹{stt.toFixed(2)}</td>
                        <td className="text-right p-2">₹{exchange.toFixed(2)}</td>
                        <td className="text-right p-2">₹{sebi.toFixed(2)}</td>
                        <td className="text-right p-2">₹{stamp.toFixed(2)}</td>
                        <td className="text-right p-2">₹{ipft.toFixed(2)}</td>
                        <td className="text-right p-2">₹{gst.toFixed(2)}</td>
                        <td className={`text-right p-2 font-bold ${
                          isBuy
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          ₹{totalCharges.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Charge Types by Trade Type:</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">Futures (Symbol contains "FUT"):</h5>
                  <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 ml-2">
                    <li>• <strong>Brokerage:</strong> ₹20 per trade (0.03% or ₹20 whichever is lower)</li>
                    <li>• <strong>STT:</strong> 0.02% on sell value</li>
                    <li>• <strong>Transaction:</strong> 0.00183% NSE</li>
                    <li>• <strong>Stamp Duty:</strong> 0.002% on buy side</li>
                    <li>• <strong>SEBI:</strong> ₹10 per crore</li>
                    <li>• <strong>GST:</strong> 18% on (Brokerage + Exchange + SEBI)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">Options (Symbol contains "CE" or "PE"):</h5>
                  <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 ml-2">
                    <li>• <strong>Brokerage:</strong> Flat ₹20 per executed order</li>
                    <li>• <strong>STT:</strong> 0.1% on sell side (premium)</li>
                    <li>• <strong>Transaction:</strong> 0.03553% NSE</li>
                    <li>• <strong>Stamp Duty:</strong> 0.003% on buy side</li>
                    <li>• <strong>SEBI:</strong> ₹10 per crore</li>
                    <li>• <strong>GST:</strong> 18% on (Brokerage + Exchange + SEBI)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Fund Dialog */}
      <Dialog open={showAddFundDialog} onOpenChange={setShowAddFundDialog}>
        <DialogContent className="w-[95vw] max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
          <button
            onClick={() => setShowAddFundDialog(false)}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            data-testid="close-add-fund-dialog"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black">Add Journal Fund</h3>
            <p className="text-sm text-indigo-100 mt-1">Current balance: <span className="font-black text-white">₹{Math.max(0, journalFundBase).toFixed(2)}</span></p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={addFundAmount}
                onChange={e => setAddFundAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFund()}
                placeholder="Enter amount"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                data-testid="input-add-fund-amount"
                autoFocus
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 2000, 5000].map(preset => (
                <button
                  key={preset}
                  onClick={() => setAddFundAmount(String(preset))}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200/50 dark:border-indigo-500/20"
                  data-testid={`button-preset-${preset}`}
                >
                  +₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddFund}
              disabled={addFundLoading || !addFundAmount || parseFloat(addFundAmount) <= 0}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-confirm-add-fund"
            >
              {addFundLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {addFundLoading ? 'Adding...' : 'Add Fund'}
            </button>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">Journal Fund is used for saving trades and accessing premium journal features.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refer Dialog */}
      <Dialog open={showReferDialog} onOpenChange={(open) => { setShowReferDialog(open); if (!open) { setShowReferredList(false); refreshWalletBalance(); } }}>
        <DialogContent className="w-[95vw] max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
          {/* Header actions */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <button
              onClick={() => setShowReferredList(v => !v)}
              className={`p-1.5 rounded-full transition-colors relative ${showReferredList ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
              data-testid="toggle-referred-list"
              title="View referred friends"
            >
              <Users className="w-4 h-4" />
              {referredUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {referredUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowReferDialog(false)}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              data-testid="close-refer-dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hero */}
          <div className={`bg-gradient-to-br ${showReferredList ? 'from-slate-600 to-slate-800' : 'from-violet-500 to-purple-600'} p-5 text-white text-center transition-all`}>
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
              {showReferredList ? <Users className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <h3 className="text-base font-black">{showReferredList ? 'Your Referred Friends' : 'Refer & Earn'}</h3>
            <p className="text-xs text-white/80 mt-0.5">
              {showReferredList
                ? `${referredUsers.length} friend${referredUsers.length !== 1 ? 's' : ''} joined via your code · ₹${(referredUsers.length * 200).toLocaleString('en-IN')} earned`
                : <>Get <span className="font-black text-white">₹200</span> for every friend who joins with your code</>
              }
            </p>
          </div>

          {showReferredList ? (
            /* ── Referred Friends List ── */
            <div className="px-3 pt-2 pb-3">
              {referralProfileLoading ? (
                <div className="flex items-center justify-center py-6">
                  <span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : referredUsers.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No referrals yet</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Share your code to earn ₹200 per friend</p>
                </div>
              ) : (
                <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '155px' }}>
                  {referredUsers.map((user, i) => (
                    <div key={user.userId || i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/70 rounded-lg px-2.5 py-1.5" data-testid={`referred-user-${i}`}>
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 dark:bg-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-600 dark:text-violet-400 text-[9px] font-black">
                          {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate leading-tight">{user.name || user.email || 'User'}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                          {new Date(user.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-green-600 dark:text-green-400 flex-shrink-0">+₹200</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Refer & Earn Form ── */
            <div className="p-5 space-y-4">
              {referralProfileLoading ? (
                <div className="flex items-center justify-center py-6">
                  <span className="w-5 h-5 border-2 border-violet-400/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Referral Code */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Your Referral Code</p>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                      <span className="flex-1 font-black text-slate-900 dark:text-white tracking-wider text-sm">
                        {myReferralCode || '...'}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(myReferralCode);
                          toast({ title: "Code copied!", description: "Share this code with friends." });
                        }}
                        className="text-violet-500 hover:text-violet-600 transition-colors"
                        data-testid="copy-referral-code"
                        disabled={!myReferralCode}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Shareable Link */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Shareable Link</p>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 overflow-hidden">
                        <Link2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                          {myReferralCode ? `perala.app/?ref=${myReferralCode}` : '...'}
                        </span>
                      </div>
                      <button
                        onClick={copyReferralLink}
                        disabled={!myReferralCode}
                        className="px-3 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 transition-colors text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
                        data-testid="copy-referral-link"
                      >
                        <Share2 className="w-3 h-3" />
                        Share
                      </button>
                    </div>
                  </div>

                  {/* Apply Code */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Have a Referral Code?</p>
                    {referralApplied ? (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-4 py-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-green-700 dark:text-green-400">₹200 referral bonus applied!</p>
                          {referralProfile?.referredByCode && (
                            <p className="text-[10px] text-green-600/70 dark:text-green-400/70">Code: {referralProfile.referredByCode}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={referralCodeInput}
                          onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                          placeholder="Enter code e.g. PERALAABCDEF"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                          data-testid="input-referral-code"
                          onKeyDown={e => e.key === 'Enter' && handleApplyReferral()}
                        />
                        <button
                          onClick={handleApplyReferral}
                          disabled={applyReferralLoading || !referralCodeInput.trim()}
                          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          data-testid="button-apply-referral"
                        >
                          {applyReferralLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-3 text-[11px] text-violet-700 dark:text-violet-300 leading-relaxed">
                    Share your link → Friend signs up → <span className="font-bold">Both get ₹200</span> added instantly.
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
