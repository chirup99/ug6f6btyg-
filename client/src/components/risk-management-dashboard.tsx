import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  FileText,
  CheckCircle,
  XCircle,
  Users,
  Globe,
  Lock,
  Eye,
  BarChart3,
  DollarSign,
  Percent,
  Target,
  Clock,
  Settings,
  AlertCircle
} from 'lucide-react';

// Professional Risk Management Dashboard for Investment Grade Platform
// Shows regulatory compliance, risk metrics, and enterprise features
export function RiskManagementDashboard() {
  const [alertCount, setAlertCount] = useState(3);
  const [complianceScore, setComplianceScore] = useState(94);

  // Mock enterprise-grade risk data for investor demo
  const riskMetrics = {
    totalExposure: 15750000,
    dailyVaR: 125000,
    portfolioVolatility: 12.4,
    sharpeRatio: 1.87,
    maxDrawdown: 8.2,
    marginUtilization: 67,
    concentrationRisk: 15.3,
    liquidityRisk: 8.7
  };

  const complianceItems = [
    { name: "SEBI Registration", status: "Compliant", color: "green" },
    { name: "KYC/AML Verification", status: "Compliant", color: "green" },
    { name: "Risk Disclosure", status: "Compliant", color: "green" },
    { name: "Data Protection", status: "Under Review", color: "yellow" },
    { name: "Audit Trail", status: "Compliant", color: "green" }
  ];

  const alerts = [
    {
      id: 1,
      type: "High Risk",
      message: "Portfolio concentration exceeds 15% in technology sector",
      timestamp: "2 minutes ago",
      severity: "high"
    },
    {
      id: 2,
      type: "Regulatory",
      message: "Position size approaching regulatory limit for retail client",
      timestamp: "15 minutes ago", 
      severity: "medium"
    },
    {
      id: 3,
      type: "Market Risk",
      message: "VaR breach detected in derivatives portfolio",
      timestamp: "1 hour ago",
      severity: "high"
    }
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Enterprise Risk Management
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time risk monitoring and regulatory compliance dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Shield className="h-4 w-4 mr-1" />
            SEBI Compliant
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Enterprise Grade
          </Badge>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Daily VaR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{(riskMetrics.dailyVaR / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-gray-500 mt-1">95% confidence</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Portfolio Beta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {riskMetrics.sharpeRatio}
            </div>
            <p className="text-xs text-gray-500 mt-1">vs NIFTY 50</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {riskMetrics.maxDrawdown}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceScore}%
            </div>
            <Progress value={complianceScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Risk Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="alerts">Risk Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Risk Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Exposure Chart */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Risk Exposure by Asset Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Equity</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Derivatives</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Debt</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Risk Limits */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Risk Limits & Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Single Stock Limit</span>
                    <Badge variant="outline" className="text-green-600">Within Limit</Badge>
                  </div>
                  <Progress value={78} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sector Concentration</span>
                    <Badge variant="outline" className="text-yellow-600">Near Limit</Badge>
                  </div>
                  <Progress value={92} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Leverage Ratio</span>
                    <Badge variant="outline" className="text-green-600">Safe</Badge>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Monitoring */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Risk Monitoring
              </CardTitle>
              <CardDescription>
                Live monitoring of portfolio risk metrics and market conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">High Risk Positions</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">3</div>
                  <p className="text-xs text-red-600">Requires attention</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Pending Reviews</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">7</div>
                  <p className="text-xs text-yellow-600">Compliance checks</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Safe Positions</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">127</div>
                  <p className="text-xs text-green-600">Within risk limits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Regulatory Compliance Status
              </CardTitle>
              <CardDescription>
                SEBI regulations and industry standards compliance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.color === 'green' ? 
                        <CheckCircle className="h-5 w-5 text-green-600" /> : 
                        <Clock className="h-5 w-5 text-yellow-600" />
                      }
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        item.color === 'green' 
                          ? 'text-green-700 border-green-200 bg-green-50' 
                          : 'text-yellow-700 border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regulatory Framework */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Investment Advisory License Framework</CardTitle>
              <CardDescription>
                Preparing for SEBI Investment Adviser registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Required Documentation</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>✅ Certificate of incorporation</li>
                    <li>✅ Qualification certificates</li>
                    <li>✅ Net worth certificates</li>
                    <li>⏳ Professional indemnity insurance</li>
                    <li>⏳ Compliance manual</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Compliance Requirements</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>✅ Client agreement templates</li>
                    <li>✅ Risk profiling framework</li>
                    <li>✅ Grievance redressal mechanism</li>
                    <li>⏳ Code of conduct implementation</li>
                    <li>⏳ Periodic compliance reporting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Active Risk Alerts
              </CardTitle>
              <CardDescription>
                Real-time alerts for risk breaches and compliance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'high' 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline"
                            className={
                              alert.severity === 'high' 
                                ? 'text-red-700 border-red-200 bg-red-100' 
                                : 'text-yellow-700 border-yellow-200 bg-yellow-100'
                            }
                          >
                            {alert.type}
                          </Badge>
                          <span className="text-xs text-gray-500">{alert.timestamp}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Risk-Adjusted Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-blue-600 mb-2">18.7%</div>
                  <p className="text-gray-600">Annual Return (Risk-Adjusted)</p>
                  <div className="mt-4 text-sm text-gray-500">
                    Sharpe Ratio: {riskMetrics.sharpeRatio} | Sortino Ratio: 2.34
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Stress Testing Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">2008 Crisis Scenario</span>
                    <span className="text-sm text-red-600">-12.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">COVID-19 Scenario</span>
                    <span className="text-sm text-red-600">-8.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Interest Rate Shock</span>
                    <span className="text-sm text-red-600">-4.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Compliance Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Monthly Risk Report</h4>
                    <p className="text-sm text-gray-600">August 2025</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">SEBI Compliance Report</h4>
                    <p className="text-sm text-gray-600">Q2 2025</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Audit Trail Report</h4>
                    <p className="text-sm text-gray-600">Last 30 days</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}