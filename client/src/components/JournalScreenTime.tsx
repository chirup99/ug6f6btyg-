import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, Brain, Trophy, TrendingUp, TrendingDown, Minus, X, ChevronRight, Flame, Medal } from "lucide-react";
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
        <DialogContent className="max-w-md w-[95vw] rounded-3xl p-0 overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-5 py-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold leading-none">Journal Screen Time</h2>
                  <p className="text-[10px] text-white/70 mt-0.5">Psychology & Focus Analytics</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Today's time big display */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">Today</p>
                <p className="text-3xl font-black leading-none mt-0.5">{fmtTime(totalTodaySecs)}</p>
                <p className="text-[10px] text-white/60 mt-1">
                  {todayHistory?.sessions || 0} session{(todayHistory?.sessions || 0) !== 1 ? "s" : ""} · limit {fmtTime(dailyLimit)}
                </p>
              </div>
              <div className="text-right">
                {limitReached ? (
                  <span className="inline-flex items-center gap-1 bg-red-500/30 border border-red-400/40 text-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <Flame className="w-3 h-3" /> Limit Reached
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-white/15 text-white/80 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> {Math.round(pct * 100)}% used
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${limitReached ? "bg-red-400" : pct > 0.7 ? "bg-amber-400" : "bg-white"}`}
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </div>

            {/* Daily limit setter */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] text-white/60">Daily limit:</span>
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
                className="w-14 text-[11px] font-bold text-center bg-white/20 text-white rounded-lg px-1 py-0.5 border border-white/20 focus:outline-none focus:bg-white/30"
              />
              <span className="text-[10px] text-white/60">minutes</span>
            </div>
          </div>

          <div className="px-5 py-4 space-y-5">

            {/* ── Psychology insight ─────────────────── */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Trader Psychology</span>
                {psychInsight.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                {psychInsight.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-amber-500 ml-auto" />}
                {psychInsight.trend === "warn" && <Flame className="w-3.5 h-3.5 text-red-500 ml-auto" />}
                {psychInsight.trend === "neutral" && <Minus className="w-3.5 h-3.5 text-slate-400 ml-auto" />}
              </div>
              <p className={`text-[11px] leading-relaxed ${psychInsight.color}`}>{psychInsight.text}</p>
              {pnlCorrelation && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed border-t border-slate-200 dark:border-slate-700 pt-2">{pnlCorrelation}</p>
              )}
            </div>

            {/* ── Ranking ────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Today's Leaderboard</span>
                </div>
                {myRank && (
                  <span className="text-[10px] font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-full">
                    {medalLabel(myRank.rank)} of {leaderTotal}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-4 text-[11px] text-slate-400">No one tracked yet today — you'll be #1!</div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.slice(0, 10).map(entry => {
                    const isMe = myRank && entry.userId === leaderboard.find(e => e.rank === myRank.rank)?.userId;
                    return (
                      <div
                        key={entry.userId}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] ${isMe ? "bg-violet-50 dark:bg-violet-900/30 ring-1 ring-violet-300 dark:ring-violet-600" : "bg-slate-50 dark:bg-slate-800/40"}`}
                      >
                        <span className="w-6 text-center font-bold text-slate-500 dark:text-slate-400 shrink-0">{medalLabel(entry.rank)}</span>
                        <span className={`flex-1 font-semibold truncate ${isMe ? "text-violet-600 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>
                          {entry.username}{isMe ? " (you)" : ""}
                        </span>
                        <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">{fmtTimeShort(entry.totalSeconds)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Daily History ──────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">30-Day History</span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-3 text-[11px] text-slate-400">No history yet</div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {history.slice(0, 30).map(entry => {
                    const p = Math.min(1, entry.totalSeconds / dailyLimit);
                    const isToday = entry.date === todayKey();
                    return (
                      <div key={entry.date} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isToday ? "bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800" : "bg-slate-50 dark:bg-slate-800/40"}`}>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 w-14 shrink-0">
                          {isToday ? "Today" : formatDate(entry.date)}
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor(entry.totalSeconds)}`}
                            style={{ width: `${Math.round(p * 100)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold w-10 text-right shrink-0 ${isToday ? "text-violet-600 dark:text-violet-300" : "text-slate-600 dark:text-slate-400"}`}>
                          {fmtTimeShort(entry.totalSeconds)}
                        </span>
                        {entry.totalSeconds >= dailyLimit && (
                          <Flame className="w-3 h-3 text-red-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Tips ───────────────────────────────── */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-violet-100 dark:border-violet-800/30">
              <p className="text-[9px] uppercase tracking-widest text-violet-500 font-bold mb-2">Psychology Tips</p>
              <ul className="space-y-1.5">
                {[
                  "Review trades, not prices — focus on decisions, not outcomes",
                  "Shorter, focused journal sessions beat long distracted ones",
                  "Hitting the time limit is a signal to step away and reset",
                  "Compare your notes on winning vs losing days for patterns"
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                    <ChevronRight className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
