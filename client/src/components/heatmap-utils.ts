export const formatDateKey = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Calculate net P&L from trade history when summary fields are missing
export const calculateNetPnLFromTrades = (tradeHistory: any[]): number => {
  if (!tradeHistory || !Array.isArray(tradeHistory) || tradeHistory.length === 0) {
    return 0;
  }

  let totalPnL = 0;
  
  for (const trade of tradeHistory) {
    if (trade.pnl && typeof trade.pnl === 'string' && trade.pnl !== '-') {
      // Remove currency symbol (₹) and commas, then parse
      const pnlStr = trade.pnl.replace(/[₹,]/g, '').trim();
      const pnlValue = parseFloat(pnlStr);
      
      if (!isNaN(pnlValue)) {
        totalPnL += pnlValue;
      }
    }
  }
  
  return totalPnL;
};

// Get net P&L from data - try multiple sources
export const getNetPnL = (data: any): number => {
  // First try direct netPnL field
  if (typeof data?.netPnL === 'number') {
    return data.netPnL;
  }
  
  // Try totalProfit - totalLoss
  if (typeof data?.totalProfit === 'number' || typeof data?.totalLoss === 'number') {
    return (data?.totalProfit || 0) - Math.abs(data?.totalLoss || 0);
  }
  
  // Calculate from trade history
  if (data?.tradeHistory && Array.isArray(data.tradeHistory)) {
    return calculateNetPnLFromTrades(data.tradeHistory);
  }
  
  return 0;
};

export const getHeatmapColor = (netPnL: number) => {
  if (netPnL === 0) return "bg-gray-100 dark:bg-gray-700";

  const absValue = Math.abs(netPnL);

  if (netPnL > 0) {
    if (absValue >= 5000) return "bg-green-800 dark:bg-green-700";
    if (absValue >= 3000) return "bg-green-700 dark:bg-green-600";
    if (absValue >= 1500) return "bg-green-600 dark:bg-green-500";
    if (absValue >= 500) return "bg-green-500 dark:bg-green-400";
    return "bg-green-300 dark:bg-green-300";
  } else {
    if (absValue >= 5000) return "bg-red-800 dark:bg-red-700";
    if (absValue >= 3000) return "bg-red-700 dark:bg-red-600";
    if (absValue >= 1500) return "bg-red-600 dark:bg-red-500";
    if (absValue >= 500) return "bg-red-500 dark:bg-red-400";
    return "bg-red-300 dark:bg-red-300";
  }
};

export const generateYearHeatmapDays = (year: number, startMonth = 0) => {
  const months = [];
  const endMonth = 12;

  for (let monthIndex = startMonth; monthIndex < endMonth; monthIndex++) {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    const monthWeeks = [];
    let currentWeek = [];
    
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, monthIndex, day));
      
      if (currentWeek.length === 7) {
        monthWeeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      monthWeeks.push(currentWeek);
    }
    
    months.push({
      month: monthIndex,
      weeks: monthWeeks,
      name: firstDay.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  
  return months;
};

export const getHeatmapMonthLabels = (year: number) => {
  const months = [];
  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 1);
    months.push({
      name: date.toLocaleDateString("en-US", { month: "short" }),
      year: year,
    });
  }
  return months;
};
