import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export function MonthlyProgressTracker() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Collection (Disabled)</CardTitle>
        <CardDescription>
          OHLC data collection has been disabled to reduce billing costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-900 dark:text-amber-100">Auto-fetch Disabled</span>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            The automatic OHLC data collection system has been disabled to reduce storage costs. Using AWS DynamoDB for data storage.
          </p>
          <div className="mt-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <p>✓ No more 42,000+ records being stored</p>
            <p>✓ Excessive storage billing stopped</p>
            <p>✓ Backend fetching disabled</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
