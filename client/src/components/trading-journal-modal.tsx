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
      <DialogContent className="max-w-xs w-[88vw] p-3 rounded-xl gap-0">
        {/* Header */}
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
              <Info className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold leading-tight">Trading Journal</DialogTitle>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Track Your Trading Progress</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          {/* Daily Trade Tracking + AI Performance side by side */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col gap-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <Calendar className="h-4 w-4 text-blue-500" />
              <p className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 leading-tight">Daily Trade Tracking</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">Record &amp; monitor all trades</p>
            </div>
            <div className="flex flex-col gap-1 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <p className="text-[10px] font-semibold text-green-800 dark:text-green-300 leading-tight">AI Performance Analysis</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">P&amp;L &amp; trade statistics</p>
            </div>
          </div>

          {/* Improve Your Trading */}
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
            <TrendingUp className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 leading-tight">Improve Your Trading</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">Learn from mistakes &amp; patterns</p>
            </div>
          </div>

          {/* SEBI loss data */}
          <div
            className="p-2 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100/50 dark:border-red-900/20 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors"
            onClick={() => window.open('https://www.sebi.gov.in/reports-and-statistics/research/jan-2023/study-analysis-of-profit-and-loss-of-individual-traders-dealing-in-equity-fando-segment_67525.html', '_blank')}
            data-testid="button-sebi-report"
          >
            <p className="text-[9px] leading-tight text-red-700/80 dark:text-red-400/80 font-medium flex items-center gap-1">
              <FileText className="h-3 w-3 shrink-0" />
              Aggregate Losses Exceed ₹1.8 Lakh Crores Over 3 Years
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[8px] text-gray-500 dark:text-gray-400 uppercase tracking-tight">Top Loss States:</span>
              <div className="flex items-center gap-2">
                {[{ name: "Telangana", w: "w-6" }, { name: "AP", w: "w-4" }, { name: "TN", w: "w-3" }].map((s) => (
                  <div key={s.name} className="flex items-center gap-0.5">
                    <div className={`h-1 ${s.w} bg-red-500 rounded-full`} />
                    <span className="text-[7px] text-gray-500 dark:text-gray-400">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEBI stats */}
          <div className="flex items-start gap-1.5 p-2 bg-red-50 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20 rounded-lg">
            <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[8.5px] leading-snug text-gray-700 dark:text-gray-300">
              93% of 1Cr+ F&amp;O traders lost avg ₹2L each (FY22–FY24). Only 1% earned &gt;₹1L profit.
            </p>
          </div>
        </div>

        <Button
          onClick={handleDismiss}
          className="w-full h-8 mt-2 text-xs"
          data-testid="button-close-journal-modal"
        >
          Got It
        </Button>
      </DialogContent>
    </Dialog>
  );
}
