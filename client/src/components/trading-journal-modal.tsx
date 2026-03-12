import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Calendar, BarChart3, TrendingUp, TrendingDown, AlertCircle, FileText } from "lucide-react";
import { useEffect, useState } from "react";

interface TradingJournalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAutoPopup?: boolean;
}

export function TradingJournalModal({ open, onOpenChange, isAutoPopup = false }: TradingJournalModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (!isAutoPopup) {
        setInternalOpen(true);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastDismissed = localStorage.getItem('journal_disclaimer_dismissed_date');
      
      if (lastDismissed !== today) {
        setInternalOpen(true);
      } else {
        // Auto popup already dismissed today, close the parent state
        onOpenChange(false);
      }
    } else {
      setInternalOpen(false);
    }
  }, [open, isAutoPopup, onOpenChange]);

  const handleDismiss = () => {
    if (isAutoPopup) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('journal_disclaimer_dismissed_date', today);
    }
    setInternalOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={internalOpen} onOpenChange={(val) => {
      if (!val) handleDismiss();
      else onOpenChange(val);
    }}>
      <DialogContent className="max-w-sm w-[90vw] pl-[5px] pr-[5px] pt-[12px] pb-[12px] rounded-lg">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Info className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-center">Trading Journal</DialogTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Track Your Trading Progress
          </p>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Daily Trade Tracking</p>
              <p className="text-xs text-gray-500">Record and monitor all your trades</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">AI Performance Analysis</p>
              <p className="text-xs text-gray-500">View detailed P&L and trading statistics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">Improve Your Trading</p>
              <p className="text-xs text-gray-500">Learn from your trading mistakes and patterns</p>
            </div>
          </div>
          <div 
            className="mt-1 p-2 bg-red-50/30 dark:bg-red-900/5 rounded-md border border-red-100/30 dark:border-red-900/10 cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
            onClick={() => window.open('https://www.sebi.gov.in/reports-and-statistics/research/jan-2023/study-analysis-of-profit-and-loss-of-individual-traders-dealing-in-equity-fando-segment_67525.html', '_blank')}
            data-testid="button-sebi-report"
          >
            <p className="text-[10px] leading-tight text-red-700/80 dark:text-red-400/80 font-medium text-center flex items-center justify-center gap-1">
              Aggregate Losses Exceed ₹1.8 Lakh Crores Over Three Years 
              <div className="inline-flex items-center gap-1 ml-0.5 bg-white/20 rounded px-1 py-0.5">
                <TrendingDown className="h-3 w-3"/>
                <BarChart3 className="h-3 w-3"/>
              </div>
              <FileText className="h-3 w-3 text-red-600 dark:text-red-400 ml-0.5"/>
            </p>
            <div className="mt-0.5 text-center"><p className="text-[8px] text-gray-600 dark:text-gray-400 font-medium uppercase tracking-tighter">Top 3 Loss Traders States:</p></div>
            <div className="mt-0.5 flex items-center justify-center gap-2 py-1 px-2 bg-slate-50/70 dark:bg-slate-800/40 rounded-md border border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-600 dark:text-gray-200 uppercase tracking-tighter">Telangana</span>
                <div className="h-1 w-6 bg-red-600 dark:bg-red-500 rounded-full mt-0.5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-600 dark:text-gray-200 uppercase tracking-tighter">AP</span>
                <div className="h-1 w-4 bg-red-500 dark:bg-red-500 rounded-full mt-0.5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-600 dark:text-gray-200 uppercase tracking-tighter">Tamil Nadu</span>
                <div className="h-1 w-3 bg-red-400 dark:bg-red-500 rounded-full mt-0.5" />
              </div>
            </div>
          </div>
          <div className="mt-1.5 p-2 bg-red-50 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20 rounded-lg space-y-1">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[9px] leading-snug text-gray-700 dark:text-gray-300">
                  93% of over 1 crore individual F&O traders incurred average losses of around ₹2 lakh per trader (inclusive of transaction costs) during the three years from FY22 to FY24.
                </p>
                <p className="text-[9px] leading-snug text-gray-700 dark:text-gray-300">
                  Only 1% of individual traders managed to earn profits exceeding ₹1 lakh, after adjusting for transaction costs.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleDismiss}
          className="w-full"
          data-testid="button-close-journal-modal"
        >
          Got It
        </Button>
      </DialogContent>
    </Dialog>
  );
}
