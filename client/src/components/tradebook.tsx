import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Headset,
  Info,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Share2,
  MoreVertical,
  Search,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { DemoHeatmap } from "@/components/DemoHeatmap";
import { PersonalHeatmap } from "@/components/PersonalHeatmap";

interface TradeBookProps {
  heatmapMode: 0 | 1 | 2;
  setHeatmapMode: (mode: 0 | 1 | 2) => void;
  selectedDate: Date | null;
  heatmapContainerRef: React.RefObject<HTMLDivElement | null>;
  handleDateSelect: (date: Date | undefined) => void;
  handleHeatmapDataUpdate: (data: any) => void;
  handleDateRangeChange: (range: any) => void;
  activeTagHighlight: { tag: string; dates: string[] } | null;
  setActiveTagHighlight: (value: { tag: string; dates: string[] } | null) => void;
  personalHeatmapRevision: number;
  personal2HeatmapRevision: number;
  setPersonalHeatmapRevision: React.Dispatch<React.SetStateAction<number>>;
  setPersonal2HeatmapRevision: React.Dispatch<React.SetStateAction<number>>;
  tradingDataByDate: Record<string, any>;
  setTradingDataByDate: (data: Record<string, any>) => void;
  saveAllTradingData: () => void;
  getUserId: () => string | null;
  fetchHeatmapChartData: (symbol: string, date: string) => void;
  setJournalChartMode: (mode: string) => void;
  setReportPostMode: (mode: string) => void;
  setReportPostSelectedDate: (date: string) => void;
  setRangePostOverrideData: (data: any) => void;
  setShowReportPostDialog: (show: boolean) => void;
  heatmapSelectedDate: string | null;
  setShowShareDialog: (show: boolean) => void;
  fomoButtonRef: React.RefObject<HTMLButtonElement | null>;
  overtradingButtonRef: React.RefObject<HTMLButtonElement | null>;
  plannedButtonRef: React.RefObject<HTMLButtonElement | null>;
  scrollTrigger: number;
  visibleStats: {
    pnl: boolean;
    trend: boolean;
    fomo: boolean;
    winRate: boolean;
    streak: boolean;
    overtrading: boolean;
    planned: boolean;
    topTags: boolean;
    aiAnalysis: boolean;
  };
  setVisibleStats: React.Dispatch<React.SetStateAction<any>>;
  getFilteredHeatmapData: () => Record<string, any>;
  selectedAudioTrack: { id: string; title: string; duration: string; youtubeId?: string } | null;
  setSelectedAudioTrack: (track: any) => void;
  isAudioPlaying: boolean;
  setIsAudioPlaying: (playing: boolean) => void;
  allAudioTracks: any[];
  youtubePlayerRef: React.RefObject<any>;
  duration: number;
  currentTime: number;
  audioProgress: number;
  setCurrentTime: (time: number) => void;
  setAudioProgress: (progress: number) => void;
  setHasManuallyToggledMode: (value: boolean) => void;
  setSelectedDailyFactors: (factors: any[]) => void;
  setSelectedIndicators: (indicators: any[]) => void;
  setTradeHistoryData: (data: any[]) => void;
  setTradeHistoryData2: (data: any[]) => void;
  setTradeHistoryWindow: (w: number) => void;
  setTradingImages: (images: any[]) => void;
}

