import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  AlertTriangle, Target, Shield, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity,
  Eye, Users, Briefcase, LineChart
} from 'lucide-react';

// Professional Portfolio Dashboard - Transform from "learning platform" to "trading intelligence platform"
// Types for portfolio data
interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
  sector: string;
}

interface PortfolioData {
  name: string;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  initialCapital: number;
  riskLevel: string;
  holdings: Holding[];
}

export function PortfolioDashboard() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<'growth'>('growth');
  const [timeframe, setTimeframe] = useState('1D');

  // Mock data - In production, fetch from your new portfolio tables
  const portfolioData: Record<string, PortfolioData> = {
    growth: {
      name: "Growth Portfolio",
      totalValue: 2847650,
      totalPnL: 347650,
      totalPnLPercent: 13.92,
      dayPnL: 12450,
      dayPnLPercent: 0.44,
      initialCapital: 2500000,
      riskLevel: "Moderate",
      holdings: [
        { symbol: "RELIANCE", name: "Reliance Industries", quantity: 500, avgPrice: 2780, currentPrice: 2845, pnl: 32500, pnlPercent: 2.34, weight: 35.2, sector: "Energy" },
        { symbol: "TCS", name: "Tata Consultancy Services", quantity: 300, avgPrice: 3650, currentPrice: 3720, pnl: 21000, pnlPercent: 1.92, weight: 28.8, sector: "Technology" },
        { symbol: "HDFCBANK", name: "HDFC Bank", quantity: 200, avgPrice: 1720, currentPrice: 1785, pnl: 13000, pnlPercent: 3.78, weight: 18.4, sector: "Banking" },
        { symbol: "INFY", name: "Infosys", quantity: 400, avgPrice: 1850, currentPrice: 1892, pnl: 16800, pnlPercent: 2.27, weight: 17.6, sector: "Technology" }
      ]
    }
  };

  const riskMetrics = {
    valueAtRisk: 85430, // VaR 1-day 95%
    portfolioBeta: 1.12,
    sharpeRatio: 1.87,
    maxDrawdown: 8.4,
    volatility: 18.6,
    correlation: 0.85 // vs NIFTY 50
  };

  const sectorAllocation = [
    { sector: "Technology", allocation: 46.4, color: "#3B82F6" },
    { sector: "Energy", allocation: 35.2, color: "#10B981" },
    { sector: "Banking", allocation: 18.4, color: "#F59E0B" }
  ];

  const portfolio = portfolioData[selectedPortfolio];
  const isPositive = portfolio.totalPnL >= 0;
  const isDayPositive = portfolio.dayPnL >= 0;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header - Professional Branding */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-blue-600" />
            Portfolio Intelligence
          </h1>
          <p className="text-slate-600 mt-1">Professional trading analytics & risk management</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Activity className="h-4 w-4 mr-1" />
            Live Market Data
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Shield className="h-4 w-4 mr-1" />
            Risk Managed
          </Badge>
        </div>
      </div>

      {/* Portfolio Overview - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Portfolio Value */}
        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Portfolio Value
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              ₹{(portfolio.totalValue / 100000).toFixed(2)}L
            </div>
            <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              ₹{Math.abs(portfolio.totalPnL / 1000).toFixed(0)}K ({Math.abs(portfolio.totalPnLPercent).toFixed(2)}%)
            </div>
          </CardContent>
        </Card>

        {/* Day P&L */}
        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Day P&L
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isDayPositive ? '+' : ''}₹{(portfolio.dayPnL / 1000).toFixed(1)}K
            </div>
            <div className={`flex items-center mt-2 text-sm ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isDayPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              {Math.abs(portfolio.dayPnLPercent).toFixed(2)}% today
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Value at Risk
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              ₹{(riskMetrics.valueAtRisk / 1000).toFixed(0)}K
            </div>
            <div className="flex items-center mt-2 text-sm text-slate-600">
              <Shield className="h-4 w-4 mr-1" />
              95% confidence (1-day)
            </div>
          </CardContent>
        </Card>

        {/* Sharpe Ratio */}
        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Sharpe Ratio
              <Target className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {riskMetrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              Excellent risk-adjusted returns
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings & Risk Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Portfolio Holdings */}
        <Card className="lg:col-span-2 bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-600" />
                Portfolio Holdings
              </span>
              <Badge variant="secondary">
                {portfolio.holdings.length} positions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.holdings.map((holding: Holding, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-slate-800">{holding.symbol}</div>
                      <Badge variant="outline" className="text-xs">{holding.sector}</Badge>
                      <div className="text-sm text-slate-600">{holding.weight}%</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {holding.quantity} shares @ ₹{holding.avgPrice}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">₹{holding.currentPrice}</div>
                    <div className={`text-sm ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.pnl >= 0 ? '+' : ''}₹{(holding.pnl / 1000).toFixed(1)}K ({holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Analytics & Sector Allocation */}
        <div className="space-y-6">
          {/* Professional Risk Metrics */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Risk Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Portfolio Beta</span>
                  <span className="font-semibold">{riskMetrics.portfolioBeta}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Volatility (Annual)</span>
                  <span className="font-semibold">{riskMetrics.volatility}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Max Drawdown</span>
                  <span className="font-semibold text-orange-600">{riskMetrics.maxDrawdown}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">NIFTY Correlation</span>
                  <span className="font-semibold">{riskMetrics.correlation}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sector Allocation */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Sector Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectorAllocation.map((sector, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{sector.sector}</span>
                    <span className="text-sm font-semibold">{sector.allocation}%</span>
                  </div>
                  <Progress value={sector.allocation} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Professional Footer */}
      <div className="bg-white rounded-lg p-4 shadow-lg border-0 text-center">
        <div className="text-sm text-slate-600">
          <span className="font-semibold">PERALA AI Trading Intelligence</span> • 
          Professional Portfolio Management • Real-time Risk Analytics • 
          Powered by Advanced AI
        </div>
      </div>
    </div>
  );
}