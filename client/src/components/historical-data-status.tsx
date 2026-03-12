import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Database, Calendar, TrendingUp, Activity, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackupStatus {
  success: boolean;
  totalRecords: number;
  recordsBySymbol: Record<string, number>;
  recordsByTimeframe: Record<string, number>;
  oldestRecord: number | null;
  newestRecord: number | null;
  storageSize: string;
  lastSyncOperation: {
    id: string;
    processedSymbols: number;
    startedAt: {
      _seconds: number;
      _nanoseconds: number;
    };
    operationType: string;
    totalSymbols: number;
    errors: string[];
    status: string;
  };
  destination: string;
}

export function HistoricalDataStatus() {
  const { data: backupStatus, isLoading, error } = useQuery<BackupStatus>({
    queryKey: ['/api/backup/status'],
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5" />
            Historical Data Collection
          </CardTitle>
          <CardDescription>Full Year Data Collection Progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5" />
            Historical Data Collection
          </CardTitle>
          <CardDescription>📊 NIFTY 50 Data Collection Status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-orange-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Connecting to data source...</span>
          </div>
          <div className="text-xs text-muted-foreground">
            🎯 Target: Full year historical data collection
            <br />☁️ Storage: Google Cloud Firestore
            <br />📈 NIFTY 50 stocks with 375 candles per date
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate collection progress
  const totalExpectedRecords = 50 * 365; // 50 stocks × 365 days = ~18,250 records for full year
  const currentProgress = backupStatus ? (backupStatus.totalRecords / totalExpectedRecords) * 100 : 0;
  const isActive = backupStatus?.lastSyncOperation?.status === 'running';
  
  // Calculate months completed (assuming ~20 trading days per month)
  const recordsPerMonth = 50 * 20; // 50 stocks × ~20 trading days
  const monthsCompleted = backupStatus ? Math.floor(backupStatus.totalRecords / recordsPerMonth) : 0;
  const totalMonths = 12;
  const monthProgress = (monthsCompleted / totalMonths) * 100;

  // Status indicator based on collection state
  const getStatusInfo = () => {
    if (!backupStatus?.totalRecords) {
      return { 
        status: "Initializing", 
        color: "text-blue-500 bg-blue-50", 
        icon: Clock,
        description: "Preparing to start data collection..."
      };
    } else if (isActive) {
      return { 
        status: "In Progress", 
        color: "text-green-500 bg-green-50", 
        icon: Activity,
        description: `Collecting Month ${monthsCompleted + 1}/12`
      };
    } else if (monthsCompleted >= 12) {
      return { 
        status: "Completed", 
        color: "text-emerald-500 bg-emerald-50", 
        icon: CheckCircle,
        description: "Full year collection completed!"
      };
    } else {
      return { 
        status: "Paused", 
        color: "text-orange-500 bg-orange-50", 
        icon: Clock,
        description: "Collection temporarily paused"
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5" />
            Historical Data Collection
          </CardTitle>
          <div className={cn("text-xs px-2 py-1 rounded-full flex items-center", statusInfo.color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.status}
          </div>
        </div>
        <CardDescription>📊 Full Year NIFTY 50 Data Collection Progress</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Progress</span>
            <span className="font-medium">{monthsCompleted}/12 months</span>
          </div>
          <Progress value={monthProgress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {statusInfo.description}
          </div>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Records Stored</span>
            </div>
            <div className="font-bold text-lg">
              {backupStatus?.totalRecords?.toLocaleString() || '0'}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Storage</span>
            </div>
            <div className="font-semibold text-sm">
              {backupStatus?.storageSize || '0.00 MB (Google Cloud)'}
            </div>
          </div>
        </div>

        {/* Current Operation */}
        {isActive && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-muted-foreground">
                Processing {backupStatus?.lastSyncOperation?.processedSymbols || 0}/50 stocks
              </span>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>🎯 Target: 375 candles/stock/date</span>
            <span>☁️ Google Cloud Firestore</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}