import { FileText, Bot } from "lucide-react";

interface JournalAIReportPanelProps {
  journalReportMetrics: any;
  setJournalReportActiveTab: (tab: 'personal1' | 'personal2') => void;
  generateJournalAIReport: (tab?: 'personal1' | 'personal2') => void;
  journalScreenTimeSessions: Array<{ date: string; totalSeconds: number }>;
  journalCurrentSessionSecs: number;
  journalTabCurrentSecs: number;
}

export function JournalAIReportPanel({
  journalReportMetrics,
  setJournalReportActiveTab,
  generateJournalAIReport,
  journalScreenTimeSessions,
  journalCurrentSessionSecs,
  journalTabCurrentSecs,
}: JournalAIReportPanelProps) {
  const m = journalReportMetrics;

  return (
    <div className="w-full rounded-xl border border-gray-800 bg-gray-900/90 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-200">Trading Journal Report</span>
          {m?.isDemo && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Demo</span>
          )}
          {!m?.isDemo && m?.activeTab === 'personal2' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">Personal 2</span>
          )}
          {!m?.isDemo && m?.activeTab !== 'personal2' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Personal 1</span>
          )}
        </div>
        {/* P1/P2 toggle */}
        {!m?.isDemo && (
          <div className="flex items-center p-0.5 rounded-full flex-shrink-0" style={{ background: '#111' }}>
            {[{ key: 'personal1', label: 'P1' }, { key: 'personal2', label: 'P2' }].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setJournalReportActiveTab(tab.key as 'personal1' | 'personal2');
                  generateJournalAIReport(tab.key as 'personal1' | 'personal2');
                }}
                className="px-3 py-1 text-xs font-medium rounded-full transition-all duration-200"
                style={m?.activeTab === tab.key
                  ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' }
                  : { color: '#6b7280' }}
              >{tab.label}</button>
            ))}
          </div>
        )}
      </div>

      {m?.isDemo && (
        <div className="px-3 py-2 bg-yellow-900/20 border-b border-yellow-800/30 flex items-center gap-2">
          <span className="text-[10px] text-yellow-500">Showing demo data. Add journal entries in the Journal tab to see your real performance report.</span>
        </div>
      )}

      {(!m || m?.noData) && (
        <div className="px-4 py-8 text-center">
          <FileText className="h-8 w-8 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No trading data found.</p>
          <p className="text-xs text-gray-600 mt-1">Add entries in the Journal tab to get started.</p>
        </div>
      )}

      {m?.error && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-red-400">Failed to load report. Please try again.</p>
        </div>
      )}

      {m && !m.noData && !m.error && (
        <div className="divide-y divide-gray-800/70">
          {/* Overview row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-800/70">
            {[
              { label: 'Net P&L', value: `₹${Math.abs(m.netPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: m.netPnL >= 0 ? 'Profit' : 'Loss', color: m.netPnL >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Win Rate', value: `${m.winRate}%`, sub: `${m.winningTrades}W / ${m.losingTrades}L`, color: m.winRate >= 50 ? 'text-green-400' : 'text-orange-400' },
              { label: 'Total Trades', value: String(m.totalTrades), sub: `${m.tradingDays} days`, color: 'text-blue-400' },
              { label: 'Profit Factor', value: m.profitFactor === 999 ? '∞' : m.profitFactor.toFixed(2), sub: m.profitFactor >= 1.5 ? 'Excellent' : m.profitFactor >= 1 ? 'Good' : 'Needs work', color: m.profitFactor >= 1.5 ? 'text-green-400' : m.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400' },
            ].map((stat, i) => (
              <div key={i} className="px-3 py-3 flex flex-col items-center text-center">
                <span className={`text-base sm:text-lg font-bold ${stat.color}`}>{stat.value}</span>
                <span className="text-[10px] text-gray-500 mt-0.5">{stat.label}</span>
                <span className="text-[10px] text-gray-600">{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* Detailed Analytics */}
          <div className="px-3 py-2 bg-gray-900/40">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Detailed Analytics</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 divide-gray-800/50">
            {[
              { label: 'Avg Win', value: `₹${Math.round(m.avgWin).toLocaleString('en-IN')}`, color: 'text-green-400' },
              { label: 'Avg Loss', value: `₹${Math.round(m.avgLoss).toLocaleString('en-IN')}`, color: 'text-red-400' },
              { label: 'Risk:Reward', value: m.rrRatio.toFixed(2), color: m.rrRatio >= 1 ? 'text-green-400' : 'text-orange-400' },
              { label: 'Expectancy', value: `₹${Math.round(m.expectancy).toLocaleString('en-IN')}`, color: m.expectancy >= 0 ? 'text-blue-400' : 'text-red-400' },
              { label: 'Total Profit', value: `₹${Math.round(m.totalProfit).toLocaleString('en-IN')}`, color: 'text-green-400' },
              { label: 'Total Loss', value: `₹${Math.round(m.totalLoss).toLocaleString('en-IN')}`, color: 'text-red-400' },
            ].map((s, i) => (
              <div key={i} className="px-4 py-2.5 flex items-baseline justify-between gap-2 hover:bg-gray-800/30 transition-colors border-b border-gray-800/40 last:border-b-0">
                <span className="text-[11px] text-gray-500">{s.label}</span>
                <span className={`text-xs font-semibold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Performance Duration */}
          <div className="px-3 py-2 bg-gray-900/40">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Performance Duration</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {[
              { label: 'Profit Days', value: String(m.profitDays), color: 'text-green-400' },
              { label: 'Loss Days', value: String(m.lossDays), color: 'text-red-400' },
              { label: 'Max Win Streak', value: String(m.maxConsecutiveWins), color: 'text-green-400' },
              { label: 'Max Loss Streak', value: String(m.maxConsecutiveLosses), color: 'text-red-400' },
            ].map((s, i) => (
              <div key={i} className="px-4 py-2.5 flex items-baseline justify-between gap-2 hover:bg-gray-800/30 transition-colors border-b border-r border-gray-800/40 last:border-r-0">
                <span className="text-[11px] text-gray-500">{s.label}</span>
                <span className={`text-xs font-semibold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          {/* Best/Worst Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-800/50">
            <div className="px-4 py-2.5 flex items-baseline justify-between gap-2 hover:bg-gray-800/30">
              <span className="text-[11px] text-gray-500">Best Day</span>
              <span className="text-xs font-semibold text-green-400">{m.bestDay?.date ? `${m.bestDay.date} · ₹${Math.round(m.bestDay.pnl).toLocaleString('en-IN')}` : '—'}</span>
            </div>
            <div className="px-4 py-2.5 flex items-baseline justify-between gap-2 hover:bg-gray-800/30">
              <span className="text-[11px] text-gray-500">Worst Day</span>
              <span className="text-xs font-semibold text-red-400">{m.worstDay?.date ? `${m.worstDay.date} · ₹${Math.round(m.worstDay.pnl).toLocaleString('en-IN')}` : '—'}</span>
            </div>
          </div>

          {/* Loss Analysis */}
          <div className="px-3 py-2 bg-gray-900/40">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Loss Analysis</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-800/50">
            <div className="px-4 py-2.5 flex items-baseline justify-between gap-2 hover:bg-gray-800/30">
              <span className="text-[11px] text-gray-500">Loss Days Ratio</span>
              <span className="text-xs font-semibold text-orange-400">{m.tradingDays > 0 ? `${Math.round((m.lossDays / m.tradingDays) * 100)}%` : '—'}</span>
            </div>
            <div className="px-4 py-2.5 flex items-baseline justify-between gap-2 hover:bg-gray-800/30">
              <span className="text-[11px] text-gray-500">Avg Trades/Day</span>
              <span className="text-xs font-semibold text-blue-400">{m.avgTradesPerDay.toFixed(1)}</span>
            </div>
            <div className="px-4 py-2.5 flex items-baseline justify-between gap-2 hover:bg-gray-800/30">
              <span className="text-[11px] text-gray-500">Worst Weekday</span>
              <span className="text-xs font-semibold text-red-400">{m.worstWeekday ? `${m.worstWeekday[0]} (₹${Math.round(m.worstWeekday[1]).toLocaleString('en-IN')})` : '—'}</span>
            </div>
            <div className="px-4 py-2.5 flex items-baseline justify-between gap-2 hover:bg-gray-800/30">
              <span className="text-[11px] text-gray-500">Best Weekday</span>
              <span className="text-xs font-semibold text-green-400">{m.bestWeekday ? `${m.bestWeekday[0]} (₹${Math.round(m.bestWeekday[1]).toLocaleString('en-IN')})` : '—'}</span>
            </div>
          </div>

          {/* Psychology */}
          <div className="px-3 py-2 bg-gray-900/40">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Psychology Analysis</span>
          </div>
          <div className="px-4 py-2.5">
            {m.psychList && m.psychList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {m.psychList.slice(0, 10).map(([tag, count]: [string, number]) => {
                  const isFomo = tag.toLowerCase().includes('fomo');
                  const isDiscipline = tag.toLowerCase().includes('discipline') || tag.toLowerCase().includes('plan');
                  return (
                    <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full border ${isFomo ? 'bg-red-900/30 text-red-400 border-red-700/40' : isDiscipline ? 'bg-green-900/30 text-green-400 border-green-700/40' : 'bg-gray-800 text-gray-400 border-gray-700/40'}`}>
                      {tag} <span className="opacity-60">×{count}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-[11px] text-gray-600">No psychology tags recorded yet</span>
            )}
          </div>
          {m.fomoTrades > 0 && (
            <div className="px-4 py-2 flex items-center gap-2 bg-red-900/10">
              <span className="text-[10px] text-red-400 font-medium">⚠ FOMO Alert:</span>
              <span className="text-[10px] text-gray-400">{m.fomoTrades} FOMO trade{m.fomoTrades > 1 ? 's' : ''} detected — consider cooling-off periods</span>
            </div>
          )}

          {/* Top Instruments */}
          {m.topInstruments && m.topInstruments.length > 0 && (
            <>
              <div className="px-3 py-2 bg-gray-900/40">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Most Traded</span>
              </div>
              <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
                {m.topInstruments.map(([sym, cnt]: [string, number]) => (
                  <span key={sym} className="text-[10px] px-2 py-0.5 rounded-full border bg-blue-900/20 text-blue-300 border-blue-700/30">{sym} ×{cnt}</span>
                ))}
              </div>
            </>
          )}

          {/* ===== SCREEN TIME / DURATION REPORT ===== */}
          {(() => {
            const sessions = journalScreenTimeSessions;
            const today = new Date();
            const last14: Array<{ date: string; label: string; secs: number }> = [];
            for (let i = 13; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              const iso = d.toISOString().slice(0, 10);
              const found = sessions.find(s => s.date === iso);
              const todaySecs = iso === today.toISOString().slice(0, 10) ? (journalCurrentSessionSecs + journalTabCurrentSecs) : 0;
              last14.push({
                date: iso,
                label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                secs: (found?.totalSeconds || 0) + (iso === today.toISOString().slice(0, 10) ? todaySecs : 0),
              });
            }
            const hasSomeData = last14.some(d => d.secs > 0);
            const totalSecsAllTime = sessions.reduce((a, b) => a + b.totalSeconds, 0) + journalCurrentSessionSecs + journalTabCurrentSecs;
            const avgSecsPerDay = sessions.length > 0 ? Math.round((sessions.reduce((a, b) => a + b.totalSeconds, 0)) / sessions.length) : 0;
            const todaySecs = last14[last14.length - 1].secs;
            const fmtTime = (s: number) => {
              if (s < 60) return `${s}s`;
              const mm = Math.floor(s / 60);
              const rem = s % 60;
              if (mm < 60) return rem > 0 ? `${mm}m ${rem}s` : `${mm}m`;
              return `${Math.floor(mm / 60)}h ${mm % 60}m`;
            };
            const W = 280, H = 72, PAD = 4;
            const maxSecs = Math.max(...last14.map(d => d.secs), avgSecsPerDay, 60);
            const pts = last14.map((d, i) => {
              const x = PAD + (i / (last14.length - 1)) * (W - PAD * 2);
              const y = H - PAD - (d.secs / maxSecs) * (H - PAD * 2);
              return { x, y, ...d };
            });
            const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
            const avgY = H - PAD - (avgSecsPerDay / maxSecs) * (H - PAD * 2);
            const todayPt = pts[pts.length - 1];
            return (
              <>
                {/* Section header */}
                <div className="px-3 py-2 bg-gray-900/40 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Journal Screen Time</span>
                  {(journalCurrentSessionSecs > 0 || journalTabCurrentSecs > 0) && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Live · {fmtTime(journalCurrentSessionSecs + journalTabCurrentSecs)}
                    </span>
                  )}
                </div>
                {/* Duration meter row */}
                <div className="grid grid-cols-3 divide-x divide-gray-800/50">
                  <div className="px-3 py-2.5 flex flex-col items-center text-center">
                    <span className="text-sm font-bold text-emerald-400">{fmtTime(todaySecs)}</span>
                    <span className="text-[10px] text-gray-600 mt-0.5">Today</span>
                  </div>
                  <div className="px-3 py-2.5 flex flex-col items-center text-center">
                    <span className="text-sm font-bold text-blue-400">{fmtTime(avgSecsPerDay)}</span>
                    <span className="text-[10px] text-gray-600 mt-0.5">Daily Avg</span>
                  </div>
                  <div className="px-3 py-2.5 flex flex-col items-center text-center">
                    <span className="text-sm font-bold text-violet-400">{fmtTime(totalSecsAllTime)}</span>
                    <span className="text-[10px] text-gray-600 mt-0.5">All Time</span>
                  </div>
                </div>
                {/* Line chart */}
                <div className="px-3 pb-3">
                  {!hasSomeData && journalCurrentSessionSecs === 0 && journalTabCurrentSecs === 0 ? (
                    <div className="flex items-center justify-center h-16 text-[10px] text-gray-700">No sessions yet — this is your first visit!</div>
                  ) : (
                    <div className="relative w-full overflow-hidden rounded-lg bg-gray-900/60 border border-gray-800/60 p-2">
                      <svg
                        viewBox={`0 0 ${W} ${H}`}
                        className="w-full"
                        style={{ height: 72 }}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Grid lines */}
                        {[0.25, 0.5, 0.75, 1].map(f => (
                          <line key={f} x1={PAD} y1={H - PAD - f * (H - PAD * 2)} x2={W - PAD} y2={H - PAD - f * (H - PAD * 2)} stroke="#374151" strokeWidth="0.5" strokeDasharray="2,3" />
                        ))}
                        {/* Average line */}
                        {avgSecsPerDay > 0 && (
                          <>
                            <line x1={PAD} y1={avgY} x2={W - PAD} y2={avgY} stroke="#6366f1" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
                            <text x={W - PAD - 2} y={avgY - 3} fill="#818cf8" fontSize="6" textAnchor="end">avg</text>
                          </>
                        )}
                        {/* Area fill */}
                        {pts.length > 1 && (
                          <polygon
                            points={`${pts[0].x.toFixed(1)},${H - PAD} ${polyline} ${pts[pts.length - 1].x.toFixed(1)},${H - PAD}`}
                            fill="url(#stGrad)"
                            opacity="0.25"
                          />
                        )}
                        <defs>
                          <linearGradient id="stGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Line */}
                        {pts.length > 1 && (
                          <polyline points={polyline} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                        )}
                        {/* Data points */}
                        {pts.map((p, i) => p.secs > 0 && (
                          <circle key={i} cx={p.x} cy={p.y} r="2" fill={i === pts.length - 1 ? '#10b981' : '#059669'} />
                        ))}
                        {/* Today pulsing dot */}
                        {(journalCurrentSessionSecs > 0 || journalTabCurrentSecs > 0) && (
                          <>
                            <circle cx={todayPt.x} cy={todayPt.y} r="5" fill="#10b981" opacity="0.2">
                              <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx={todayPt.x} cy={todayPt.y} r="2.5" fill="#10b981" />
                          </>
                        )}
                        {/* X-axis labels for first, middle, last */}
                        {[0, 6, 13].map(i => (
                          <text key={i} x={pts[i].x} y={H + 1} fill="#4b5563" fontSize="5.5" textAnchor="middle">{pts[i].label}</text>
                        ))}
                      </svg>
                    </div>
                  )}
                  {/* Discipline insight */}
                  <div className="mt-2 flex items-start gap-1.5">
                    <span className="text-[9px] leading-relaxed text-gray-600 flex-1">
                      {todaySecs > avgSecsPerDay && avgSecsPerDay > 0
                        ? `📈 Above average today (${fmtTime(todaySecs)} vs ${fmtTime(avgSecsPerDay)} avg) — great journal discipline!`
                        : avgSecsPerDay > 120
                        ? `✅ You average ${fmtTime(avgSecsPerDay)}/day reviewing your journal — strong habit.`
                        : sessions.length === 0
                        ? '💡 Tip: Regular journal review (5–10 min/day) improves trading discipline significantly.'
                        : `⏱ Keep building the habit — aim for 5–10 min of daily journal review.`}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}

          {/* AI Insight */}
          <div className="px-4 py-3 bg-indigo-900/10 border-t border-indigo-800/20 flex items-start gap-2">
            <Bot className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-gray-400 leading-relaxed">
              {m.winRate >= 60 ? '🟢 Strong performance — win rate shows excellent discipline. Keep risk-reward above 1.5 to compound gains.' :
               m.winRate >= 40 ? '🟡 Moderate performance — focus on entries and tighter stop-losses to push win rate above 50%.' :
               '🔴 Needs improvement — review your losing trades for patterns and consider reducing position size until win rate improves.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
