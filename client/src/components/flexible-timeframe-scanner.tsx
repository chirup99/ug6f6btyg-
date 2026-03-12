import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

interface FlexibleTimeframeResult {
  success: boolean;
  method: string;
  symbol: string;
  date: string;
  startTimeframe: number;
  maxTimeframe: number;
  progressions: Array<{
    timeframe: number;
    candleCount: number;
    shouldProgress: boolean;
    nextTimeframe: number;
    hybridAnalysis?: any;
  }>;
  summary: {
    description: string;
    timeframeProgression: string;
    totalProgressions: number;
    finalTimeframe: number;
  };
}

export function FlexibleTimeframeScanner() {
  const [symbol, setSymbol] = useState("NSE:NIFTY50-INDEX");
  const [date, setDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1); // Yesterday
    return date.toISOString().split("T")[0];
  });
  const [startTimeframe, setStartTimeframe] = useState(5);
  const [maxTimeframe, setMaxTimeframe] = useState(80);

  const analyzeFlexibleMutation = useMutation({
    mutationFn: async (params: {
      symbol: string;
      date: string;
      startTimeframe: number;
      maxTimeframe: number;
    }) => {
      return apiRequest("/api/battu-scan/flexible-timeframe/analyze", {
        method: "POST",
        body: JSON.stringify(params),
      }) as Promise<FlexibleTimeframeResult>;
    },
  });

  const hybridAnalysisMutation = useMutation({
    mutationFn: async (params: {
      symbol: string;
      date: string;
      timeframe: number;
      candleData: any[];
    }) => {
      return apiRequest("/api/battu-scan/flexible-timeframe/hybrid", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  });

  const statusCheckMutation = useMutation({
    mutationFn: async (params: {
      symbol: string;
      date: string;
      currentTimeframe: number;
    }) => {
      return apiRequest("/api/battu-scan/flexible-timeframe/status", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  });

  const handleAnalyze = () => {
    analyzeFlexibleMutation.mutate({
      symbol,
      date,
      startTimeframe,
      maxTimeframe,
    });
  };

  const handleStatusCheck = () => {
    statusCheckMutation.mutate({
      symbol,
      date,
      currentTimeframe: startTimeframe,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-indigo-700">
            🔄 Flexible Timeframe Doubler
          </CardTitle>
          <p className="text-sm text-gray-600">
            New simplified approach: automatically doubles timeframes (5min →
            10min → 20min → 40min) when 6 candles complete. Uses hybrid analysis
            to predict missing C2B candle when needed.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                  <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                  <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                  <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTimeframe">Start Timeframe (min)</Label>
              <Select
                value={startTimeframe.toString()}
                onValueChange={(value) => setStartTimeframe(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxTimeframe">Max Timeframe (min)</Label>
              <Select
                value={maxTimeframe.toString()}
                onValueChange={(value) => setMaxTimeframe(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="40">40 minutes</SelectItem>
                  <SelectItem value="80">80 minutes</SelectItem>
                  <SelectItem value="160">160 minutes</SelectItem>
                  <SelectItem value="320">320 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={analyzeFlexibleMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {analyzeFlexibleMutation.isPending
                ? "Analyzing..."
                : "🔄 Analyze Flexible Timeframes"}
            </Button>
            <Button
              onClick={handleStatusCheck}
              disabled={statusCheckMutation.isPending}
              variant="outline"
            >
              {statusCheckMutation.isPending
                ? "Checking..."
                : "📊 Check Status"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analyzeFlexibleMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">
              ✅ Flexible Timeframe Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">
                  {analyzeFlexibleMutation.data.symbol}
                </Badge>
                <Badge variant="outline" className="ml-2">
                  {analyzeFlexibleMutation.data.date}
                </Badge>
              </div>
              <div>
                <Badge className="bg-indigo-100 text-indigo-800">
                  {analyzeFlexibleMutation.data.startTimeframe}min →{" "}
                  {analyzeFlexibleMutation.data.maxTimeframe}min
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                📈 Timeframe Progression
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {analyzeFlexibleMutation.data.summary.description}
              </p>
              <Badge variant="secondary" className="text-sm">
                {analyzeFlexibleMutation.data.summary.timeframeProgression}
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                🔄 Progression Details (
                {analyzeFlexibleMutation.data.progressions.length} levels)
              </h4>
              <div className="space-y-2">
                {analyzeFlexibleMutation.data.progressions.map(
                  (progression, index) => (
                    <Card
                      key={index}
                      className="border-l-4 border-l-indigo-500"
                    >
                      <CardContent className="pt-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className="mb-1">
                              {progression.timeframe} min
                            </Badge>
                            <p className="text-sm text-gray-600">
                              {progression.candleCount} candles found
                            </p>
                          </div>
                          <div className="text-right">
                            {progression.shouldProgress ? (
                              <Badge className="bg-green-100 text-green-800">
                                Progress to {progression.nextTimeframe}min
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Stay at {progression.timeframe}min
                              </Badge>
                            )}
                          </div>
                        </div>
                        {progression.hybridAnalysis && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-xs text-blue-700">
                              Hybrid Analysis:{" "}
                              {progression.hybridAnalysis.analysisType ||
                                "Applied"}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            </div>

            <div className="bg-indigo-50 p-3 rounded">
              <h4 className="font-semibold text-indigo-800 mb-1">📋 Summary</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>
                  • Total Progressions:{" "}
                  {analyzeFlexibleMutation.data.summary.totalProgressions}
                </li>
                <li>
                  • Final Timeframe:{" "}
                  {analyzeFlexibleMutation.data.summary.finalTimeframe} minutes
                </li>
                <li>• Method: {analyzeFlexibleMutation.data.method}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Check Results */}
      {statusCheckMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">
              📊 Timeframe Status Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">
                  Current Timeframe
                </Label>
                <Badge className="ml-2">
                  {statusCheckMutation.data.currentTimeframe} min
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Candle Count</Label>
                <Badge variant="outline" className="ml-2">
                  {statusCheckMutation.data.candleCount}
                </Badge>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold text-blue-800 mb-2">
                🎯 Recommendations
              </h4>
              <p className="text-sm text-blue-700 mb-1">
                <strong>Action:</strong>{" "}
                {statusCheckMutation.data.recommendations?.action}
              </p>
              <p className="text-sm text-blue-700 mb-1">
                <strong>Message:</strong>{" "}
                {statusCheckMutation.data.recommendations?.message}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Next Step:</strong>{" "}
                {statusCheckMutation.data.recommendations?.nextStep}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(analyzeFlexibleMutation.error ||
        statusCheckMutation.error ||
        hybridAnalysisMutation.error) && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 text-sm">
              {analyzeFlexibleMutation.error?.message ||
                statusCheckMutation.error?.message ||
                hybridAnalysisMutation.error?.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
