import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, MoreVertical, Edit2, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface PersonalHeatmapProps {
  userId: string | null;
  onDateSelect: (date: Date, firebaseData: any) => void;
  selectedDate: Date | null;
  onDataUpdate?: (data: Record<string, any>) => void;
  onRangeChange?: (range: { from: Date; to: Date } | null) => void;
  highlightedDates?: {
    tag: string;
    dates: string[];
  } | null;
  isPublicView?: boolean;
  refreshTrigger?: number;
}

// Simple function to calculate P&L from trade data
function calculatePnL(data: any): number {
  if (!data) return 0;

  // ✅ CRITICAL FIX: Handle Firebase wrapped data structure
  // Firebase stores data as: { date, userId, tradingData: { performanceMetrics: { netPnL } } }
  // Try wrapped structure first (Firebase format)
  if (data.tradingData?.performanceMetrics?.netPnL !== undefined) {
    return data.tradingData.performanceMetrics.netPnL;
  }

  // Try direct performanceMetrics (unwrapped format)
  if (data.performanceMetrics?.netPnL !== undefined) {
    return data.performanceMetrics.netPnL;
  }

  // ✅ NEW: Check profitLossAmount (what recordAllPaperTrades saves)
  if (data.profitLossAmount !== undefined && typeof data.profitLossAmount === 'number') {
    return data.profitLossAmount;
  }

  // Try calculating from wrapped tradeHistory (Firebase format)
  if (data.tradingData?.tradeHistory && Array.isArray(data.tradingData.tradeHistory)) {
    let totalPnL = 0;
    data.tradingData.tradeHistory.forEach((trade: any) => {
      if (trade.pnl && trade.pnl !== '-' && typeof trade.pnl === 'string') {
        // Remove ₹ symbol and commas, parse as number
        const pnlValue = parseFloat(trade.pnl.replace(/[₹,+]/g, ''));
        if (!isNaN(pnlValue)) {
          totalPnL += pnlValue;
        }
      }
    });
    if (totalPnL !== 0) return totalPnL;
  }

  // Try calculating from direct tradeHistory (unwrapped format)
  if (data.tradeHistory && Array.isArray(data.tradeHistory)) {
    let totalPnL = 0;
    data.tradeHistory.forEach((trade: any) => {
      if (trade.pnl && trade.pnl !== '-' && typeof trade.pnl === 'string') {
        // Remove ₹ symbol and commas, parse as number
        const pnlValue = parseFloat(trade.pnl.replace(/[₹,+]/g, ''));
        if (!isNaN(pnlValue)) {
          totalPnL += pnlValue;
        }
      }
    });
    if (totalPnL !== 0) return totalPnL;
  }

  return 0;
}

// Get color based on P&L value - SIMPLE AND CLEAR
function getPnLColor(pnl: number): string {
  if (pnl === 0) return "bg-purple-500 dark:bg-purple-400"; // Added purple for 0 P&L

  const amount = Math.abs(pnl);

  if (pnl > 0) {
    // Profit - Green shades
    if (amount >= 5000) return "bg-green-800 dark:bg-green-700";
    if (amount >= 1500) return "bg-green-600 dark:bg-green-500";
    return "bg-green-300 dark:bg-green-300";
  } else {
    // Loss - Red shades
    if (amount >= 5000) return "bg-red-800 dark:bg-red-700";
    if (amount >= 1500) return "bg-red-600 dark:bg-red-500";
    return "bg-red-300 dark:bg-red-300";
  }
}

