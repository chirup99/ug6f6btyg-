import { useState } from "react";
import {
  Award,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Flame,
  Globe,
  Headphones,
  Heart,
  MessageCircle,
  Mic,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  SkipBack,
  SkipForward,
  Users,
  Volume2,
} from "lucide-react";

interface MiniCastTabProps {
  setActiveTab: (tab: string) => void;
}

export function MiniCastTab({ setActiveTab }: MiniCastTabProps) {
  const [minicastFeedTab, setMinicastFeedTab] = useState<"discover" | "following">("discover");
  const [minicastCategory, setMinicastCategory] = useState<string>("All");
  const [minicastPlayingId, setMinicastPlayingId] = useState<string | null>(null);
  const [minicastLikes, setMinicastLikes] = useState<Record<string, boolean>>({});
  const [minicastBookmarks, setMinicastBookmarks] = useState<Record<string, boolean>>({});
  const [minicastShowCreate, setMinicastShowCreate] = useState(false);
  const [minicastReelActive, setMinicastReelActive] = useState(false);
  const [minicastReelIndex, setMinicastReelIndex] = useState(0);
  const [minicastShowComments, setMinicastShowComments] = useState(false);
  const [minicastCommentText, setMinicastCommentText] = useState("");
  const [minicastNavTab, setMinicastNavTab] = useState<"home" | "discover" | "voice" | "profile">("home");

  // ── MiniCast Data ──────────────────────────────────────────────────
  const minicastPosts = [
    {
      id: "p1", creator: "RaviFinance", handle: "@ravifinance", initials: "RF",
      bgFrom: "#ec4899", bgTo: "#dc2626",
      category: "Finance", duration: "2:30", listeners: "12.4K",
      likes: 847, comments: 134, shares: 89, time: "2h ago",
      trending: true, verified: true,
      title: "Nifty 50 Breakout – What to Expect",
      desc: "4-candle breakout pattern on Nifty 50 with key support & resistance levels.",
      demoComments: [
        { id: "c1", user: "TraderJoe", handle: "@traderjoe", text: "Great analysis! The 4-candle rule is 🔥", time: "1m", likes: 32 },
        { id: "c2", user: "InvestorPriya", handle: "@investorpriya", text: "Been waiting for this breakdown. Thanks Ravi!", time: "5m", likes: 18 },
        { id: "c3", user: "AlgoTrader", handle: "@algotrader", text: "The resistance at 22,500 is key. Watching closely.", time: "12m", likes: 45 },
        { id: "c4", user: "NewbieNikesh", handle: "@newbienikesh", text: "Can you explain the 4 candle rule again?", time: "20m", likes: 7 },
      ],
      waveHeights: [20,35,55,40,70,50,30,60,45,80,55,35,65,40,25,50,70,45,30,60,40,75,55,30,65],
    },
    {
      id: "p2", creator: "AITrader", handle: "@aitrader", initials: "AT",
      bgFrom: "#8b5cf6", bgTo: "#4338ca",
      category: "AI", duration: "1:45", listeners: "8.9K",
      likes: 623, comments: 97, shares: 156, time: "4h ago",
      trending: true, verified: false,
      title: "How AI is Disrupting Quant Trading",
      desc: "ML models outperforming traditional quant strategies. What retail traders need in 2025.",
      demoComments: [
        { id: "c1", user: "QuantNerd", handle: "@quantnerd", text: "Spot on! LSTM outperforms ARIMA on most indices.", time: "2m", likes: 41 },
        { id: "c2", user: "DataSci_Ananya", handle: "@datasci_ananya", text: "Are you using reinforcement learning?", time: "8m", likes: 22 },
        { id: "c3", user: "RetailTrader_R", handle: "@retailtrader_r", text: "This is intimidating but exciting!", time: "15m", likes: 13 },
      ],
      waveHeights: [30,50,40,65,35,75,55,25,60,45,70,40,55,30,65,50,35,70,45,60,30,55,75,45,60],
    },
    {
      id: "p3", creator: "StartupPro", handle: "@startuppro", initials: "SP",
      bgFrom: "#10b981", bgTo: "#0891b2",
      category: "Startup", duration: "2:55", listeners: "5.2K",
      likes: 412, comments: 78, shares: 203, time: "6h ago",
      trending: false, verified: true,
      title: "Indian Startup Funding Q1 2025 Report",
      desc: "FinTech leads with $2.3B raised. Deep tech, AgriTech, and HealthTech strong.",
      demoComments: [
        { id: "c1", user: "VCwatcher", handle: "@vcwatcher", text: "FinTech is unstoppable right now!", time: "3m", likes: 28 },
        { id: "c2", user: "Founder_Meera", handle: "@founder_meera", text: "Great report! AgriTech is underrated.", time: "10m", likes: 19 },
      ],
      waveHeights: [40,25,60,45,70,35,55,80,30,50,65,40,75,55,30,45,60,35,70,50,40,65,45,70,30],
    },
    {
      id: "p4", creator: "NewsDesk", handle: "@newsdesk", initials: "ND",
      bgFrom: "#f97316", bgTo: "#e11d48",
      category: "Global", duration: "2:10", listeners: "18.7K",
      likes: 1243, comments: 267, shares: 445, time: "1h ago",
      trending: true, verified: true,
      title: "Fed Rate Decision – Live Analysis",
      desc: "US Federal Reserve holds rates steady. Asian markets react with cautious optimism.",
      demoComments: [
        { id: "c1", user: "MacroMaven", handle: "@macromaven", text: "Expected hold. The real story is the dot plot.", time: "1m", likes: 67 },
        { id: "c2", user: "ForexFred", handle: "@forexfred", text: "Rupee looking strong at 83.2.", time: "4m", likes: 34 },
        { id: "c3", user: "GoldBug_Raj", handle: "@goldbug_raj", text: "Gold pumping on this news. MCX levels?", time: "9m", likes: 21 },
        { id: "c4", user: "NiftyNinja", handle: "@niftyninja", text: "FII inflows incoming 🚀", time: "14m", likes: 88 },
      ],
      waveHeights: [55,70,35,60,45,80,50,40,65,30,70,55,25,60,45,75,40,55,65,35,50,70,35,60,45],
    },
    {
      id: "p5", creator: "TechBull", handle: "@techbull", initials: "TB",
      bgFrom: "#22d3ee", bgTo: "#2563eb",
      category: "Tech", duration: "2:40", listeners: "9.3K",
      likes: 567, comments: 112, shares: 134, time: "8h ago",
      trending: false, verified: false,
      title: "Semiconductor Supercycle – Stocks Surging",
      desc: "NVIDIA, TSMC & Infosys alignment signals a new tech supercycle.",
      demoComments: [
        { id: "c1", user: "ChipChaser", handle: "@chipchaser", text: "NVDA at $180? Still cheap imo.", time: "5m", likes: 19 },
        { id: "c2", user: "InfyInvestor", handle: "@infyinvestor", text: "Infy's AI deals are underpriced by market.", time: "11m", likes: 31 },
      ],
      waveHeights: [35,60,45,70,30,55,75,40,60,50,35,65,45,70,30,55,80,40,60,45,35,65,50,70,40],
    },
    {
      id: "p6", creator: "MarketGuru", handle: "@marketguru", initials: "MG",
      bgFrom: "#fbbf24", bgTo: "#f97316",
      category: "Banking", duration: "1:55", listeners: "6.8K",
      likes: 389, comments: 67, shares: 92, time: "12h ago",
      trending: false, verified: true,
      title: "HDFC & ICICI Q4 Results – Deep Dive",
      desc: "Banking sector resilience with NPA levels at decade lows.",
      demoComments: [
        { id: "c1", user: "BankingBull", handle: "@bankingbull", text: "HDFC is my top pick for 2025!", time: "7m", likes: 44 },
        { id: "c2", user: "NPA_watcher", handle: "@npa_watcher", text: "NPA at decade lows is genuinely impressive.", time: "18m", likes: 26 },
      ],
      waveHeights: [50,35,65,45,70,30,55,40,75,50,35,65,45,60,30,55,70,40,60,45,50,35,65,40,60],
    },
  ];

  const minicastCategories = ["All","Finance","AI","Startup","Crypto","Global","Tech","Banking"];

  const filteredPosts = minicastCategory === "All"
    ? minicastPosts
    : minicastPosts.filter(p => p.category === minicastCategory);

  const currentReelPost = filteredPosts[minicastReelIndex] || filteredPosts[0];
  const isReelPlaying = minicastPlayingId === currentReelPost?.id;
  const isReelLiked = minicastLikes[currentReelPost?.id];
  const isReelBookmarked = minicastBookmarks[currentReelPost?.id];
  const nowPlayingPost = minicastPosts.find(p => p.id === minicastPlayingId) || minicastPosts[0];
  const isNowPlaying = !!minicastPlayingId;

  const goNextReel = () => { setMinicastShowComments(false); setMinicastReelIndex(i => Math.min(i + 1, filteredPosts.length - 1)); };
  const goPrevReel = () => { setMinicastShowComments(false); setMinicastReelIndex(i => Math.max(i - 1, 0)); };

  const genres = [
    { label: "Finance", emoji: "📈", bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
    { label: "AI", emoji: "🤖", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
    { label: "Crypto", emoji: "₿", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    { label: "Markets", emoji: "📊", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    { label: "Tech", emoji: "💻", bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
    { label: "Banking", emoji: "🏦", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#f6f5ff]" style={{height:"100dvh"}}>

      {/* ═══════════════════════════════════════
          FULL-SCREEN REEL OVERLAY (dark — reels stay immersive)
      ═══════════════════════════════════════ */}
      {minicastReelActive && currentReelPost && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden"
          style={{background:`linear-gradient(160deg,${currentReelPost.bgFrom}33 0%,#0f0a1e 40%,${currentReelPost.bgTo}22 100%)`}}>
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{background:`radial-gradient(ellipse 60% 50% at 50% 30%,${currentReelPost.bgFrom}88,transparent)`}} />
          <div className="relative z-10 flex items-center justify-between px-5 pt-safe pt-6 pb-3">
            <button onClick={() => { setMinicastReelActive(false); setMinicastShowComments(false); }}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors" data-testid="button-reel-back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="text-white/60 text-xs font-medium tracking-widest uppercase">MiniCast</div>
              <div className="text-white text-sm font-bold">Audio Reels</div>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white" data-testid="button-reel-more">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          <div className="relative z-10 px-5 mb-4">
            <div className="flex gap-4 overflow-x-auto scrollbar-none" style={{scrollbarWidth:"none"}}>
              {minicastCategories.map(cat => (
                <button key={cat} onClick={() => { setMinicastCategory(cat); setMinicastReelIndex(0); }}
                  className={`flex-shrink-0 text-sm font-semibold transition-all pb-1 ${minicastCategory===cat?"text-white border-b-2 border-white":"text-white/40 hover:text-white/70"}`}
                  data-testid={`button-reel-cat-${cat.toLowerCase()}`}>{cat}</button>
              ))}
            </div>
          </div>
          <div className="relative z-10 flex-1 flex items-center justify-center px-5">
            <div className="w-full max-w-sm">
              <div className="flex justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full blur-3xl opacity-40 scale-75"
                  style={{background:`radial-gradient(circle,${currentReelPost.bgFrom},${currentReelPost.bgTo})`}} />
                <div className="relative w-48 h-48 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white/20"
                  style={{background:`linear-gradient(135deg,${currentReelPost.bgFrom},${currentReelPost.bgTo})`}}>
                  {currentReelPost.initials}
                  {isReelPlaying && (<><div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" /><div className="absolute -inset-3 rounded-full border-2 border-white/10 animate-pulse" /></>)}
                </div>
              </div>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-white font-bold text-xl">{currentReelPost.creator}</span>
                  {currentReelPost.verified && (<div className="w-5 h-5 rounded-full bg-violet-400 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>)}
                </div>
                <div className="text-white/50 text-sm mb-3">{currentReelPost.handle}</div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-xs font-medium px-3 py-1 rounded-full text-white/80 border border-white/20 bg-white/10">{currentReelPost.category}</span>
                  <span className="text-xs font-medium px-3 py-1 rounded-full text-white/80 border border-white/20 bg-white/10">{currentReelPost.duration}</span>
                  {currentReelPost.trending && (<span className="text-xs font-medium px-3 py-1 rounded-full bg-orange-500/30 border border-orange-500/50 text-orange-300 flex items-center gap-1"><Flame className="w-3 h-3" />Trending</span>)}
                </div>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">{currentReelPost.desc}</p>
              </div>
              <div className="flex items-end justify-center gap-0.5 h-16 mb-6 px-4">
                {currentReelPost.waveHeights.map((h,i) => (
                  <div key={i} className="flex-1 rounded-full transition-all"
                    style={{height:isReelPlaying?`${h}%`:`${Math.max(h*0.3,8)}%`,maxHeight:"100%",
                      background:isReelPlaying&&i<10?`linear-gradient(to top,${currentReelPost.bgFrom},${currentReelPost.bgTo})`:`rgba(255,255,255,${isReelPlaying?0.25:0.15})`}} />
                ))}
              </div>
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{width:isReelPlaying?"42%":"0%",background:`linear-gradient(to right,${currentReelPost.bgFrom},${currentReelPost.bgTo})`}} />
                </div>
                <div className="flex items-center justify-between w-full text-white/40 text-xs">
                  <span>{isReelPlaying?"1:03":"0:00"}</span><span>{currentReelPost.duration}</span>
                </div>
                <div className="flex items-center gap-6">
                  <button onClick={goPrevReel} disabled={minicastReelIndex===0}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 disabled:opacity-30 transition-all" data-testid="button-reel-prev">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button onClick={() => setMinicastPlayingId(isReelPlaying?null:currentReelPost.id)}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                    style={{background:`linear-gradient(135deg,${currentReelPost.bgFrom},${currentReelPost.bgTo})`}} data-testid="button-reel-play">
                    {isReelPlaying?<Pause className="w-7 h-7"/>:<Play className="w-7 h-7 ml-1"/>}
                  </button>
                  <button onClick={goNextReel} disabled={minicastReelIndex>=filteredPosts.length-1}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 disabled:opacity-30 transition-all" data-testid="button-reel-next">
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-4 bottom-48 z-20 flex flex-col gap-5 items-center">
            <button onClick={() => setMinicastLikes(prev=>({...prev,[currentReelPost.id]:!prev[currentReelPost.id]}))} className="flex flex-col items-center gap-1" data-testid="button-reel-like">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isReelLiked?"bg-rose-500 shadow-lg shadow-rose-500/40":"bg-white/10 backdrop-blur-sm"}`}>
                <Heart className={`w-5 h-5 text-white ${isReelLiked?"fill-white":""}`} />
              </div>
              <span className="text-white/70 text-xs font-medium">{isReelLiked?currentReelPost.likes+1:currentReelPost.likes}</span>
            </button>
            <button onClick={() => setMinicastShowComments(!minicastShowComments)} className="flex flex-col items-center gap-1" data-testid="button-reel-comment">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${minicastShowComments?"bg-violet-500 shadow-lg shadow-violet-500/40":"bg-white/10 backdrop-blur-sm"}`}>
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium">{currentReelPost.comments}</span>
            </button>
            <button className="flex flex-col items-center gap-1" data-testid="button-reel-share">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium">{currentReelPost.shares}</span>
            </button>
            <button onClick={() => setMinicastBookmarks(prev=>({...prev,[currentReelPost.id]:!prev[currentReelPost.id]}))} className="flex flex-col items-center gap-1" data-testid="button-reel-bookmark">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isReelBookmarked?"bg-amber-400 shadow-lg shadow-amber-400/40":"bg-white/10 backdrop-blur-sm"}`}>
                <Bookmark className={`w-5 h-5 text-white ${isReelBookmarked?"fill-white":""}`} />
              </div>
              <span className="text-white/70 text-xs font-medium">Save</span>
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-28 z-20 flex flex-col items-center gap-1">
            <button onClick={goPrevReel} disabled={minicastReelIndex===0} className="text-white/30 hover:text-white/60 disabled:opacity-0 transition-all"><ChevronUp className="w-5 h-5" /></button>
            <div className="flex gap-1.5">
              {filteredPosts.map((_,i)=>(
                <div key={i} onClick={()=>{ setMinicastReelIndex(i); setMinicastShowComments(false); }}
                  className={`rounded-full cursor-pointer transition-all ${i===minicastReelIndex?"w-5 h-1.5 bg-white":"w-1.5 h-1.5 bg-white/30"}`} />
              ))}
            </div>
            <button onClick={goNextReel} disabled={minicastReelIndex>=filteredPosts.length-1} className="text-white/30 hover:text-white/60 disabled:opacity-0 transition-all"><ChevronDown className="w-5 h-5" /></button>
          </div>
          {minicastShowComments && (
            <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl overflow-hidden" style={{height:"65vh"}}>
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xl" />
              <div className="relative h-full flex flex-col">
                <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
                <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
                  <div><span className="text-slate-900 font-bold text-base">Comments</span><span className="text-slate-400 text-xs ml-2">for {currentReelPost.creator}</span></div>
                  <button onClick={() => setMinicastShowComments(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600" data-testid="button-close-comments">
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
                  {currentReelPost.demoComments.map((c)=>(
                    <div key={c.id} className="flex items-start gap-3" data-testid={`comment-${c.id}`}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{background:`linear-gradient(135deg,${currentReelPost.bgFrom},${currentReelPost.bgTo})`}}>{c.user.charAt(0)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5"><span className="text-slate-900 text-sm font-semibold">{c.handle}</span><span className="text-slate-400 text-xs">· {c.time}</span></div>
                        <p className="text-slate-600 text-sm leading-relaxed">{c.text}</p>
                      </div>
                      <button className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors mt-1" data-testid={`button-comment-like-${c.id}`}>
                        <Heart className="w-3.5 h-3.5" /><span className="text-xs">{c.likes}</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600">ME</div>
                  <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2.5">
                    <input type="text" value={minicastCommentText} onChange={e=>setMinicastCommentText(e.target.value)}
                      placeholder="Add a comment..." className="flex-1 bg-transparent text-slate-700 text-sm outline-none placeholder:text-slate-400" data-testid="input-comment" />
                    {minicastCommentText.trim() && (
                      <button onClick={()=>setMinicastCommentText("")} className="text-violet-600 font-semibold text-sm hover:text-violet-700 transition-colors" data-testid="button-send-comment">
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
          LEFT SIDEBAR — Desktop Only
      ═══════════════════════════════════════ */}
      <aside className="hidden lg:flex w-56 xl:w-60 flex-col bg-white border-r border-slate-100 shrink-0 overflow-y-auto shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200 flex-shrink-0">
              <Headphones className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-black text-slate-900 text-base tracking-tight">MiniCast</span>
              <span className="text-violet-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-100 ml-1.5">BETA</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 flex-1 space-y-0.5">
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest px-3 mb-2">Menu</p>
          {[
            { id: "home" as const, label: "Explore", emoji: "🏠" },
            { id: "discover" as const, label: "Discover", emoji: "🔍" },
          ].map(item => (
            <button key={item.id} onClick={() => setMinicastNavTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${minicastNavTab===item.id?"bg-violet-50 text-violet-700 border border-violet-100":"text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
              data-testid={`button-sidebar-${item.id}`}>
              <span className="text-base">{item.emoji}</span>{item.label}
            </button>
          ))}

          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest px-3 pt-5 mb-2">Library</p>
          {[
            { label: "Saved", emoji: "🔖" },
            { label: "Favourites", emoji: "❤️" },
            { label: "History", emoji: "🕐" },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all">
              <span className="text-base">{item.emoji}</span>{item.label}
            </button>
          ))}

          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest px-3 pt-5 mb-2">Playlists</p>
          {[
            { label: "Finance Picks", emoji: "📈" },
            { label: "AI Insights", emoji: "🤖" },
            { label: "Market News", emoji: "📰" },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all">
              <span className="text-base">{item.emoji}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          <button onClick={() => setActiveTab("social")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
            data-testid="button-back-to-neofeed">
            <ChevronLeft className="w-4 h-4" />Back to NeoFeed
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── STICKY HEADER ── */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 shrink-0 shadow-sm">
          <div className="px-4 sm:px-5 h-14 flex items-center justify-between gap-3">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-slate-900 text-base">MiniCast</span>
              <span className="text-violet-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-100">BETA</span>
            </div>
            {/* Desktop search */}
            <div className="hidden lg:flex flex-1 max-w-sm items-center gap-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 hover:border-violet-300 transition-colors">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Search podcasts, creators..." className="flex-1 bg-transparent text-slate-700 text-sm outline-none placeholder:text-slate-400" data-testid="input-search-podcasts" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMinicastShowCreate(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold shadow-md shadow-violet-200 hover:shadow-violet-300 hover:scale-105 transition-all"
                data-testid="button-create-post-header">
                <Mic className="w-3.5 h-3.5" /><span className="hidden sm:inline">Record</span>
              </button>
              <button className="relative w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-4" style={{scrollbarWidth:"none"}}>

          {/* ══════════ HOME TAB ══════════ */}
          {minicastNavTab === "home" && (
            <div>
              {/* Featured Hero Row */}
              <div className="px-4 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-slate-900 font-black text-base">Featured Podcasts</h2>
                  <button className="text-violet-600 text-xs font-semibold hover:text-violet-700 transition-colors">See all</button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{scrollbarWidth:"none"}}>
                  {minicastPosts.slice(0,4).map((post,idx) => {
                    const isActive = idx === 1;
                    return (
                      <div key={post.id}
                        className={`flex-shrink-0 rounded-2xl relative overflow-hidden cursor-pointer group transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md ${isActive?"w-52 h-64 shadow-lg":"w-40 h-52"}`}
                        onClick={() => { setMinicastReelIndex(idx); setMinicastReelActive(true); }}
                        data-testid={`card-featured-${post.id}`}>
                        <div className="absolute inset-0" style={{background:`linear-gradient(145deg,${post.bgFrom},${post.bgTo})`}} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="absolute top-3 left-3 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-sm border border-white/30">
                          {post.initials}
                        </div>
                        {isActive && post.trending && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                            <span className="text-orange-600 text-[9px] font-bold">LIVE</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center">
                            <Play className="w-5 h-5 text-slate-800 ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-bold text-sm leading-tight">{post.creator}</p>
                          <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{post.title}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-white/80 text-[10px] px-2 py-0.5 rounded-full bg-white/20 border border-white/20">{post.category}</span>
                            <span className="text-white/60 text-[10px]">{post.duration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Popular Podcasts + Filters */}
              <div className="px-4 pt-7">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-slate-900 font-black text-base">Popular Podcasts</h2>
                  <button className="text-violet-600 text-xs font-semibold hover:text-violet-700 transition-colors">See all</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none" style={{scrollbarWidth:"none"}}>
                  {minicastCategories.map(cat => (
                    <button key={cat} onClick={() => setMinicastCategory(cat)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${minicastCategory===cat?"bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200":"bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600"}`}
                      data-testid={`button-filter-${cat.toLowerCase()}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 mt-1">
                  {filteredPosts.map((post) => {
                    const isPlaying = minicastPlayingId === post.id;
                    return (
                      <div key={post.id} className="bg-white rounded-2xl overflow-hidden group cursor-pointer hover:shadow-md transition-all border border-slate-100 hover:border-violet-100"
                        data-testid={`card-popular-${post.id}`}>
                        <div className="relative h-28" style={{background:`linear-gradient(145deg,${post.bgFrom}22,${post.bgTo}44)`}}>
                          <div className="absolute top-3 left-3 w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                            style={{background:`linear-gradient(135deg,${post.bgFrom},${post.bgTo})`}}>
                            {post.initials}
                          </div>
                          {post.trending && <div className="absolute top-2 right-2 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />}
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-slate-600 text-[9px] font-medium shadow-sm">{post.duration}</div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
                              onClick={e=>{e.stopPropagation();setMinicastPlayingId(isPlaying?null:post.id);}}
                              data-testid={`button-popular-play-${post.id}`}>
                              {isPlaying?<Pause className="w-4 h-4 text-violet-600"/>:<Play className="w-4 h-4 text-violet-600 ml-0.5"/>}
                            </button>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-slate-900 font-bold text-xs mb-0.5 truncate">{post.creator}</p>
                          <p className="text-slate-400 text-[10px] truncate">{post.handle}</p>
                          <p className="text-slate-500 text-[10px] mt-1.5 line-clamp-2 leading-relaxed">{post.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Users className="w-2.5 h-2.5" /><span className="text-[9px]">{post.listeners}</span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${minicastCategory===post.category||minicastCategory==="All"?"bg-violet-100 text-violet-600":"bg-slate-100 text-slate-400"}`}>{post.category}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Topics / Genre Section */}
              <div className="px-4 pt-7">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-slate-900 font-black text-base">Topics</h2>
                  <button className="text-violet-600 text-xs font-semibold hover:text-violet-700 transition-colors">See all</button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {genres.map(genre => (
                    <button key={genre.label} onClick={() => setMinicastCategory(genre.label)}
                      className={`relative rounded-2xl p-4 text-left overflow-hidden transition-all hover:scale-105 active:scale-95 border ${genre.bg} ${genre.border} ${minicastCategory===genre.label?"ring-2 ring-violet-400 ring-offset-1":""}`}
                      data-testid={`button-genre-${genre.label.toLowerCase()}`}>
                      <span className="text-xl block mb-2">{genre.emoji}</span>
                      <span className={`font-bold text-xs ${genre.text}`}>{genre.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Episodes */}
              <div className="px-4 pt-7 pb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-slate-900 font-black text-base">Recent Episodes</h2>
                  <button className="text-violet-600 text-xs font-semibold hover:text-violet-700 transition-colors">See all</button>
                </div>
                <div className="space-y-2">
                  {minicastPosts.slice(0,5).map((post) => {
                    const isPlaying = minicastPlayingId === post.id;
                    return (
                      <div key={post.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-3 cursor-pointer hover:shadow-sm transition-all group border border-slate-100 hover:border-violet-100"
                        data-testid={`row-recent-${post.id}`}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm"
                          style={{background:`linear-gradient(135deg,${post.bgFrom},${post.bgTo})`}}>
                          {post.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-slate-900 font-semibold text-sm truncate">{post.creator}</p>
                            {post.verified && <div className="w-3 h-3 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0"><Check className="w-2 h-2 text-white" /></div>}
                          </div>
                          <p className="text-slate-400 text-xs truncate mt-0.5">{post.title}</p>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="text-slate-400 text-xs">{post.duration}</span>
                          <button className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-violet-100 bg-violet-50 hover:bg-violet-100 transition-colors"
                            onClick={e=>{e.stopPropagation();setMinicastPlayingId(isPlaying?null:post.id);}}
                            data-testid={`button-recent-play-${post.id}`}>
                            {isPlaying?<Pause className="w-3.5 h-3.5 text-violet-600"/>:<Play className="w-3.5 h-3.5 text-violet-600 ml-0.5"/>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ DISCOVER TAB ══════════ */}
          {minicastNavTab === "discover" && (
            <div className="px-4 py-5 pb-24">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 bg-slate-100 rounded-full p-1">
                  <button onClick={() => setMinicastFeedTab("discover")} className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${minicastFeedTab==="discover"?"bg-white text-slate-900 shadow-sm":"text-slate-500 hover:text-slate-700"}`} data-testid="button-tab-discover">Discover</button>
                  <button onClick={() => setMinicastFeedTab("following")} className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${minicastFeedTab==="following"?"bg-white text-slate-900 shadow-sm":"text-slate-500 hover:text-slate-700"}`} data-testid="button-tab-following">Following</button>
                </div>
                <div className="text-slate-400 text-xs">{filteredPosts.length} posts</div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none" style={{scrollbarWidth:"none"}}>
                {minicastCategories.map(cat => (
                  <button key={cat} onClick={()=>{ setMinicastCategory(cat); setMinicastReelIndex(0); }}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${minicastCategory===cat?"bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200":"bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600"}`}
                    data-testid={`button-category-${cat.toLowerCase()}`}>
                    {cat}
                  </button>
                ))}
              </div>
              {/* Top Creators */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  <span className="text-slate-700 font-bold text-xs tracking-widest uppercase">Top Creators</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none" style={{scrollbarWidth:"none"}}>
                  {filteredPosts.map((post,i) => (
                    <button key={post.id} onClick={()=>{ setMinicastReelIndex(i); setMinicastReelActive(true); setMinicastShowComments(false); }}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 group" data-testid={`button-creator-${post.id}`}>
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full p-0.5 group-hover:scale-105 transition-transform" style={{background:`linear-gradient(135deg,${post.bgFrom},${post.bgTo})`}}>
                          <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white"
                            style={{background:`linear-gradient(135deg,${post.bgFrom}cc,${post.bgTo}cc)`}}>{post.initials}</div>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center border-2 border-white">
                          <Volume2 className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs max-w-[56px] truncate">{post.creator}</span>
                    </button>
                  ))}
                </div>
              </div>
              {minicastFeedTab==="following" ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mb-4"><Users className="w-7 h-7 text-violet-300" /></div>
                  <p className="text-slate-600 font-semibold mb-2">No follows yet</p>
                  <p className="text-slate-400 text-sm">Follow creators to see their episodes here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPosts.map((post) => {
                    const isPlaying = minicastPlayingId===post.id;
                    const isLiked = minicastLikes[post.id];
                    return (
                      <div key={post.id} className="relative bg-white rounded-2xl overflow-hidden group cursor-pointer hover:shadow-md transition-all border border-slate-100"
                        onClick={()=>{ const idx=minicastPosts.findIndex(p=>p.id===post.id); setMinicastReelIndex(idx); setMinicastReelActive(true); }}
                        data-testid={`card-minicast-${post.id}`}>
                        <div className="h-1.5 w-full" style={{background:`linear-gradient(to right,${post.bgFrom},${post.bgTo})`}} />
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm"
                              style={{background:`linear-gradient(135deg,${post.bgFrom},${post.bgTo})`}}>{post.initials}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-900 font-bold text-sm">{post.creator}</span>
                                {post.verified && <div className="w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0"><Check className="w-2 h-2 text-white" /></div>}
                              </div>
                              <span className="text-slate-400 text-xs">{post.handle}</span>
                            </div>
                            {post.trending && (
                              <span className="text-orange-600 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 flex items-center gap-1 flex-shrink-0">
                                <Flame className="w-2.5 h-2.5" />HOT
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 mb-3">{post.title}</p>
                          <div className="flex items-end gap-0.5 h-8 mb-3">
                            {post.waveHeights.slice(0,18).map((h,wi)=>(
                              <div key={wi} className="flex-1 rounded-full" style={{height:`${Math.max(h*0.4,15)}%`,background:isPlaying&&wi<6?`linear-gradient(to top,${post.bgFrom},${post.bgTo})`:"rgba(139,92,246,0.2)"}} />
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{post.listeners}</span>
                              <span className="flex items-center gap-1"><Heart className={`w-3 h-3 ${isLiked?"text-rose-400 fill-rose-400":""}`} />{isLiked?post.likes+1:post.likes}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[10px]">{post.duration}</span>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-violet-100 bg-violet-50 hover:bg-violet-100 relative z-20 cursor-pointer transition-colors"
                                onClick={e=>{e.stopPropagation();setMinicastPlayingId(isPlaying?null:post.id);}}
                                data-testid={`button-card-play-${post.id}`}>
                                {isPlaying?<Pause className="w-3.5 h-3.5 text-violet-600"/>:<Play className="w-3.5 h-3.5 text-violet-600 ml-0.5"/>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════ VOICE TAB ══════════ */}
          {minicastNavTab === "voice" && (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-200">
                <Mic className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-slate-900 font-black text-2xl mb-2 text-center">Share Your Voice</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed text-center max-w-xs">Record a short audio post about finance, markets, AI, startups, or anything relevant to the community.</p>
              <button onClick={() => setMinicastShowCreate(true)}
                className="w-full max-w-xs h-14 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-violet-200 hover:shadow-violet-300 hover:from-violet-600 hover:to-purple-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                data-testid="button-start-recording">
                <Mic className="w-5 h-5" />Start Recording
              </button>
            </div>
          )}

          {/* ══════════ PROFILE TAB ══════════ */}
          {minicastNavTab === "profile" && (
            <div className="px-4 py-6 pb-24">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black mb-3 shadow-xl shadow-violet-200">ME</div>
                <div className="text-slate-900 font-black text-xl">Your Profile</div>
                <div className="text-slate-400 text-sm mt-0.5">@youhandle · Finance Creator</div>
                <div className="flex gap-8 mt-4">
                  <div className="text-center"><div className="text-slate-900 font-black text-lg">0</div><div className="text-slate-400 text-xs">Posts</div></div>
                  <div className="text-center"><div className="text-slate-900 font-black text-lg">0</div><div className="text-slate-400 text-xs">Followers</div></div>
                  <div className="text-center"><div className="text-slate-900 font-black text-lg">0</div><div className="text-slate-400 text-xs">Following</div></div>
                </div>
              </div>
              <button onClick={() => setMinicastShowCreate(true)}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-3 shadow-md shadow-violet-200"
                data-testid="button-profile-record">
                <Mic className="w-4 h-4" />Record Your First MiniCast
              </button>
              <div className="text-center py-12">
                <Headphones className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No posts yet. Start sharing your voice!</p>
              </div>
            </div>
          )}

        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around px-2 shrink-0 bg-white border-t border-slate-100 shadow-lg" style={{height:64}}>
          <button onClick={() => setMinicastNavTab("home")}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${minicastNavTab==="home"?"text-violet-600":"text-slate-400 hover:text-slate-600"}`}
            data-testid="button-nav-home">
            <svg viewBox="0 0 24 24" fill={minicastNavTab==="home"?"#7c3aed":"none"} stroke={minicastNavTab==="home"?"#7c3aed":"#94a3b8"} strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-[10px] font-semibold">Home</span>
          </button>
          <button onClick={() => setMinicastNavTab("discover")}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${minicastNavTab==="discover"?"text-violet-600":"text-slate-400 hover:text-slate-600"}`}
            data-testid="button-nav-discover">
            <Globe className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Discover</span>
          </button>
          <button onClick={() => setMinicastShowCreate(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 -mt-5"
            data-testid="button-nav-record">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-300 border-4 border-white">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-violet-600 mt-1">Record</span>
          </button>
          <button onClick={() => setMinicastNavTab("voice")}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${minicastNavTab==="voice"?"text-violet-600":"text-slate-400 hover:text-slate-600"}`}
            data-testid="button-nav-voice">
            <Mic className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Voice</span>
          </button>
          <button onClick={() => setMinicastNavTab("profile")}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${minicastNavTab==="profile"?"text-violet-600":"text-slate-400 hover:text-slate-600"}`}
            data-testid="button-nav-profile">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white ${minicastNavTab==="profile"?"bg-gradient-to-br from-violet-500 to-purple-600":"bg-slate-300"}`}>ME</div>
            <span className="text-[10px] font-semibold">Profile</span>
          </button>
        </div>

      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Desktop Only
      ═══════════════════════════════════════ */}
      <aside className="hidden xl:flex w-72 2xl:w-80 flex-col bg-white border-l border-slate-100 shrink-0 overflow-y-auto shadow-sm">
        {/* User Profile Card */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-violet-200">ME</div>
              <div>
                <p className="text-slate-900 font-bold text-sm">My Profile</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Award className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-amber-500 text-[10px] font-semibold">Listener</span>
                </div>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors" data-testid="button-right-bell">
              <Bell className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 hover:border-violet-300 transition-colors">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Search a podcast..." className="flex-1 bg-transparent text-slate-600 text-xs outline-none placeholder:text-slate-400 min-w-0" data-testid="input-right-search" />
          </div>
        </div>

        {/* Top Creators row */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-900 font-bold text-sm">Top Creators</p>
            <button className="text-violet-600 text-xs font-semibold hover:text-violet-700 transition-colors">See all</button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1" style={{scrollbarWidth:"none"}}>
            {minicastPosts.slice(0,5).map(post => (
              <button key={post.id} onClick={() => { const idx=minicastPosts.findIndex(p=>p.id===post.id); setMinicastReelIndex(idx); setMinicastReelActive(true); }}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 group" data-testid={`button-top-creator-${post.id}`}>
                <div className="w-12 h-12 rounded-full p-0.5 group-hover:scale-105 transition-transform shadow-sm" style={{background:`linear-gradient(135deg,${post.bgFrom},${post.bgTo})`}}>
                  <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white"
                    style={{background:`linear-gradient(135deg,${post.bgFrom}cc,${post.bgTo}cc)`}}>{post.initials}</div>
                </div>
                <span className="text-slate-400 text-[9px] max-w-[48px] truncate">{post.creator.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Now Playing Card */}
        <div className="flex-1 px-5 py-4">
          <p className="text-slate-900 font-bold text-sm mb-3">Now Playing</p>
          <div className="rounded-2xl overflow-hidden border shadow-sm" style={{background:`linear-gradient(145deg,${nowPlayingPost.bgFrom}18,${nowPlayingPost.bgTo}28)`,borderColor:`${nowPlayingPost.bgFrom}30`}}>
            {/* Artwork */}
            <div className="relative h-44 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0" style={{background:`radial-gradient(ellipse 80% 80% at 50% 50%,${nowPlayingPost.bgFrom}30,${nowPlayingPost.bgTo}20)`}} />
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-white"
                style={{background:`linear-gradient(135deg,${nowPlayingPost.bgFrom},${nowPlayingPost.bgTo})`}}>
                {nowPlayingPost.initials}
                {isNowPlaying && (<><div className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" /><div className="absolute -inset-3 rounded-full border border-white/20 animate-pulse" /></>)}
              </div>
            </div>
            {/* Info */}
            <div className="px-4 pb-5 bg-white/60 backdrop-blur-sm">
              <p className="text-slate-900 font-bold text-base text-center mb-0.5">{nowPlayingPost.creator}</p>
              <p className="text-slate-500 text-xs text-center mb-4 line-clamp-1">{nowPlayingPost.title}</p>
              {/* Waveform */}
              <div className="flex items-end justify-center gap-0.5 h-10 mb-3 px-2">
                {nowPlayingPost.waveHeights.slice(0,20).map((h,i) => (
                  <div key={i} className="flex-1 rounded-full transition-all"
                    style={{height:`${isNowPlaying?h:Math.max(h*0.3,8)}%`,
                      background:isNowPlaying&&i<8?`linear-gradient(to top,${nowPlayingPost.bgFrom},${nowPlayingPost.bgTo})`:"rgba(139,92,246,0.2)"}} />
                ))}
              </div>
              {/* Progress */}
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full transition-all duration-1000" style={{width:isNowPlaying?"38%":"0%",background:`linear-gradient(to right,${nowPlayingPost.bgFrom},${nowPlayingPost.bgTo})`}} />
              </div>
              <div className="flex justify-between text-slate-400 text-[10px] mb-4">
                <span>{isNowPlaying?"0:58":"0:00"}</span><span>{nowPlayingPost.duration}</span>
              </div>
              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all" data-testid="button-right-prev">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={() => setMinicastPlayingId(isNowPlaying?null:nowPlayingPost.id)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  style={{background:`linear-gradient(135deg,${nowPlayingPost.bgFrom},${nowPlayingPost.bgTo})`}}
                  data-testid="button-right-play">
                  {isNowPlaying?<Pause className="w-5 h-5"/>:<Play className="w-5 h-5 ml-0.5"/>}
                </button>
                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all" data-testid="button-right-next">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          CREATE MODAL
      ═══════════════════════════════════════ */}
      {minicastShowCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMinicastShowCreate(false)} />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-slate-900 text-lg font-black">New MiniCast</h2>
              <button onClick={() => setMinicastShowCreate(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors" data-testid="button-close-create">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <div className="px-5 py-5">
              <div className="mb-4">
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {["Finance","AI","Startup","Crypto","Global","Tech"].map(cat => (
                    <button key={cat}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${minicastCategory===cat?"bg-violet-600 text-white border-violet-600":"bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600"}`}
                      onClick={() => setMinicastCategory(cat)}
                      data-testid={`button-create-cat-${cat.toLowerCase()}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Title</label>
                <input type="text" placeholder="What's your post about?"
                  className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
                  data-testid="input-post-title" />
              </div>
              <div className="bg-violet-50 rounded-2xl p-6 text-center border border-violet-100 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-200">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <p className="text-slate-700 font-semibold text-sm mb-1">Tap to Record</p>
                <p className="text-slate-400 text-xs">Max duration: 3 minutes</p>
              </div>
              <button onClick={() => setMinicastShowCreate(false)}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold text-sm hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 active:scale-95"
                data-testid="button-post-minicast">
                Publish MiniCast
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
