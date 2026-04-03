import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, Brain, Trophy, TrendingUp, TrendingDown, Minus, X, Flame } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCognitoToken } from "@/cognito";

const DEFAULT_DAILY_LIMIT_SECS = 7200; // 2 hours
const SAVE_INTERVAL_MS = 60_000; // save every 60s

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtTimeShort(seconds: number): string {
  if (seconds < 60) return `<1m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  return `${m}m`;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function formatDate(dateStr: string): string {
  const [, mo, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(mo) - 1]} ${parseInt(d)}`;
}

interface ScreenTimeEntry {
  date: string;
  totalSeconds: number;
  sessions: number;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalSeconds: number;
  rank: number;
}

interface Props {
  tradingDataByDate?: Record<string, any>;
}

export default function JournalScreenTime({ tradingDataByDate = {} }: Props) {
  const [open, setOpen] = useState(false);
  const [sessionSecs, setSessionSecs] = useState(0);
  const [history, setHistory] = useState<ScreenTimeEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; totalSeconds: number } | null>(null);
  const [leaderTotal, setLeaderTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(DEFAULT_DAILY_LIMIT_SECS);
  const [limitInput, setLimitInput] = useState("120"); // minutes
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [btnVisible, setBtnVisible] = useState(true);

  const sessionStart = useRef(Date.now());
  const lastSaved = useRef(0); // seconds already saved this session
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScrollY = useRef(0);

  // Today's total = history entry + unsaved session seconds
  const todayHistory = history.find(h => h.date === todayKey());
  const savedTodaySecs = todayHistory?.totalSeconds || 0;
  const totalTodaySecs = savedTodaySecs + sessionSecs;

  const pct = Math.min(1, totalTodaySecs / dailyLimit);
  const limitReached = totalTodaySecs >= dailyLimit;

  // ── Auth helper ──────────────────────────────────────────────
  async function authHeaders(): Promise<Record<string, string> | null> {
    const token = await getCognitoToken();
    if (!token) return null;
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }

  // ── Save session chunk to API ────────────────────────────────
  const saveChunk = useCallback(async (force = false) => {
    if (!isAuthenticated) return;
    const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
    const unsaved = elapsed - lastSaved.current;
    if (unsaved < 5 && !force) return; // nothing meaningful
    try {
      const hdrs = await authHeaders();
      if (!hdrs) return;
      await fetch("/api/journal/screen-time", {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify({ date: todayKey(), seconds: unsaved })
      });
      lastSaved.current = elapsed;
    } catch (_) {}
  }, [isAuthenticated]);

  // ── Load history & leaderboard ───────────────────────────────
  async function loadData() {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const hdrs = await authHeaders();
      if (!hdrs) return;
      const [histRes, lbRes] = await Promise.all([
        fetch("/api/journal/screen-time?days=30", { headers: hdrs }),
        fetch(`/api/journal/screen-time/leaderboard?date=${todayKey()}`, { headers: hdrs })
      ]);
      if (histRes.ok) {
        const d = await histRes.json();
        const sorted = (d.history || []).sort((a: ScreenTimeEntry, b: ScreenTimeEntry) =>
          b.date.localeCompare(a.date)
        );
        setHistory(sorted);
      }
      if (lbRes.ok) {
        const d = await lbRes.json();
        setLeaderboard(d.leaderboard || []);
        setMyRank(d.myRank || null);
        setLeaderTotal(d.total || 0);
      }
    } catch (_) {} finally {
      setLoading(false);
    }
  }

  // ── Check auth on mount ──────────────────────────────────────
  useEffect(() => {
    getCognitoToken().then(token => {
      setIsAuthenticated(!!token);
    });
  }, []);

  // ── Mobile scroll hide/show ──────────────────────────────────
  useEffect(() => {
    // Only apply on mobile (md breakpoint = 768px)
    const handleScroll = (e: Event) => {
      if (window.innerWidth >= 768) return;
      const target = e.target as HTMLElement;
      const currentY = target.scrollTop ?? 0;
      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) < 4) return; // ignore tiny jitter
      setBtnVisible(delta < 0 || currentY < 60); // hide on down, show on up or near top
      lastScrollY.current = currentY;
    };

    // Attach to all overflow-auto scroll containers (capture phase)
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  // ── Start session timer ──────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    sessionStart.current = Date.now();
    lastSaved.current = 0;

    // Tick every second for display
    intervalRef.current = setInterval(() => {
      setSessionSecs(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, 1000);

    // Save every 60s
    saveTimerRef.current = setInterval(() => saveChunk(), SAVE_INTERVAL_MS);

    // Load initial data
    loadData();

    return () => {
      clearInterval(intervalRef.current!);
      clearInterval(saveTimerRef.current!);
      // Save remaining on unmount
      saveChunk(true);
    };
  }, [isAuthenticated]);

  // ── Reload data when dialog opens ───────────────────────────
  useEffect(() => {
    if (open && isAuthenticated) {
      saveChunk(true).then(() => loadData());
    }
  }, [open]);

  // ── Psychology insight ───────────────────────────────────────
  const psychInsight = (() => {
    if (history.length < 2) {
      return { text: "Keep journaling — insights appear after a few sessions.", color: "text-violet-400", trend: "neutral" };
    }
    const last7 = history.slice(0, 7);
    const avg7 = last7.reduce((s, h) => s + h.totalSeconds, 0) / last7.length;
    const yesterday = history.find(h => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return h.date === `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    });

    if (limitReached) {
      return { text: "You've hit your daily limit. Step back, let your thoughts settle. Overanalyzing is also a trading risk.", color: "text-red-400", trend: "warn" };
    }
    if (totalTodaySecs > avg7 * 1.4) {
      return { text: "Deep focus session — you're investing more time today. Traders who journal consistently see 23% better discipline scores.", color: "text-emerald-400", trend: "up" };
    }
    if (totalTodaySecs < avg7 * 0.5 && avg7 > 0) {
      return { text: "Quick session. Don't rush your review — the quality of your journal reflection directly impacts trade discipline.", color: "text-amber-400", trend: "down" };
    }
    if (yesterday && totalTodaySecs > yesterday.totalSeconds) {
      return { text: "More engaged than yesterday. Consistent reflection builds psychological edge over time.", color: "text-emerald-400", trend: "up" };
    }
    return { text: "Steady journaling pace. Consistency matters more than duration — you're building the right habit.", color: "text-violet-400", trend: "neutral" };
  })();

  // ── P&L correlation insight ──────────────────────────────────
  const pnlCorrelation = (() => {
    const entries = Object.entries(tradingDataByDate);
    if (entries.length < 3) return null;
    const withPnl = entries.map(([date, v]: [string, any]) => {
      const d = v?.tradingData || v;
      const pnl = d?.performanceMetrics?.totalPnL ?? 0;
      return { date, pnl };
    }).filter(e => e.pnl !== 0);
    if (withPnl.length < 3) return null;
    const winners = withPnl.filter(e => e.pnl > 0).length;
    const pct = Math.round((winners / withPnl.length) * 100);
    if (pct >= 60) {
      return `Your trade history shows ${pct}% win rate. Structured reflection is working — keep going.`;
    }
    return `Your data shows ${100 - pct}% of days had losses. More journal time helps identify repeating mistakes.`;
  })();

  // ── Bar color for history ────────────────────────────────────
  function barColor(secs: number): string {
    const p = secs / dailyLimit;
    if (p >= 1) return "bg-red-500";
    if (p >= 0.7) return "bg-amber-500";
    if (p >= 0.3) return "bg-emerald-500";
    return "bg-violet-500";
  }

  // ── Medal for leaderboard ────────────────────────────────────
  function medalLabel(rank: number) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {/* ── Floating pill button ───────────────────── */}
      <button
        onClick={() => setOpen(true)}
        data-testid="button-journal-screen-time"
        className={`fixed bottom-24 right-3 z-40 md:bottom-6 md:translate-y-0 flex flex-col items-center gap-0 rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 text-white min-w-[58px] hover:from-slate-700 hover:to-slate-800 transition-all duration-300 active:scale-95 select-none ${btnVisible ? 'translate-y-0 opacity-100' : 'translate-y-40 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto'}`}
        title="Journal Screen Time"
      >
        {/* Top section */}
        <div className="flex flex-col items-center gap-0.5 px-3 py-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-violet-400" />
            <span className="text-[8px] font-semibold uppercase tracking-widest text-violet-300">Time</span>
          </div>
          <span className="text-sm font-bold leading-none text-white">{fmtTimeShort(totalTodaySecs)}</span>
          {limitReached && (
            <span className="text-[7px] text-red-400 font-bold uppercase tracking-wide mt-0.5">Limit!</span>
          )}
        </div>
        {/* Progress bar strip */}
        <div className="w-full h-1 bg-white/10">
          <div
            className={`h-full transition-all duration-1000 ${limitReached ? "bg-red-500" : pct > 0.7 ? "bg-amber-500" : "bg-violet-500"}`}
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
      </button>

      {/* ── Detail Dialog ──────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm w-[92vw] rounded-2xl p-0 overflow-hidden border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-xl max-h-[85vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Screen Time</span>
            </div>
            <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="px-4 py-4 space-y-4">

            {/* ── Today's summary ──────────────────────── */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Today</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{fmtTime(totalTodaySecs)}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {todayHistory?.sessions || 0} session{(todayHistory?.sessions || 0) !== 1 ? "s" : ""} · limit {fmtTime(dailyLimit)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {limitReached ? (
                  <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px] font-semibold px-2 py-1 rounded-lg border border-red-100 dark:border-red-800/30">
                    <Flame className="w-3 h-3" /> Limit reached
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">{Math.round(pct * 100)}% of limit</span>
                )}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={limitInput}
                    min={15}
                    max={480}
                    onChange={e => {
                      setLimitInput(e.target.value);
                      const mins = parseInt(e.target.value);
                      if (!isNaN(mins) && mins >= 15) setDailyLimit(mins * 60);
                    }}
                    className="w-12 text-[10px] font-semibold text-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md px-1 py-0.5 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">min</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${limitReached ? "bg-red-500" : pct > 0.7 ? "bg-amber-500" : "bg-violet-500"}`}
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </div>

            {/* ── Psychology insight ─────────────────── */}
            <div className="flex items-start gap-2.5 py-1">
              <div className="mt-0.5 shrink-0">
                {psychInsight.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                {psychInsight.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
                {psychInsight.trend === "warn" && <Flame className="w-3.5 h-3.5 text-red-500" />}
                {psychInsight.trend === "neutral" && <Brain className="w-3.5 h-3.5 text-violet-400" />}
              </div>
              <p className={`text-[11px] leading-relaxed ${psychInsight.color}`}>{psychInsight.text}</p>
            </div>

            {/* ── Leaderboard — top + me only ───────── */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Today's Leaderboard</span>
                </div>
                {myRank && leaderTotal > 0 && (
                  <span className="text-[10px] text-slate-400">{medalLabel(myRank.rank)} of {leaderTotal}</span>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-3">
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-center py-3 text-[11px] text-slate-400">No one tracked yet — you'll be #1!</p>
              ) : (() => {
                const topEntry = leaderboard.find(e => e.rank === 1);
                const myUserId = myRank ? leaderboard.find(e => e.rank === myRank.rank)?.userId : null;
                const myEntry = myUserId ? leaderboard.find(e => e.userId === myUserId) : null;
                const isTopMe = topEntry && myEntry && topEntry.userId === myEntry.userId;
                const showGap = myEntry && topEntry && !isTopMe && myEntry.rank > 2;
                return (
                  <div className="space-y-1.5">
                    {topEntry && (
                      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] ${isTopMe ? "bg-violet-50 dark:bg-violet-900/25 ring-1 ring-violet-200 dark:ring-violet-700" : "bg-slate-50 dark:bg-slate-800/50"}`}>
                        <span className="w-5 text-center shrink-0">{medalLabel(1)}</span>
                        <span className={`flex-1 font-medium truncate ${isTopMe ? "text-violet-600 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>
                          {topEntry.username}{isTopMe ? " (you)" : ""}
                        </span>
                        <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0">{fmtTimeShort(topEntry.totalSeconds)}</span>
                      </div>
                    )}
                    {showGap && (
                      <div className="flex items-center justify-center py-0.5">
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">· · ·</span>
                      </div>
                    )}
                    {myEntry && !isTopMe && (
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] bg-violet-50 dark:bg-violet-900/25 ring-1 ring-violet-200 dark:ring-violet-700">
                        <span className="w-5 text-center shrink-0">{medalLabel(myEntry.rank)}</span>
                        <span className="flex-1 font-medium truncate text-violet-600 dark:text-violet-300">
                          {myEntry.username} (you)
                        </span>
                        <span className="font-semibold text-violet-500 dark:text-violet-400 shrink-0">{fmtTimeShort(myEntry.totalSeconds)}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── Daily History ──────────────────────── */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">30-Day History</span>
              </div>

              {history.length === 0 ? (
                <p className="text-center py-3 text-[11px] text-slate-400">No history yet</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {history.slice(0, 30).map(entry => {
                    const p = Math.min(1, entry.totalSeconds / dailyLimit);
                    const isToday = entry.date === todayKey();
                    return (
                      <div key={entry.date} className="flex items-center gap-2.5 py-1.5">
                        <span className="text-[10px] text-slate-400 w-12 shrink-0">
                          {isToday ? "Today" : formatDate(entry.date)}
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor(entry.totalSeconds)}`}
                            style={{ width: `${Math.round(p * 100)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold w-9 text-right shrink-0 ${isToday ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-500"}`}>
                          {fmtTimeShort(entry.totalSeconds)}
                        </span>
                        {entry.totalSeconds >= dailyLimit && (
                          <Flame className="w-3 h-3 text-red-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