export function PersonalHeatmap({ userId, onDateSelect, selectedDate, onDataUpdate, onRangeChange, highlightedDates, isPublicView = false, refreshTrigger = 0 }: PersonalHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [heatmapData, setHeatmapData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRangeSelectMode, setIsRangeSelectMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isFeedMode, setIsFeedMode] = useState(false);
  const [selectedDateForDelete, setSelectedDateForDelete] = useState<string | null>(null);
  const [selectedDatesForEdit, setSelectedDatesForEdit] = useState<string[]>([]);
  const [selectedDatesForRange, setSelectedDatesForRange] = useState<string[]>([]);
  const [linePositions, setLinePositions] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [rangeLinePositions, setRangeLinePositions] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const badgeContainerRef = useRef<HTMLDivElement>(null);
  const badge1Ref = useRef<HTMLDivElement>(null);
  const badge2Ref = useRef<HTMLDivElement>(null);
  const rangeBadge1Ref = useRef<HTMLDivElement>(null);
  const rangeBadge2Ref = useRef<HTMLDivElement>(null);
  const [badgePositions, setBadgePositions] = useState<{ x1: number; x2: number; y: number; containerHeight: number } | null>(null);
  const [rangeBadgePositions, setRangeBadgePositions] = useState<{ x1: number; x2: number; y: number; containerHeight: number } | null>(null);
  const closeButtonRef = useRef<boolean>(false);
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh trigger
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState("Personal Trading Calendar");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved title from localStorage on mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('heatmapTitle');
    if (savedTitle) {
      setEditableTitle(savedTitle);
    }
  }, []);

  // FETCH ALL DATES FROM AWS DYNAMODB - SIMPLE AND DIRECT (Migrated Dec 3, 2025)
  useEffect(() => {
    if (!userId) {
      console.log("🔥 PersonalHeatmap: No userId provided, skipping fetch");
      setHeatmapData({});
      setIsLoading(false);
      return;
    }

    console.log("🔥 PersonalHeatmap: CLEARING old data and fetching FRESH AWS data for userId:", userId);
    setHeatmapData({});
    setIsLoading(true);

    fetch(`/api/user-journal/${userId}/all?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        console.log("✅ PersonalHeatmap: Raw AWS DynamoDB data received:", data);
        console.log("✅ PersonalHeatmap: Total dates:", Object.keys(data).length);

        // ✅ CRITICAL FIX: Normalize keys to YYYY-MM-DD format for filtering compatibility
        const normalizedData: Record<string, any> = {};
        Object.keys(data).forEach(key => {
          // Check if key is already in YYYY-MM-DD format
          if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
            normalizedData[key] = data[key];
          } else {
            // Try to extract date from various formats
            const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
              normalizedData[dateMatch[1]] = data[key];
            } else if (data[key].date && data[key].date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Use the date field from the data itself
              normalizedData[data[key].date] = data[key];
            } else {
              console.warn(`⚠️ PersonalHeatmap: Could not normalize key ${key}, skipping`);
            }
          }
        });

        console.log(`📦 PersonalHeatmap: Normalized ${Object.keys(data).length} keys to ${Object.keys(normalizedData).length} YYYY-MM-DD format keys`);

        // Store the normalized data
        setHeatmapData(normalizedData);
        setIsLoading(false);

        // Log each date for debugging
        Object.keys(normalizedData).forEach(dateKey => {
          const pnl = calculatePnL(normalizedData[dateKey]);
          console.log(`📊 PersonalHeatmap: ${dateKey} = ₹${pnl.toFixed(2)}`);
        });

        // Emit normalized data to parent component
        if (onDataUpdate) {
          console.log(`📤 PersonalHeatmap: Emitting ${Object.keys(normalizedData).length} normalized dates to parent`);
          onDataUpdate(normalizedData);
        }
      })
      .catch(error => {
        console.error("❌ PersonalHeatmap: Fetch error:", error);
        setIsLoading(false);
      });
  }, [userId, refreshKey, refreshTrigger]); // Add refreshKey and refreshTrigger to dependencies

  // Handle "Feed" menu item click
  const handleFeedClick = () => {
    setIsFeedMode(!isFeedMode);
    setIsEditMode(false);
    setIsRangeSelectMode(false);
    setIsDeleteMode(false);
  };

  // Filter heatmap data based on selected date range
  const getFilteredData = (): Record<string, any> => {
    if (!selectedRange) {
      return heatmapData; // No filtering if no range selected
    }

    const filtered: Record<string, any> = {};
    const startTime = selectedRange.from.getTime();
    const endTime = selectedRange.to.getTime();

    Object.keys(heatmapData).forEach(dateKey => {
      const [year, month, day] = dateKey.split('-').map(Number);
      const dateTime = new Date(year, month - 1, day).getTime();

      if (dateTime >= startTime && dateTime <= endTime) {
        filtered[dateKey] = heatmapData[dateKey];
      }
    });

    console.log(`🔍 Filtered ${Object.keys(heatmapData).length} dates to ${Object.keys(filtered).length} dates within range`);
    return filtered;
  };

  const filteredHeatmapData = getFilteredData();

  // HANDLE DATE CLICK - FETCH FRESH DATA FROM FIREBASE OR SELECT FOR EDIT/RANGE
  const handleDateClick = async (date: Date) => {
    if (!userId) return;

    // Format date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    // If in range select mode, select the date for range filtering
    if (isRangeSelectMode) {
      setSelectedDatesForRange(prev => {
        // If date already selected, remove it
        if (prev.includes(dateKey)) {
          return prev.filter(d => d !== dateKey);
        }
        // If less than 2 dates selected, add it
        if (prev.length < 2) {
          const newDates = [...prev, dateKey];

          // If we now have 2 dates, auto-apply the range filter
          if (newDates.length === 2) {
            const [date1, date2] = newDates.sort();
            const from = new Date(date1);
            const to = new Date(date2);
            setSelectedRange({ from, to });

            if (onRangeChange) {
              onRangeChange({ from, to });
            }

            console.log("📅 Range auto-selected:", { from: from.toDateString(), to: to.toDateString() });
          }

          return newDates;
        }
        // If 2 dates already selected, replace the second one
        const newDates = [prev[0], dateKey];
        const [date1, date2] = newDates.sort();
        const from = new Date(date1);
        const to = new Date(date2);
        setSelectedRange({ from, to });

        if (onRangeChange) {
          onRangeChange({ from, to });
        }

        return newDates;
      });
      return;
    }

    // If in edit mode, select the date for editing instead of loading
    if (isEditMode) {
      setSelectedDatesForEdit(prev => {
        // If date already selected, remove it
        if (prev.includes(dateKey)) {
          return prev.filter(d => d !== dateKey);
        }
        // If less than 2 dates selected, add it
        if (prev.length < 2) {
          return [...prev, dateKey];
        }
        // If 2 dates already selected, replace the second one
        return [prev[0], dateKey];
      });
      return;
    }

    // If in feed mode, update the current date to show its stats in the header
    if (isFeedMode) {
      setCurrentDate(date);
      console.log(`📱 FeedMode: Date selected: ${dateKey}, updating header stats...`);
      // Optional: you can also call onDateSelect if the parent needs to know
      // but for the header stats in this component, setCurrentDate is enough
      // because the header uses heatmapData[currentDate.toISOString().split('T')[0]]
    }

    console.log(`🔥 PersonalHeatmap: Date clicked: ${dateKey}, fetching FRESH data from Firebase...`);

    try {
      // FETCH FRESH DATA FROM FIREBASE FOR THIS SPECIFIC DATE
      const response = await fetch(`/api/user-journal/${userId}/${dateKey}`);
      const freshData = await response.json();

      console.log(`✅ PersonalHeatmap: Fresh Firebase data for ${dateKey}:`, freshData);

      // Update the selected date
      setCurrentDate(date);

      // Pass the FRESH FIREBASE DATA to parent component
      onDateSelect(date, freshData);

    } catch (error) {
      console.error(`❌ PersonalHeatmap: Error fetching data for ${dateKey}:`, error);
      // If fetch fails, pass empty data to parent
      onDateSelect(date, {});
    }
  };

  // Handle "Move date" menu item click
  const handleMoveDateClick = () => {
    setIsEditMode(true);
    setIsRangeSelectMode(false);
    setIsDeleteMode(false);
    setSelectedDatesForEdit([]);
    setSelectedDateForDelete(null);
  };

  // Handle "Delete" menu item click - enter delete mode
  const handleDeleteClick = () => {
    setIsDeleteMode(true);
    setIsEditMode(false);
    setIsRangeSelectMode(false);
    setSelectedDateForDelete(null);
  };

  // Handle cancel delete mode
  const handleCancelDelete = () => {
    setIsDeleteMode(false);
    setSelectedDateForDelete(null);
  };

  // Handle confirm delete - actually delete the selected date
  const handleConfirmDelete = async () => {
    if (!selectedDateForDelete) {
      toast({
        title: "No Date Selected",
        description: "Please select a date to delete",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    console.log(`🗑️ Deleting personal data for userId=${userId}, date=${selectedDateForDelete}`);

    try {
      // Show loading toast
      toast({
        title: "Deleting Data...",
        description: `Removing all data for ${selectedDateForDelete}`,
      });

      // Delete data from Firebase using DELETE endpoint
      const deleteResponse = await fetch(`/api/user-journal/${userId}/${selectedDateForDelete}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete data from Firebase');
      }

      console.log(`✅ Personal data deleted successfully for ${selectedDateForDelete}`);

      // Show success message
      toast({
        title: "Success!",
        description: `All data deleted for ${selectedDateForDelete}`,
      });

      // Force heatmap refresh by incrementing refreshKey
      console.log('🔄 Triggering heatmap refresh after deletion...');
      setRefreshKey(prev => prev + 1);

      // Exit delete mode
      setIsDeleteMode(false);
      setSelectedDateForDelete(null);

    } catch (error) {
      console.error('❌ Error deleting personal data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete data",
        variant: "destructive",
      });
    }
  };

  // Handle "Select range" menu item click
  const handleSelectRangeClick = () => {
    setIsRangeSelectMode(true);
    setIsEditMode(false);
    setIsDeleteMode(false);
    setSelectedDatesForRange([]);
    setSelectedDateForDelete(null);
    // Don't clear selectedRange - allow user to adjust existing range
  };

  // Handle cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedDatesForEdit([]);
  };

  // Handle cancel range select mode
  const handleCancelRangeSelect = () => {
    setIsRangeSelectMode(false);
    setSelectedDatesForRange([]);
    // selectedRange and filter persist after exiting mode
  };

  // Handle save selected dates - Relocate data from first date to second date
  const handleSaveEdit = async () => {
    if (selectedDatesForEdit.length !== 2) {
      toast({
        title: "Select Two Dates",
        description: "Please select exactly two dates on the heatmap",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    const [sourceDate, targetDate] = selectedDatesForEdit;

    console.log(`🔄 Relocating data: ${sourceDate} → ${targetDate}`);

    try {
      // Show loading toast
      toast({
        title: "Relocating Data...",
        description: `Moving data from ${sourceDate} to ${targetDate}`,
      });

      // Call relocate endpoint
      const response = await fetch('/api/relocate-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sourceDate,
          targetDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to relocate data');
      }

      const result = await response.json();
      console.log('✅ Data relocated successfully:', result);

      // Show success message
      toast({
        title: "Success!",
        description: `All data moved from ${sourceDate} to ${targetDate}`,
      });

      // Force heatmap refresh by incrementing refreshKey
      // This triggers the useEffect to re-fetch all data from Firebase
      console.log('🔄 Triggering heatmap refresh after relocation...');
      setRefreshKey(prev => prev + 1);

      // Exit edit mode
      setIsEditMode(false);
      setSelectedDatesForEdit([]);

    } catch (error) {
      console.error('❌ Error relocating data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to relocate data",
        variant: "destructive",
      });
    }
  };

  // Handle save range selection
  const handleSaveRangeSelect = () => {
    if (selectedDatesForRange.length !== 2) {
      toast({
        title: "Select Two Dates",
        description: "Please select exactly two dates on the heatmap to create a range",
        variant: "destructive",
      });
      return;
    }

    // Exit range select mode (filter is already applied)
    setIsRangeSelectMode(false);

    toast({
      title: "Range Applied",
      description: `Showing data from ${selectedRange?.from.toDateString()} to ${selectedRange?.to.toDateString()}`,
    });
  };

  // Calculate badge positions dynamically when badges render
  useEffect(() => {
    if (selectedDatesForEdit.length !== 2 || !badge1Ref.current || !badge2Ref.current) {
      console.log("🔧 PersonalHeatmap: Badge positions reset - conditions not met", {
        selectedCount: selectedDatesForEdit.length,
        badge1Exists: !!badge1Ref.current,
        badge2Exists: !!badge2Ref.current
      });
      setBadgePositions(null);
      return;
    }

    const calculatePositions = () => {
      if (!badge1Ref.current || !badge2Ref.current || !badgeContainerRef.current) {
        console.log("🔧 PersonalHeatmap: Badges or container not ready yet");
        return;
      }

      const badge1Rect = badge1Ref.current.getBoundingClientRect();
      const badge2Rect = badge2Ref.current.getBoundingClientRect();
      const containerRect = badgeContainerRef.current.getBoundingClientRect();

      const x1 = badge1Rect.left - containerRect.left + badge1Rect.width / 2;
      const x2 = badge2Rect.left - containerRect.left + badge2Rect.width / 2;
      const y = badge1Rect.top - containerRect.top + badge1Rect.height / 2;
      const containerHeight = containerRect.height;

      console.log("🎯 PersonalHeatmap: Calculated badge positions", { x1, x2, y, containerHeight });
      setBadgePositions({ x1, x2, y, containerHeight });
    };

    // Use multiple calculation attempts to ensure badges are rendered
    const timer1 = setTimeout(calculatePositions, 0);
    const timer2 = setTimeout(calculatePositions, 50);
    const timer3 = setTimeout(calculatePositions, 100);

    // Recalculate on scroll
    const scrollContainer = heatmapContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', calculatePositions);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', calculatePositions);
      }
    };
  }, [selectedDatesForEdit]);

  // Calculate range badge positions dynamically when badges render (for range selection mode)
  useEffect(() => {
    if (selectedDatesForRange.length !== 2 || !rangeBadge1Ref.current || !rangeBadge2Ref.current) {
      setRangeBadgePositions(null);
      return;
    }

    const calculatePositions = () => {
      if (!rangeBadge1Ref.current || !rangeBadge2Ref.current || !badgeContainerRef.current) {
        return;
      }

      const badge1Rect = rangeBadge1Ref.current.getBoundingClientRect();
      const badge2Rect = rangeBadge2Ref.current.getBoundingClientRect();
      const containerRect = badgeContainerRef.current.getBoundingClientRect();

      const x1 = badge1Rect.left - containerRect.left + badge1Rect.width / 2;
      const x2 = badge2Rect.left - containerRect.left + badge2Rect.width / 2;
      const y = badge1Rect.top - containerRect.top + badge1Rect.height / 2;
      const containerHeight = containerRect.height;

      console.log("🎯 PersonalHeatmap: Calculated range badge positions", { x1, x2, y, containerHeight });
      setRangeBadgePositions({ x1, x2, y, containerHeight });
    };

    // Use multiple calculation attempts to ensure badges are rendered
    const timer1 = setTimeout(calculatePositions, 0);
    const timer2 = setTimeout(calculatePositions, 50);
    const timer3 = setTimeout(calculatePositions, 100);

    // Recalculate on scroll
    const scrollContainer = heatmapContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', calculatePositions);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', calculatePositions);
      }
    };
  }, [selectedDatesForRange]);

  // Calculate line positions for heatmap calendar when 2 dates are selected
  useEffect(() => {
    if (selectedDatesForEdit.length !== 2 || !isEditMode || !heatmapContainerRef.current) {
      setLinePositions(null);
      return;
    }

    const calculateLinePositions = () => {
      const [date1Key, date2Key] = selectedDatesForEdit;

      // Find the DOM elements for both selected dates
      const cell1 = heatmapContainerRef.current?.querySelector(`[data-date="${date1Key}"]`) as HTMLElement;
      const cell2 = heatmapContainerRef.current?.querySelector(`[data-date="${date2Key}"]`) as HTMLElement;

      if (!cell1 || !cell2 || !heatmapContainerRef.current) {
        console.log("🔧 PersonalHeatmap: Calendar cells not found yet", { date1Key, date2Key });
        return;
      }

      const containerRect = heatmapContainerRef.current.getBoundingClientRect();
      const cell1Rect = cell1.getBoundingClientRect();
      const cell2Rect = cell2.getBoundingClientRect();

      // ✅ FIX: Add scroll position to make line stick to cells during scroll
      const scrollLeft = heatmapContainerRef.current.scrollLeft;
      const scrollTop = heatmapContainerRef.current.scrollTop;

      // Calculate center positions relative to container + scroll offset
      const x1 = cell1Rect.left - containerRect.left + cell1Rect.width / 2 + scrollLeft;
      const y1 = cell1Rect.top - containerRect.top + cell1Rect.height / 2 + scrollTop;
      const x2 = cell2Rect.left - containerRect.left + cell2Rect.width / 2 + scrollLeft;
      const y2 = cell2Rect.top - containerRect.top + cell2Rect.height / 2 + scrollTop;

      console.log("🎯 PersonalHeatmap: Calculated heatmap line positions", { x1, y1, x2, y2, scrollLeft, scrollTop });
      setLinePositions({ x1, y1, x2, y2 });
    };

    // Calculate positions after render
    const timer1 = setTimeout(calculateLinePositions, 0);
    const timer2 = setTimeout(calculateLinePositions, 50);
    const timer3 = setTimeout(calculateLinePositions, 150);

    // Recalculate on scroll
    const scrollContainer = heatmapContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', calculateLinePositions);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', calculateLinePositions);
      }
    };
  }, [selectedDatesForEdit, isEditMode]);

  // Calculate line positions for date range selector (pointing to month labels)
  useEffect(() => {
    if (!selectedRange || !heatmapContainerRef.current) {
      setRangeLinePositions(null);
      return;
    }

    const calculateRangeLinePositions = () => {
      const fromMonth = selectedRange.from.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const toMonth = selectedRange.to.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      // Find the DOM elements for both month labels
      const fromMonthEl = heatmapContainerRef.current?.querySelector(`[data-month="${fromMonth}"]`) as HTMLElement;
      const toMonthEl = heatmapContainerRef.current?.querySelector(`[data-month="${toMonth}"]`) as HTMLElement;

      if (!fromMonthEl || !toMonthEl || !heatmapContainerRef.current) {
        console.log("🔧 PersonalHeatmap: Month labels not found yet", { fromMonth, toMonth });
        return;
      }

      const containerRect = heatmapContainerRef.current.getBoundingClientRect();
      const fromRect = fromMonthEl.getBoundingClientRect();
      const toRect = toMonthEl.getBoundingClientRect();

      const scrollLeft = heatmapContainerRef.current.scrollLeft;
      const scrollTop = heatmapContainerRef.current.scrollTop;

      // Calculate center positions of month labels
      const x1 = fromRect.left - containerRect.left + fromRect.width / 2 + scrollLeft;
      const y1 = fromRect.top - containerRect.top + fromRect.height / 2 + scrollTop;
      const x2 = toRect.left - containerRect.left + toRect.width / 2 + scrollLeft;
      const y2 = toRect.top - containerRect.top + toRect.height / 2 + scrollTop;

      console.log("🎯 PersonalHeatmap: Range line positions (month labels)", { x1, y1, x2, y2, fromMonth, toMonth });
      setRangeLinePositions({ x1, y1, x2, y2 });
    };

    // Calculate positions after render
    const timer1 = setTimeout(calculateRangeLinePositions, 100);
    const timer2 = setTimeout(calculateRangeLinePositions, 250);
    const timer3 = setTimeout(calculateRangeLinePositions, 500);

    // Recalculate on scroll
    const scrollContainer = heatmapContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', calculateRangeLinePositions);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', calculateRangeLinePositions);
      }
    };
  }, [selectedRange]);

  // Generate calendar data for the year with perfect calendar design (empty cells at start)
  const generateMonthsData = () => {
    // Always use current year - show complete calendar regardless of range selection
    const startYear = currentDate.getFullYear();
    const endYear = currentDate.getFullYear();
    const startMonth = 0;
    const endMonth = 11;

    const months = [];

    // Generate all 12 months from the current year
    for (let year = startYear; year <= endYear; year++) {
      for (let monthIndex = startMonth; monthIndex <= endMonth; monthIndex++) {
        const monthName = new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' });
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

        // ✅ Create 7 columns (one for each day of week: S, M, T, W, TH, F, S)
        const dayColumns: (Date | null)[][] = [[], [], [], [], [], [], []];

        // ✅ Add empty cells for days before month starts (perfect calendar alignment)
        for (let i = 0; i < firstDayOfWeek; i++) {
          dayColumns[i].push(null);
        }

        // ✅ Add all dates for the month - each date goes to its day-of-week column
        for (let day = 1; day <= lastDay.getDate(); day++) {
          const date = new Date(year, monthIndex, day);
          const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
          dayColumns[dayOfWeek].push(date);
        }

        months.push({ name: monthName, year, dayRows: dayColumns });
      }
    }

    return months;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'TH', 'F', 'S'];

  const handlePreviousYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNextYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const months = generateMonthsData();

  const formatDisplayDate = () => {
    if (selectedRange) {
      // Show selected range in format: "Mon, Nov 3, 2025 - Sat, Nov 29, 2025"
      const fromDate = selectedRange.from.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const toDate = selectedRange.to.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return `${fromDate} - ${toDate}`;
    }

    // Show current date in format: "Friday, November 21, 2025"
    return currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleResetRange = () => {
    setSelectedRange(null);
    setSelectedDatesForRange([]);

    // Emit range reset to parent
    if (onRangeChange) {
      onRangeChange(null);
    }
  };

  const handleExitRangeSelectMode = () => {
    setIsRangeSelectMode(false);
    setSelectedDatesForRange([]);
  };

  // Count only dates with actual trading data (non-zero P&L)
  const countDatesWithData = (data: typeof heatmapData) => {
    return Object.keys(data).filter(dateKey => {
      const pnl = calculatePnL(data[dateKey]);
      return pnl !== 0;
    }).length;
  };

  if (!userId) {
    return (
      <div className="flex flex-col gap-2 p-6 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to view your personal trading heatmap
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-2 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-visible">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                localStorage.setItem('heatmapTitle', editableTitle);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  localStorage.setItem('heatmapTitle', editableTitle);
                }
              }}
              className="bg-transparent border-b border-gray-400 dark:border-gray-500 px-1 py-0.5 text-[10px] focus:outline-none text-gray-500 dark:text-gray-400"
              autoFocus
              data-testid="input-edit-title"
            />
          ) : (
            <>
              <span>{editableTitle} {selectedRange 
                ? `${selectedRange.from.getFullYear()}${selectedRange.from.getFullYear() !== selectedRange.to.getFullYear() ? `-${selectedRange.to.getFullYear()}` : ''}`
                : currentDate.getFullYear()
              }</span>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 hover:opacity-100 transition-opacity ml-1"
                data-testid="button-edit-title"
                title="Edit title"
              >
                <Edit2 className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            </>
          )}
        </div>
        <span className="text-[10px] text-gray-600 dark:text-gray-400">
          {isLoading ? "Loading..." : selectedRange 
            ? `${countDatesWithData(filteredHeatmapData)} of ${countDatesWithData(heatmapData)} dates`
            : `${countDatesWithData(heatmapData)} dates`
          }
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-visible">
        <div className="overflow-x-auto thin-scrollbar" ref={heatmapContainerRef} style={{ position: 'relative', zIndex: 10, paddingTop: '20px' }}>
          {/* SVG overlay for range selector line (pointing to month labels) */}
          {rangeLinePositions && selectedRange && !isEditMode && (() => {
            const { x1, y1, x2, y2 } = rangeLinePositions;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Create single smooth curve path
            const curveAmount = Math.min(distance * 0.3, 50);
            const angle = Math.atan2(dy, dx);
            const perpAngle = angle - Math.PI / 2;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const controlX = midX + Math.cos(perpAngle) * curveAmount;
            const controlY = midY + Math.sin(perpAngle) * curveAmount;
            const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY}, ${x2} ${y2}`;

            const scrollWidth = heatmapContainerRef.current?.scrollWidth || 0;
            const scrollHeight = heatmapContainerRef.current?.scrollHeight || 0;

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
                <defs>
                  <linearGradient id="rangeLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.7 }} />
                    <stop offset="100%" style={{ stopColor: 'rgb(147, 51, 234)', stopOpacity: 0.7 }} />
                  </linearGradient>
                </defs>
                <path
                  d={pathD}
                  stroke="url(#rangeLineGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(59, 130, 246, 0.4))' }}
                />
              </svg>
            );
          })()}

          {/* SVG overlay for connecting line between selected dates */}
          {linePositions && isEditMode && (() => {
            const { x1, y1, x2, y2 } = linePositions;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Create single smooth curve path
            let pathD;

            // Curve amplitude (how much the curve bends)
            const curveAmount = Math.min(distance * 0.3, 50); // Gentle curve

            // Calculate the angle of the line
            const angle = Math.atan2(dy, dx);

            // Perpendicular angle for curve offset (REVERSED - subtract instead of add)
            const perpAngle = angle - Math.PI / 2;

            // Midpoint of the line
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            // Control point offset perpendicular to the line (REVERSED DIRECTION)
            const controlX = midX + Math.cos(perpAngle) * curveAmount;
            const controlY = midY + Math.sin(perpAngle) * curveAmount;

            // Create smooth quadratic Bézier curve
            pathD = `M ${x1} ${y1} Q ${controlX} ${controlY}, ${x2} ${y2}`;

            // ✅ FIX: Get full scrollable content dimensions
            const scrollWidth = heatmapContainerRef.current?.scrollWidth || 0;
            const scrollHeight = heatmapContainerRef.current?.scrollHeight || 0;

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
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: 'rgb(147, 51, 234)', stopOpacity: 0.6 }} />
                    <stop offset="100%" style={{ stopColor: 'rgb(234, 88, 12)', stopOpacity: 0.6 }} />
                  </linearGradient>
                </defs>
                {/* Smooth zig-zag wavy path */}
                <path
                  d={pathD}
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
              </svg>
            );
          })()}

          <div className="flex gap-3 pb-2 select-none" style={{ minWidth: 'fit-content', position: 'relative', zIndex: 1 }}>
            {months.map((month, monthIndex) => (
              <div key={monthIndex} className="flex flex-col gap-0.5">
                <div 
                  className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 text-center select-none"
                  data-month={`${month.name} ${month.year}`}
                >
                  {month.name}
                </div>
                <div className="flex gap-1">
                  <div className="flex flex-col gap-0.5 select-none">
                    {dayLabels.map((label, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 flex items-center justify-center text-[8px] text-gray-500 dark:text-gray-500 select-none"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-fit select-none">
                    {month.dayRows.map((dayRow, dayIndex) => (
                      <div key={dayIndex} className="flex gap-0.5 select-none">
                        {dayRow.map((date, colIndex) => {
                          if (!date) return <div key={colIndex} className="w-3 h-3" />;

                          // Format date key YYYY-MM-DD
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateKey = `${year}-${month}-${day}`;

                          // Check if date is within selected range (if range is selected)
                          const isWithinRange = !selectedRange || (date >= selectedRange.from && date <= selectedRange.to);

                          // Get data from COMPLETE heatmapData (show all dates)
                          const data = heatmapData[dateKey];

                          // Calculate P&L from FIREBASE DATA ONLY
                          const netPnL = calculatePnL(data);

                          // Only show P&L colors if date is within range AND has data, otherwise show grey
                          let cellColor = (isWithinRange && data) ? getPnLColor(netPnL) : "bg-gray-200 dark:bg-gray-700";

                          // Override for selected date
                          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                          if (isSelected && !isEditMode && !isRangeSelectMode) {
                            cellColor = "bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-600";
                          }

                          // Check if date is selected for edit
                          const isSelectedForEdit = selectedDatesForEdit.includes(dateKey);
                          const editIndex = selectedDatesForEdit.indexOf(dateKey);

                          // Check if date is selected for deletion
                          const isSelectedForDelete = selectedDateForDelete === dateKey;

                          // Check if date is selected for range filtering
                          const isSelectedForRange = selectedDatesForRange.includes(dateKey);
                          const rangeIndex = selectedDatesForRange.indexOf(dateKey);

                          // Check if this date is highlighted by tag filter
                          const isHighlighted = highlightedDates?.dates.includes(dateKey);

                          return (
                            <div
                              key={colIndex}
                              className={`w-3 h-3 rounded-sm cursor-pointer transition-all relative ${cellColor} ${
                                isHighlighted ? 'ring-2 ring-yellow-400 dark:ring-yellow-300 animate-pulse shadow-lg shadow-yellow-400/50' : ''
                              }`}
                              onClick={() => handleDateClick(date)}
                              title={`${dateKey}: ₹${netPnL.toFixed(2)}${isHighlighted && highlightedDates ? ` • ${highlightedDates.tag.toUpperCase()} tag` : ''}`}
                              data-testid={`personal-heatmap-cell-${dateKey}`}
                              data-date={dateKey}
                            >
                              {isSelectedForEdit && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div 
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      editIndex === 0 
                                        ? 'bg-purple-600 dark:bg-purple-400' 
                                        : 'bg-orange-600 dark:bg-orange-400'
                                    }`}
                                    data-testid={`edit-marker-${dateKey}`}
                                  />
                                </div>
                              )}
                              {isSelectedForRange && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div 
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      rangeIndex === 0 
                                        ? 'bg-blue-500 dark:bg-blue-400' 
                                        : 'bg-green-500 dark:bg-green-400'
                                    }`}
                                    data-testid={`range-marker-${dateKey}`}
                                  />
                                </div>
                              )}
                              {isSelectedForDelete && (
                                <div className="absolute inset-0 flex items-center justify-center ring-2 ring-red-600 dark:ring-red-400 rounded-sm">
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"
                                    data-testid={`delete-marker-${dateKey}`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* P&L Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Loss</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 bg-red-800 dark:bg-red-700 rounded-full" title="High Loss (₹5000+)"></div>
            <div className="w-2.5 h-2.5 bg-red-600 dark:bg-red-500 rounded-full" title="Medium Loss (₹1500+)"></div>
            <div className="w-2.5 h-2.5 bg-red-300 dark:bg-red-300 rounded-full" title="Small Loss"></div>
          </div>
        </div>
        

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 bg-green-300 dark:bg-green-300 rounded-full" title="Small Profit"></div>
            <div className="w-2.5 h-2.5 bg-green-600 dark:bg-green-500 rounded-full" title="Medium Profit (₹1500+)"></div>
            <div className="w-2.5 h-2.5 bg-green-800 dark:bg-green-700 rounded-full" title="High Profit (₹5000+)"></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Profit</span>
        </div>
      </div>

      {/* Year Navigation / Edit Mode / Delete Mode Control */}
      <div className="relative pt-2 border-t border-gray-200 dark:border-gray-700">
        {isDeleteMode ? (
          // Delete Mode: Show single date selection interface
          <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-md">
            <div className="flex-1 min-w-0 flex justify-center">
              {!selectedDateForDelete ? (
                <p className="text-[10px] font-medium text-red-900 dark:text-red-100">
                  Select date to delete
                </p>
              ) : (
                <div className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span className="truncate">{selectedDateForDelete}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelDelete}
                className="h-6 px-2 text-[10px]"
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={!selectedDateForDelete}
                className="h-6 px-2 text-[10px]"
                data-testid="button-confirm-delete"
              >
                Delete
              </Button>
            </div>
          </div>
        ) : isEditMode ? (
          // Edit Mode: Show two-date selection interface (compact)
          <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md">
            <div className="flex-1 min-w-0 flex justify-center">
              {selectedDatesForEdit.length === 0 ? (
                <p className="text-[10px] font-medium text-purple-900 dark:text-purple-100">
                  Select 2 dates
                </p>
              ) : (
                <div ref={badgeContainerRef} className="flex gap-1 relative">
                  {selectedDatesForEdit.length === 2 && badgePositions && (
                    <svg
                      className="absolute pointer-events-none overflow-visible"
                      style={{ 
                        left: 0,
                        top: '-8px',
                        width: '100%', 
                        height: `calc(${badgePositions.containerHeight}px + 20px)`,
                        zIndex: 0 
                      }}
                    >
                      <defs>
                        <linearGradient id="personal-badge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="rgb(234, 88, 12)" stopOpacity="0.6" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const { x1, x2, y, containerHeight } = badgePositions;
                        const dx = x2 - x1;
                        const distance = Math.abs(dx);
                        const curveAmount = Math.min(distance * 0.3, 20);
                        const midX = (x1 + x2) / 2;
                        const controlY = y - curveAmount;
                        const pathD = `M ${x1} ${y} Q ${midX} ${controlY}, ${x2} ${y}`;

                        return (
                          <path
                            d={pathD}
                            stroke="url(#personal-badge-gradient)"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                          />
                        );
                      })()}
                    </svg>
                  )}
                  {selectedDatesForEdit.map((dateKey, index) => (
                    <div
                      key={dateKey}
                      ref={index === 0 ? badge1Ref : badge2Ref}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium relative z-10"
                      style={{
                        backgroundColor: index === 0 
                          ? 'rgb(147 51 234 / 0.1)' 
                          : 'rgb(234 88 12 / 0.1)',
                        color: index === 0 
                          ? 'rgb(147 51 234)' 
                          : 'rgb(234 88 12)'
                      }}
                    >
                      <div 
                        className={`w-1.5 h-1.5 rounded-full ${
                          index === 0 
                            ? 'bg-purple-600' 
                            : 'bg-orange-600'
                        }`}
                      />
                      <span className="truncate">{dateKey}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-6 px-2 text-[10px]"
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveEdit}
                disabled={selectedDatesForEdit.length !== 2}
                className="h-6 px-2 text-[10px]"
                data-testid="button-save-edit"
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          // Normal Mode: Show calendar navigation
          <div className="flex items-center justify-center gap-0 w-full">
            {/* Left arrow - always show in normal mode */}
            {!isRangeSelectMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousYear}
                className="h-8 w-8 flex-shrink-0"
                data-testid="button-prev-year"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            {/* Single button - shows "Select range", selected dates, or in range select mode */}
            {isRangeSelectMode ? (
              // Range selection mode - show dates with X icon
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 flex-shrink flex items-center gap-1"
                data-testid="button-select-date-range-mode"
              >
                <span className="text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {selectedDatesForRange.length === 0 ? (
                    "Select range"
                  ) : selectedDatesForRange.length > 0 ? (
                    (() => {
                      const [date1, date2] = selectedDatesForRange.sort();
                      const from = new Date(date1);
                      const to = new Date(date2);
                      const fromDate = from.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      const toDate = to.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      return `${fromDate} - ${toDate}`;
                    })()
                  ) : "Select range"}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeButtonRef.current = true;
                    // Close range selection mode AND clear selected range
                    setIsRangeSelectMode(false);
                    setSelectedDatesForRange([]);
                    setSelectedRange(null);
                    if (onRangeChange) {
                      onRangeChange(null);
                    }
                  }}
                  className="flex items-center justify-center w-4 h-4 hover:opacity-70"
                  data-testid="button-close-range-select"
                >
                  <X className="w-4 h-4" />
                </button>
              </Button>
            ) : (
              // Normal mode - show formatted current date
              <div className={`flex items-center ${isFeedMode ? 'w-full' : 'gap-1'}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectRangeClick}
                  className="h-8 px-2 hover-elevate flex-shrink"
                  data-testid="button-select-date-range"
                >
                  <span className="text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {currentDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: isFeedMode ? undefined : 'numeric'
                    })}
                  </span>
                </Button>

                {isFeedMode && (
                  <div className="flex items-center gap-6 ml-auto pr-2">
                    {(() => {
                      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                      const dayData = heatmapData[dateKey];
                      const pnlValue = calculatePnL(dayData);
                      const totalTrades = dayData?.tradeHistory?.length || dayData?.tradingData?.tradeHistory?.length || 0;
                      
                      // Calculate P&L percentage if possible
                      let pnlPercentage = null;
                      if (dayData?.tradingData?.performanceMetrics?.pnlPercentage !== undefined) {
                        pnlPercentage = dayData.tradingData.performanceMetrics.pnlPercentage;
                      } else if (dayData?.performanceMetrics?.pnlPercentage !== undefined) {
                        pnlPercentage = dayData.performanceMetrics.pnlPercentage;
                      }

                      // Generate P&L data for line chart
                      const trades = dayData?.tradeHistory || dayData?.tradingData?.tradeHistory || [];
                      const pnlData = trades.map((t: any) => {
                        if (typeof t.pnl === 'number') return t.pnl;
                        if (typeof t.pnl === 'string') return parseFloat(t.pnl.replace(/[₹,+]/g, '')) || 0;
                        return 0;
                      });

                      return (
                        <>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase text-gray-500 font-medium leading-none mb-1">P&L</span>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-xs font-bold leading-none ${pnlValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Math.floor(pnlValue).toLocaleString()}
                              </span>
                              {pnlPercentage !== null && (
                                <span className={`text-[10px] font-medium leading-none ${pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase text-gray-500 font-medium leading-none mb-1">Trend</span>
                            <div className="h-4 w-12 flex items-center justify-center">
                              {pnlData.length > 0 ? (
                                <svg width="48" height="16" className="overflow-visible">
                                  {(() => {
                                    const min = Math.min(...pnlData, 0);
                                    const max = Math.max(...pnlData, 0);
                                    const range = max - min || 1;
                                    const points = pnlData.map((val: number, i: number) => {
                                      const x = (i / (pnlData.length - 1 || 1)) * 48;
                                      const y = 16 - ((val - min) / range) * 16;
                                      return `${x},${y}`;
                                    }).join(' ');
                                    return (
                                      <polyline
                                        points={points}
                                        fill="none"
                                        stroke={pnlValue >= 0 ? "#16a34a" : "#dc2626"}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    );
                                  })()}
                                </svg>
                              ) : (
                                <div className="h-[1px] w-full bg-gray-200" />
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase text-gray-500 font-medium leading-none mb-1">TOTAL TRADES</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-none">
                              {totalTrades}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase text-gray-500 font-medium leading-none mb-1">WIN%</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-none">
                              {dayData?.performanceMetrics?.winRate || dayData?.tradingData?.performanceMetrics?.winRate || '0'}%
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Right arrow - always show in normal mode, but hide in feed mode */}
            {!isRangeSelectMode && !isFeedMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextYear}
                className="h-8 w-8 flex-shrink-0"
                data-testid="button-next-year"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {/* Social Feed Icon - beside 3-dot menu */}
            {!isRangeSelectMode && (
              <Button
                variant={isFeedMode ? "secondary" : "ghost"}
                size="icon"
                onClick={handleFeedClick}
                className={`h-8 w-8 ml-1 ${isFeedMode ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''}`}
                data-testid="button-social-feed"
              >
                <Layout className="w-4 h-4" />
              </Button>
            )}

            {/* 3-dot menu - only show when not in range select mode and not in public view and not in feed mode */}
            {!isRangeSelectMode && !isPublicView && !isFeedMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    data-testid="button-calendar-menu"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={handleMoveDateClick} data-testid="menu-item-move-date">
                    Move date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteClick} data-testid="menu-item-delete">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
        {/* Hidden refs for range badge calculations */}
        <div ref={rangeBadge1Ref} className="hidden" />
        <div ref={rangeBadge2Ref} className="hidden" />
      </div>

      <style>{`
        .thin-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dark .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}