export function TradeBook({
  heatmapMode,
  setHeatmapMode,
  selectedDate,
  heatmapContainerRef,
  handleDateSelect,
  handleHeatmapDataUpdate,
  handleDateRangeChange,
  activeTagHighlight,
  setActiveTagHighlight,
  personalHeatmapRevision,
  personal2HeatmapRevision,
  setPersonalHeatmapRevision,
  setPersonal2HeatmapRevision,
  tradingDataByDate,
  setTradingDataByDate,
  saveAllTradingData,
  getUserId,
  fetchHeatmapChartData,
  setJournalChartMode,
  setReportPostMode,
  setReportPostSelectedDate,
  setRangePostOverrideData,
  setShowReportPostDialog,
  heatmapSelectedDate,
  setShowShareDialog,
  fomoButtonRef,
  overtradingButtonRef,
  plannedButtonRef,
  scrollTrigger,
  visibleStats,
  setVisibleStats,
  getFilteredHeatmapData,
  selectedAudioTrack,
  setSelectedAudioTrack,
  isAudioPlaying,
  setIsAudioPlaying,
  allAudioTracks,
  youtubePlayerRef,
  duration,
  currentTime,
  audioProgress,
  setCurrentTime,
  setAudioProgress,
  setHasManuallyToggledMode,
  setSelectedDailyFactors,
  setSelectedIndicators,
  setTradeHistoryData,
  setTradeHistoryData2,
  setTradeHistoryWindow,
  setTradingImages,
}: TradeBookProps) {
  type AudioTrack = { id: string; title: string; duration: string; youtubeId?: string };
  type SearchResult = { videoId: string; title: string; thumbnail: string; duration: string };

  const DEFAULT_MEDITATION: AudioTrack[] = [
    { title: "Deep Relaxation Meditation", duration: "10:05", id: "m1", youtubeId: "B7nkVhC10Gw" },
  ];
  const DEFAULT_PSYCHOLOGY: AudioTrack[] = [
    { title: 'Bruce Lee: "Your Greatest Enemy Is Within"', duration: "22:30", id: "p1", youtubeId: "KnppzfiZcgM" },
  ];

  const [meditationTracks, setMeditationTracks] = useState<AudioTrack[]>(DEFAULT_MEDITATION);
  const [psychologyTracks, setPsychologyTracks] = useState<AudioTrack[]>(DEFAULT_PSYCHOLOGY);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCategory, setSearchCategory] = useState<"meditation" | "psychology">("meditation");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => runSearch(val), 500);
  };

  const addTrack = (result: SearchResult) => {
    const newTrack: AudioTrack = {
      id: `yt-${result.videoId}`,
      title: result.title,
      duration: result.duration,
      youtubeId: result.videoId,
    };
    if (searchCategory === "meditation") {
      setMeditationTracks(prev => prev.find(t => t.id === newTrack.id) || prev.length >= 4 ? prev : [...prev, newTrack]);
    } else {
      setPsychologyTracks(prev => prev.find(t => t.id === newTrack.id) || prev.length >= 4 ? prev : [...prev, newTrack]);
    }
  };

  const removeTrack = (category: "meditation" | "psychology", id: string) => {
    if (category === "meditation") setMeditationTracks(prev => prev.filter(t => t.id !== id));
    else setPsychologyTracks(prev => prev.filter(t => t.id !== id));
  };

  const handleDone = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
                    <div className="relative">
                    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <CardContent className="p-6 px-0.5 md:px-4 md:py-4 pt-[10px] pb-[10px]">
                        <div className={`text-[10px] uppercase tracking-wider mb-2 flex items-center justify-between gap-2 rounded-md px-1 -mx-1 ${heatmapMode === 2 ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 py-0.5' : 'text-gray-500 dark:text-gray-400'}`}>
                          <div className="flex items-center gap-1">
                            <div>Trade Book</div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-4 w-4" data-testid="button-tradebook-help">
                                  <Headset className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[95vw] max-w-[700px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-xl shadow-2xl [&>button]:hidden">
                                <div className="flex flex-col md:flex-row h-[420px] md:h-[460px]">
                                  {/* Left Side: Thumbnail — compact on mobile, full on desktop */}
                                  <div className="w-full md:w-1/2 relative flex flex-col bg-slate-100 dark:bg-slate-800 overflow-hidden border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 h-40 md:h-auto">
                                    {/* Mobile-only: MINI PLAY label centered at top of thumbnail */}
                                    <div className="md:hidden absolute top-0 left-0 right-0 z-20 flex items-center justify-center pt-2 pointer-events-none">
                                      <span className="text-[9px] font-bold text-white/70 uppercase tracking-[0.35em] bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">Mini Play</span>
                                    </div>
                                    {/* Mobile-only: X close button top-right */}
                                    <DialogClose asChild>
                                      <button className="md:hidden absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors" data-testid="button-miniplay-close-mobile">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </DialogClose>
                                    {/* Background glow */}
                                    <div className="absolute inset-0 opacity-10">
                                      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] rounded-full bg-gradient-to-br from-violet-500 via-transparent to-transparent"></div>
                                    </div>
                                    {/* Thumbnail card */}
                                    <div className="flex-1 flex items-center justify-center p-3 md:p-8 relative">
                                    <motion.div key={selectedAudioTrack?.id || "none"} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative w-full aspect-[1.6/1] md:aspect-[1.6/1] rounded-xl md:rounded-2xl shadow-2xl flex flex-col justify-start border border-white/10 overflow-hidden">
                                      {selectedAudioTrack?.youtubeId ? (
                                        <div className="absolute inset-0 z-0">
                                          <img 
                                            src={`https://img.youtube.com/vi/${selectedAudioTrack.youtubeId}/maxresdefault.jpg`} 
                                            className="w-full h-full object-cover"
                                            alt=""
                                          />
                                        </div>
                                      ) : (
                                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-violet-800 to-purple-900" />
                                      )}
                                      <button onClick={() => selectedAudioTrack?.youtubeId && window.open(`https://www.youtube.com/watch?v=${selectedAudioTrack.youtubeId}`, "_blank")} className="absolute bottom-2 right-2 z-10 hover:scale-110 transition-transform active:scale-95">
                                        <Info className="w-3.5 h-3.5 text-white/70" />
                                      </button>
                                    </motion.div>
                                    </div>
                                  </div>
                                  <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-slate-900 min-h-0 overflow-hidden">
                                    {/* Header: always visible */}
                                    <div className="flex-shrink-0 py-2 px-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] opacity-50">Play</div>
                                      <div className="flex items-center gap-1">
                                        {isSearchOpen && (
                                          <button
                                            onClick={handleDone}
                                            className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                                            data-testid="button-miniplay-done"
                                          >
                                            Done
                                          </button>
                                        )}
                                        <button
                                          onClick={() => { setIsSearchOpen(v => !v); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSearchOpen ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20'}`}
                                          data-testid="button-miniplay-search"
                                        >
                                          <Search className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Content area: search mode OR playlist mode — fills remaining height */}
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                      {isSearchOpen ? (
                                        /* ── SEARCH MODE: category tabs + input + results fill this area ── */
                                        <div className="flex flex-col h-full p-3 gap-2 w-full overflow-hidden">
                                          {/* Category tabs */}
                                          <div className="flex gap-1 flex-shrink-0 w-full">
                                            {(["meditation", "psychology"] as const).map(cat => (
                                              <button
                                                key={cat}
                                                onClick={() => setSearchCategory(cat)}
                                                className={`flex-1 text-[9px] font-bold uppercase tracking-wider py-1 rounded transition-colors ${searchCategory === cat ? (cat === 'meditation' ? 'bg-violet-500 text-white' : 'bg-blue-500 text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                              >
                                                {cat} ({(cat === 'meditation' ? meditationTracks : psychologyTracks).length}/4)
                                              </button>
                                            ))}
                                          </div>
                                          {/* Search input */}
                                          <div className="flex-shrink-0 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1.5">
                                            <Search className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                            <input
                                              ref={searchInputRef}
                                              value={searchQuery}
                                              onChange={e => handleSearchInput(e.target.value)}
                                              placeholder="Search..."
                                              className="flex-1 min-w-0 bg-transparent text-[11px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none"
                                              data-testid="input-miniplay-search"
                                            />
                                            {isSearching && <Loader2 className="w-3 h-3 text-slate-400 animate-spin flex-shrink-0" />}
                                            {searchQuery && !isSearching && (
                                              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                                                <X className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                          {/* Search results — scrollable, fills remaining space, width-clamped */}
                                          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-100 dark:border-slate-700 w-full">
                                            {searchResults.length > 0 ? searchResults.map(result => {
                                              const targetList = searchCategory === 'meditation' ? meditationTracks : psychologyTracks;
                                              const alreadyAdded = targetList.some(t => t.id === `yt-${result.videoId}`);
                                              const limitReached = targetList.length >= 4;
                                              const canAdd = !alreadyAdded && !limitReached;
                                              return (
                                                <div
                                                  key={result.videoId}
                                                  className={`flex items-center gap-2 p-1.5 w-full min-w-0 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${canAdd ? 'cursor-pointer' : ''}`}
                                                  onClick={() => { if (canAdd) addTrack(result); }}
                                                >
                                                  <img src={result.thumbnail} alt="" className="w-9 h-6 rounded object-cover flex-shrink-0 bg-slate-200" />
                                                  <span className="flex-1 w-0 min-w-0 text-[10px] text-slate-700 dark:text-slate-300 leading-tight truncate">{result.title}</span>
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); if (canAdd) addTrack(result); }}
                                                    disabled={alreadyAdded || limitReached}
                                                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${alreadyAdded ? 'bg-green-100 text-green-500 dark:bg-green-900/30' : limitReached ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-500 hover:bg-violet-500 hover:text-white'}`}
                                                    title={alreadyAdded ? 'Added' : limitReached ? 'Max 4' : 'Add'}
                                                    data-testid={`button-add-track-${result.videoId}`}
                                                  >
                                                    <Plus className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              );
                                            }) : (
                                              <div className="flex items-center justify-center h-full text-[10px] text-slate-400 py-4">
                                                {searchQuery && !isSearching ? 'No results found' : 'Type to search tracks'}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        /* ── PLAYLIST MODE: combined meditation + psychology, scrollable ── */
                                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-1 w-full">
                                          {/* Meditation tracks */}
                                          {meditationTracks.length > 0 && (
                                            <div className="mb-1">
                                              <div className="flex items-center gap-1.5 px-1 mb-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0"></span>
                                                <span className="text-[9px] font-bold text-violet-500 uppercase tracking-widest">Meditation</span>
                                              </div>
                                              {meditationTracks.map(track => (
                                                <div key={track.id} className="group flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full min-w-0 overflow-hidden">
                                                  <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-500 transition-colors flex-shrink-0 cursor-pointer" onClick={() => { setSelectedAudioTrack(track); setIsAudioPlaying(true); }}>
                                                    <Play className="w-2.5 h-2.5 text-violet-500 group-hover:text-white" />
                                                  </div>
                                                  <span className="flex-1 w-0 min-w-0 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate cursor-pointer" onClick={() => { setSelectedAudioTrack(track); setIsAudioPlaying(true); }}>{track.title}</span>
                                                  <span className="text-[9px] font-mono text-slate-400 flex-shrink-0 whitespace-nowrap">{track.duration}</span>
                                                  <button onClick={() => removeTrack("meditation", track.id)} className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0" data-testid={`button-remove-meditation-${track.id}`}>
                                                    <X className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {/* Psychology tracks */}
                                          {psychologyTracks.length > 0 && (
                                            <div>
                                              <div className="flex items-center gap-1.5 px-1 mb-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                                                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Psychology</span>
                                              </div>
                                              {psychologyTracks.map(track => (
                                                <div key={track.id} className="group flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full min-w-0 overflow-hidden">
                                                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-500 transition-colors flex-shrink-0 cursor-pointer" onClick={() => { setSelectedAudioTrack(track); setIsAudioPlaying(true); }}>
                                                    <Play className="w-2.5 h-2.5 text-blue-500 group-hover:text-white" />
                                                  </div>
                                                  <span className="flex-1 w-0 min-w-0 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate cursor-pointer" onClick={() => { setSelectedAudioTrack(track); setIsAudioPlaying(true); }}>{track.title}</span>
                                                  <span className="text-[9px] font-mono text-slate-400 flex-shrink-0 whitespace-nowrap">{track.duration}</span>
                                                  <button onClick={() => removeTrack("psychology", track.id)} className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0" data-testid={`button-remove-psychology-${track.id}`}>
                                                    <X className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {meditationTracks.length === 0 && psychologyTracks.length === 0 && (
                                            <div className="flex items-center justify-center h-full text-[10px] text-slate-400 italic">Tap search to add tracks</div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer / Now Playing — always visible, never shrinks */}
                                    <div className="flex-shrink-0 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                      <div className="flex items-center justify-start gap-3 overflow-hidden">
                                        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                                          <div className={`w-8 h-8 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 ${selectedAudioTrack ? "animate-none" : "animate-pulse"}`}>
                                            <Music2 className="w-4 h-4 text-white" />
                                          </div>
                                          <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 truncate">
                                              {selectedAudioTrack ? selectedAudioTrack.title : "Select a session"}
                                            </div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-tighter truncate whitespace-nowrap">
                                              {selectedAudioTrack ? `${isAudioPlaying ? 'Playing' : 'Paused'} • ${selectedAudioTrack.duration}` : "Ready to play"}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Audio Controls */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100" onClick={() => {
                                            const currentIdx = allAudioTracks.findIndex(t => t.id === selectedAudioTrack?.id);
                                            const prevTrack = allAudioTracks[(currentIdx - 1 + allAudioTracks.length) % allAudioTracks.length];
                                            setSelectedAudioTrack(prevTrack);
                                            setIsAudioPlaying(true);
                                          }}>
                                            <SkipBack className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                            onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                                          >
                                            {isAudioPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100" onClick={() => {
                                            const currentIdx = allAudioTracks.findIndex(t => t.id === selectedAudioTrack?.id);
                                            const nextTrack = allAudioTracks[(currentIdx + 1) % allAudioTracks.length];
                                            setSelectedAudioTrack(nextTrack);
                                            setIsAudioPlaying(true);
                                          }}>
                                            <SkipForward className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {/* Audio Progress Slider */}
                                      <div className="px-1">
                                        <div className="relative w-full h-1 bg-slate-200 dark:bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer" onClick={(e) => { if (selectedAudioTrack && youtubePlayerRef.current && duration > 0) { const rect = e.currentTarget.getBoundingClientRect(); const x = e.clientX - rect.left; const clickedProgress = x / rect.width; const newTime = clickedProgress * duration; youtubePlayerRef.current.seekTo(newTime, true); setCurrentTime(newTime); setAudioProgress(clickedProgress * 100); } } }>
                                          <div 
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
                                            style={{ width: `${selectedAudioTrack ? audioProgress : 0}%` }}
                                          ></div>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400">
                                            {selectedAudioTrack ? new Date(currentTime * 1000).toISOString().substr(14, 5) : "0:00"}
                                          </span>
                                          <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400">
                                            {selectedAudioTrack ? (duration > 0 ? new Date(duration * 1000).toISOString().substr(14, 5) : selectedAudioTrack.duration) : "0:00"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Demo label shown before toggle when demo mode is active */}
                            {heatmapMode === 0 && (
                              <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide select-none">Demo</span>
                            )}
                            {/* 3-state heatmap mode toggle: 0=Demo, 1=Personal-1, 2=Personal-2 */}
                            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded p-0.5" data-testid="heatmap-mode-toggle">
                              {([0, 1, 2] as const).map((mode) => {
                                const labels = ['D', '1', '2'];
                                const titles = ['Demo mode', 'Personal 1', 'Personal 2'];
                                const isActive = heatmapMode === mode;
                                return (
                                  <button
                                    key={mode}
                                    title={titles[mode]}
                                    data-testid={`heatmap-mode-btn-${mode}`}
                                    onClick={() => {
                                      console.log(`🔄 Switching heatmap mode to ${mode}`);
                                      setHasManuallyToggledMode(true);
                                      localStorage.setItem("hasManuallyToggledMode", "true");
                                      setHeatmapMode(mode);
                                      localStorage.setItem("heatmapMode", String(mode));
                                      localStorage.setItem("tradingJournalDemoMode", String(mode === 0));
                                      setSelectedDailyFactors([]);
                                      setSelectedIndicators([]);
                                      if (mode === 2) {
                                        setTradeHistoryData2([]);
                                        setTradeHistoryWindow(2);
                                      } else {
                                        setTradeHistoryData([]);
                                        setTradeHistoryWindow(1);
                                      }
                                      setTradingImages([]);
                                      setTradingDataByDate({});
                                      if (mode === 2) {
                                        setPersonal2HeatmapRevision(prev => prev + 1);
                                      } else {
                                        setPersonalHeatmapRevision(prev => prev + 1);
                                      }
                                      console.log(`✅ Switched to mode ${mode} - CLEARED cache`);
                                    }}
                                    className={`w-5 h-4 rounded text-[9px] font-bold transition-colors ${
                                      isActive
                                        ? mode === 0
                                          ? 'bg-blue-500 text-white'
                                          : mode === 1
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-violet-600 text-white'
                                        : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    {labels[mode]}
                                  </button>
                                );
                              })}
                            </div>
                            <Button
                              onClick={saveAllTradingData}
                              size="sm"
                              variant="outline"
                              disabled={heatmapMode === 0 && localStorage.getItem('currentUserEmail') !== 'chiranjeevi.perala99@gmail.com'}
                              className={`h-5 px-2 text-[10px] border-gray-300 dark:border-gray-700 ${
                                (heatmapMode === 0 && localStorage.getItem('currentUserEmail') !== 'chiranjeevi.perala99@gmail.com')
                                  ? 'text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                              data-testid="button-save-trade-book"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                        {/* ✅ NEW CLEAN HEATMAP IMPLEMENTATION - Separate components for Demo & Personal */}
                        <div className="relative">
                         <div ref={heatmapContainerRef} className="pt-0.5">
                          {heatmapMode === 0 ? (
                            <DemoHeatmap 
                              onDateSelect={handleDateSelect}
                              selectedDate={selectedDate}
                              tradingDataByDate={tradingDataByDate}
                              onDataUpdate={(data) => {
                                handleHeatmapDataUpdate(data);
                                // Scroll to latest data for demo mode
                                setTimeout(() => {
                                  if (heatmapContainerRef.current) {
                                    const scrollContainer = heatmapContainerRef.current.querySelector('[style*="overflow"]') as HTMLElement;
                                    if (scrollContainer) {
                                      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
                                      console.log("🎯 Demo heatmap: Scrolled to latest data view");
                                    }
                                  }
                                }, 300);
                              }}
                              onRangeChange={handleDateRangeChange}
                              highlightedDates={activeTagHighlight}
                              refreshTrigger={personalHeatmapRevision}
                              onSelectDateForHeatmap={(symbol, date) => {
                                console.log(`📊 [HOME] Switching to heatmap mode - Symbol: ${symbol}, Date: ${date}`);
                                setJournalChartMode('heatmap');
                                fetchHeatmapChartData(symbol, date);
                              }}
                              onFeedPost={(mode, data) => {
                                setReportPostMode(mode);
                                if (mode === 'selected') {
                                  setReportPostSelectedDate(selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                                }
                                if (mode === 'range' && data) {
                                  setRangePostOverrideData(data);
                                }
                                setShowReportPostDialog(true);
                              }}
                            />
                          ) : heatmapMode === 1 ? (
                            <PersonalHeatmap
                              userId={getUserId()}
                              defaultTitle="Personal"
                              onDateSelect={handleDateSelect}
                              selectedDate={selectedDate}
                              onDataUpdate={handleHeatmapDataUpdate}
                              onRangeChange={handleDateRangeChange}
                              highlightedDates={activeTagHighlight}
                              refreshTrigger={personalHeatmapRevision}
                              initialData={tradingDataByDate}
                              onFeedPost={(mode, data) => {
                                setReportPostMode(mode);
                                if (mode === 'selected') {
                                  setReportPostSelectedDate(heatmapSelectedDate || new Date().toISOString().split('T')[0]);
                                }
                                if (mode === 'range' && data) {
                                  setRangePostOverrideData(data);
                                }
                                setShowReportPostDialog(true);
                              }}
                            />
                          ) : (
                            <PersonalHeatmap
                              userId={(() => { const uid = getUserId(); return uid ? `2_${uid}` : null; })()}
                              defaultTitle="Personal"
                              onDateSelect={handleDateSelect}
                              selectedDate={selectedDate}
                              onDataUpdate={handleHeatmapDataUpdate}
                              onRangeChange={handleDateRangeChange}
                              highlightedDates={activeTagHighlight}
                              refreshTrigger={personal2HeatmapRevision}
                              initialData={tradingDataByDate}
                              onFeedPost={(mode, data) => {
                                setReportPostMode(mode);
                                if (mode === 'selected') {
                                  setReportPostSelectedDate(heatmapSelectedDate || new Date().toISOString().split('T')[0]);
                                }
                                if (mode === 'range' && data) {
                                  setRangePostOverrideData(data);
                                }
                                setShowReportPostDialog(true);
                              }}
                            />
                          )}
                        </div>

                        {/* Curved Lines Overlay - connects FOMO tag block to highlighted dates */}
                        {(activeTagHighlight?.tag === 'fomo' || activeTagHighlight?.tag === 'overtrading' || activeTagHighlight?.tag === 'planned') && activeTagHighlight.dates.length > 0 && (() => {
                          // Force recalculation on scroll (dependency: scrollTrigger)
                          void scrollTrigger;

                          // Calculate curved paths from FOMO button to each highlighted date cell
                          const paths: JSX.Element[] = [];

                          const buttonRef = activeTagHighlight?.tag === 'fomo' ? fomoButtonRef : activeTagHighlight?.tag === 'overtrading' ? overtradingButtonRef : plannedButtonRef;
                          if (!buttonRef.current || !heatmapContainerRef.current) {
                            return null;
                          }

                          // Get scrollable dimensions (like DemoHeatmap does)
                          const scrollWidth = heatmapContainerRef.current.scrollWidth || 0;
                          const scrollHeight = heatmapContainerRef.current.scrollHeight || 0;
                          const scrollLeft = heatmapContainerRef.current.scrollLeft || 0;
                          const scrollTop = heatmapContainerRef.current.scrollTop || 0;

                          // Get positions relative to the heatmap's scrollable content
                          const containerRect = heatmapContainerRef.current.getBoundingClientRect();
                          const buttonRect = buttonRef.current!.getBoundingClientRect();

                          // Calculate button position relative to scrollable content
                          const buttonCenterX = buttonRect.left - containerRect.left + scrollLeft + buttonRect.width / 2;
                          const buttonCenterY = buttonRect.top - containerRect.top + scrollTop + buttonRect.height / 2;

                          // Find all highlighted date cells and draw curved lines to them
                          activeTagHighlight.dates.forEach((date, index) => {
                            // Find the heatmap cell for this date
                            const cellElement = heatmapContainerRef.current?.querySelector(
                              `[data-date="${date}"]`
                            );

                            if (cellElement) {
                              const cellRect = cellElement.getBoundingClientRect();

                              // Calculate cell position relative to scrollable content
                              const cellCenterX = cellRect.left - containerRect.left + scrollLeft + cellRect.width / 2;
                              const cellCenterY = cellRect.top - containerRect.top + scrollTop + cellRect.height / 2;

                              // Create quadratic Bezier curve (Q command)
                              // Control point is positioned to create a nice arc
                              const controlX = (buttonCenterX + cellCenterX) / 2;
                              const controlY = Math.min(buttonCenterY, cellCenterY) - 50; // Arc upward

                              const pathD = `M ${buttonCenterX} ${buttonCenterY} Q ${controlX} ${controlY}, ${cellCenterX} ${cellCenterY}`;

                              paths.push(
                                <g key={`connection-${date}-${index}`}>
                                  {/* Bright colored line with dashed pattern */}
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke={activeTagHighlight?.tag === 'fomo' ? "url(#curvedLineGradient)" : activeTagHighlight?.tag === 'overtrading' ? "url(#overtradingLineGradient)" : "url(#plannedLineGradient)"}
                                    strokeWidth="2.5"
                                    strokeDasharray="6,4"
                                    opacity="0.95"
                                  />
                                  {/* Glowing dot at the end of each line */}
                                  <circle
                                    cx={cellCenterX}
                                    cy={cellCenterY}
                                    r="4"
                                    fill={activeTagHighlight?.tag === 'fomo' ? "#fcd34d" : activeTagHighlight?.tag === 'overtrading' ? "#fb923c" : "#4ade80"}
                                    opacity="0.9"
                                  />
                                  <circle
                                    cx={cellCenterX}
                                    cy={cellCenterY}
                                    r="3"
                                    fill={activeTagHighlight?.tag === 'fomo' ? "#fbbf24" : activeTagHighlight?.tag === 'overtrading' ? "#f97316" : "#22c55e"}
                                    className="animate-pulse"
                                  />
                                </g>
                              );
                            }
                          });

                          return (
                            <svg
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${scrollWidth}px`,
                                height: `${scrollHeight}px`,
                                pointerEvents: 'none',
                                zIndex: 10,
                              }}
                            >
                              {/* Define bright gradient for the curved lines */}
                              <defs>
                                <linearGradient id="curvedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="overtradingLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#fb923c" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="plannedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#16a34a" stopOpacity="1" />
                                </linearGradient>
                              </defs>
                              {paths}
                            </svg>
                          );
                        })()}
                        </div>

                        {/* Quick Stats Banner */}
                        <div className="mt-2 mb-20 md:mb-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-md px-2 py-1.5 relative" data-testid="banner-quick-stats">
                          {(() => {
                            // Calculate metrics from heatmap data and build tag-to-dates mapping
                            const filteredData = getFilteredHeatmapData();
                            const dates = Object.keys(filteredData);
                            let totalPnL = 0;
                            let totalTrades = 0;
                            let winningTrades = 0;
                            let fomoTrades = 0;
                            let consecutiveWins = 0;
                            let maxWinStreak = 0;
                            const trendData: number[] = [];
                            const fomoDates: string[] = [];
                            const overTradingDates: string[] = [];
                            const plannedDates: string[] = [];
                            let plannedCount = 0;
                            const tagStats: Record<string, any> = {};
                            const tagDates: Record<string, string[]> = {};
                            let overTradingCount = 0;

                            dates.sort().forEach(dateKey => {
                              const dayData = filteredData[dateKey];
                              const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
                              const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];

                              if (metrics) {
                                const netPnL = metrics.netPnL || 0;
                                totalPnL += netPnL;
                                totalTrades += metrics.totalTrades || 0;
                                winningTrades += metrics.winningTrades || 0;
                                trendData.push(netPnL);

                                // Track overtrading - check for tag or high trade count
                                if ((metrics.totalTrades || 0) > 10) {
                                  overTradingCount++;
                                  overTradingDates.push(dateKey);
                                }

                                // Also track if overtrading tag exists
                                if (Array.isArray(tags) && tags.length > 0) {
                                  const normalizedTags = tags.map((t: string) => t.trim().toLowerCase());
                                  if (normalizedTags.includes('overtrading')) {
                                    if (!overTradingDates.includes(dateKey)) {
                                      overTradingCount++;
                                      overTradingDates.push(dateKey);
                                    }
                                  }
                                }

                                if (Array.isArray(tags) && tags.length > 0) {
                                  const normalizedTags = tags.map((t: string) => t.trim().toLowerCase());
                                  if (normalizedTags.includes('fomo')) {
                                    fomoTrades++;
                                    fomoDates.push(dateKey);
}
                                  if (normalizedTags.includes('planned')) {
                                    plannedCount++;
                                    plannedDates.push(dateKey);
                                  }
                                  // Track all tags with their dates
                                  normalizedTags.forEach(tag => {
                                    tagStats[tag] = (tagStats[tag] || 0) + 1;
                                    if (!tagDates[tag]) tagDates[tag] = [];
                                    tagDates[tag].push(dateKey);
                                  });
                                }

                                if (netPnL > 0) {
                                  consecutiveWins++;
                                  maxWinStreak = Math.max(maxWinStreak, consecutiveWins);
                                } else if (netPnL < 0) {
                                  consecutiveWins = 0;
                                }
                              }
                            });

                            const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
                            const isProfitable = totalPnL >= 0;
                            const topTags = Object.entries(tagStats)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 3)
                              .map(([tag, count]) => ({ tag, count }));

                            const createSparkline = (data: number[]) => {
                              if (data.length === 0) return '';
                              const max = Math.max(...data);
                              const min = Math.min(...data);
                              const range = max - min || 1;
                              const width = 40;
                              const height = 16;
                              const points = data.map((val, i) => {
                                const x = (i / (data.length - 1 || 1)) * width;
                                const y = height - ((val - min) / range) * height;
                                return `${x},${y}`;
                              }).join(' ');
                              return `M ${points.split(' ').join(' L ')}`;
                            };

                            return (
                              <div className="space-y-2">
                                {/* Header row with stats and menu */}
                                <div className="flex justify-start items-center gap-2">
                                  <div className={`text-white flex-1 flex ${Object.values(visibleStats).filter(v => v).length === 1 ? 'justify-center' : 'justify-around'} items-stretch gap-2`}>
                                    {visibleStats.pnl && (
                                      <div className="flex flex-col items-center justify-center" data-testid="stat-total-pnl">
                                        <div className="text-[10px] opacity-80">P&L</div>
                                        <div className={`text-xs font-bold ${isProfitable ? 'text-green-200' : 'text-red-200'}`}>
                                          {totalPnL >= 0 ? '+' : ''}₹{(totalPnL / 1000).toFixed(1)}K
                                        </div>
                                      </div>
                                    )}
                                    {visibleStats.trend && (
                                      <div className="flex flex-col items-center justify-center" data-testid="stat-trend">
                                        <div className="text-[10px] opacity-80">Trend</div>
                                        <svg width="40" height="16" className="mt-0.5">
                                          <path d={createSparkline(trendData)} fill="none" stroke="white" strokeWidth="1.5" opacity="0.9" />
                                        </svg>
                                      </div>
                                    )}
                                    {visibleStats.fomo && (
                                      <button 
                                        ref={fomoButtonRef}
                                        className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${
                                          activeTagHighlight?.tag === 'fomo' ? 'bg-white/30 ring-2 ring-white/50' : ''
                                        }`} 
                                        onClick={() => setActiveTagHighlight(activeTagHighlight?.tag === 'fomo' ? null : { tag: 'fomo', dates: fomoDates })} 
                                        data-testid="stat-fomo"
                                        title={`Click to ${activeTagHighlight?.tag === 'fomo' ? 'hide' : 'show'} FOMO dates on heatmap`}
                                      >
                                        <div className="text-[10px] opacity-80">FOMO</div>
                                        <div className="text-xs font-bold">{fomoTrades}</div>
                                      </button>
                                    )}
                                    {visibleStats.winRate && (
                                      <div className="flex flex-col items-center justify-center" data-testid="stat-success-rate">
                                        <div className="text-[10px] opacity-80">Win%</div>
                                        <div className="text-xs font-bold">{winRate.toFixed(0)}%</div>
                                      </div>
                                    )}
                                    {visibleStats.streak && (
                                      <div className="flex flex-col items-center justify-center" data-testid="stat-win-streak">
                                        <div className="text-[10px] opacity-80">Streak</div>
                                        <div className="text-xs font-bold">{maxWinStreak}</div>
                                      </div>
                                    )}
                                    {visibleStats.overtrading && (
                                      <button 
                                        ref={overtradingButtonRef}
                                        className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${
                                          activeTagHighlight?.tag === 'overtrading' ? 'bg-white/30 ring-2 ring-white/50' : ''
                                        }`} 
                                        onClick={() => setActiveTagHighlight(activeTagHighlight?.tag === 'overtrading' ? null : { tag: 'overtrading', dates: overTradingDates })} 
                                        data-testid="stat-overtrading"
                                        title={`Click to ${activeTagHighlight?.tag === 'overtrading' ? 'hide' : 'show'} overtrading dates on heatmap`}
                                      >
                                        <div className="text-[10px] opacity-80">OverTrade</div>
                                        <div className="text-xs font-bold text-orange-200">{overTradingCount}</div>
                                      </button>
                                    )}
                                    {visibleStats.planned && (
                                      <button 
                                        ref={plannedButtonRef}
                                        className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${activeTagHighlight?.tag === 'planned' ? 'bg-white/30 ring-2 ring-white/50' : ''}`} 
                                        onClick={() => setActiveTagHighlight(activeTagHighlight?.tag === 'planned' ? null : { tag: 'planned', dates: plannedDates })} 
                                        data-testid="stat-planned"
                                        title={`Click to ${activeTagHighlight?.tag === 'planned' ? 'hide' : 'show'} planned trade dates on heatmap`}
                                      >
                                        <div className="text-[10px] opacity-80">Planned</div>
                                        <div className="text-xs font-bold text-green-200">{plannedCount}</div>
                                      </button>
                                    )}

                                  </div>

                                  {/* Share Icon */}
                                  <button
                                    className="flex items-center justify-center w-6 h-6 bg-white/20 rounded hover:bg-white/30 transition-colors"
                                    onClick={() => setShowShareDialog(true)}
                                    data-testid="button-share-tradebook"
                                    title="Share tradebook"
                                  >
                                    <Share2 className="w-4 h-4 text-white" />
                                  </button>

                                  {/* 3-Dot Menu Button */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="flex items-center justify-center w-6 h-6 bg-white/20 rounded hover:bg-white/30 transition-colors text-white" data-testid="button-stats-menu">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-3 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                                      <div className="space-y-2">
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-start">
                                          <span>Customize Magic Bar</span>
                                          <span className="text-xs opacity-70">{Object.values(visibleStats).filter(v => v).length}/{window.innerWidth < 768 ? 5 : 6}</span>
                                        </div>
                                        {(() => {
                                          const selectedCount = Object.values(visibleStats).filter(v => v).length;
                                          const magicBarLimit = window.innerWidth < 768 ? 5 : 6;
                                          const isAtLimit = selectedCount >= magicBarLimit;
                                          const handleCheckChange = (field: string, checked: boolean) => {
                                            if (checked && isAtLimit) return;
                                            const updated = {...visibleStats, [field]: checked}; setVisibleStats(updated); localStorage.setItem("magicBarPrefs", JSON.stringify(updated));
                                          };
                                          return (
                                            <div className="flex flex-col gap-2">
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.pnl && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.pnl} onChange={(e) => handleCheckChange('pnl', e.target.checked)} disabled={!visibleStats.pnl && isAtLimit} className="rounded" />
                                                P&L
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.trend && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.trend} onChange={(e) => handleCheckChange('trend', e.target.checked)} disabled={!visibleStats.trend && isAtLimit} className="rounded" />
                                                Trend
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.fomo && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.fomo} onChange={(e) => handleCheckChange('fomo', e.target.checked)} disabled={!visibleStats.fomo && isAtLimit} className="rounded" />
                                                FOMO
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.winRate && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.winRate} onChange={(e) => handleCheckChange('winRate', e.target.checked)} disabled={!visibleStats.winRate && isAtLimit} className="rounded" />
                                                Win Rate
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.streak && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.streak} onChange={(e) => handleCheckChange('streak', e.target.checked)} disabled={!visibleStats.streak && isAtLimit} className="rounded" />
                                                Streak
                                              </label>
                                              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.overtrading && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.overtrading} onChange={(e) => handleCheckChange('overtrading', e.target.checked)} disabled={!visibleStats.overtrading && isAtLimit} className="rounded" />
                                                Overtrading
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.planned && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.planned} onChange={(e) => handleCheckChange('planned', e.target.checked)} disabled={!visibleStats.planned && isAtLimit} className="rounded" />
                                                Planned
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.topTags && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.topTags} onChange={(e) => handleCheckChange('topTags', e.target.checked)} disabled={!visibleStats.topTags && isAtLimit} className="rounded" />
                                                Top Tags
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.aiAnalysis && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.aiAnalysis} onChange={(e) => handleCheckChange('aiAnalysis', e.target.checked)} disabled={!visibleStats.aiAnalysis && isAtLimit} className="rounded" />
                                                AI Analysis
                                              </label>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>


                                {/* Top Tags Block with Curved Lines */}
                                {visibleStats.topTags && topTags.length > 0 && (
                                  <div className="bg-white/10 rounded px-2 py-1 text-xs text-white">
                                    <div className="opacity-80 mb-1">Top Tags:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {topTags.map(({tag, count}) => (
                                        <button 
                                          key={tag}
                                          className={`hover-elevate active-elevate-2 rounded px-2 py-0.5 text-xs transition-all ${
                                            activeTagHighlight?.tag === tag ? 'bg-white/50 ring-2 ring-white/50' : 'bg-white/20'
                                          }`}
                                          onClick={() => setActiveTagHighlight(activeTagHighlight?.tag === tag ? null : { tag, dates: tagDates[tag] || [] })}
                                          data-testid={`stat-toptag-${tag}`}
                                        >
                                          {tag} <span className="text-black">({count})</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* AI Analysis Block - Static Text Only */}
                                {visibleStats.aiAnalysis && (
                                  <div className="bg-white/10 rounded px-2 py-1 text-xs text-white">
                                    <span className="opacity-80">AI Insight: </span>
                                    <span className="italic text-blue-200">
                                      {totalTrades > 0 ? (winRate > 60 ? "Strong performance detected" : winRate > 50 ? "Balanced trading pattern" : "Risk management recommended") : "No data yet"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                    </div>
  );
}
