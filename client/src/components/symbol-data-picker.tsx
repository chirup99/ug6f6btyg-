import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Settings, TrendingUp, Database } from "lucide-react";

interface Symbol {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  active: boolean;
  createdAt: string;
}

interface SymbolPickerProps {
  onSymbolsChange?: (symbols: Symbol[]) => void;
}

const PREDEFINED_SYMBOLS = [
  { symbol: "NSE:NIFTY50-INDEX", name: "NIFTY 50", exchange: "NSE", sector: "Index" },
  { symbol: "NSE:BANKNIFTY-INDEX", name: "BANK NIFTY", exchange: "NSE", sector: "Index" },
  { symbol: "NSE:HDFCBANK-EQ", name: "HDFC Bank", exchange: "NSE", sector: "Banking" },
  { symbol: "NSE:ICICIBANK-EQ", name: "ICICI Bank", exchange: "NSE", sector: "Banking" },
  { symbol: "NSE:RELIANCE-EQ", name: "Reliance Industries", exchange: "NSE", sector: "Oil & Gas" },
  { symbol: "NSE:INFY-EQ", name: "Infosys", exchange: "NSE", sector: "IT" },
  { symbol: "NSE:TCS-EQ", name: "Tata Consultancy Services", exchange: "NSE", sector: "IT" },
  { symbol: "NSE:SBIN-EQ", name: "State Bank of India", exchange: "NSE", sector: "Banking" },
  { symbol: "NSE:LT-EQ", name: "Larsen & Toubro", exchange: "NSE", sector: "Engineering" },
  { symbol: "NSE:WIPRO-EQ", name: "Wipro", exchange: "NSE", sector: "IT" }
];

export default function SymbolDataPicker({ onSymbolsChange }: SymbolPickerProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([]);
  const [newSymbol, setNewSymbol] = useState({
    symbol: "",
    name: "",
    exchange: "NSE",
    sector: ""
  });
  const [searchFilter, setSearchFilter] = useState("");

  const queryClient = useQueryClient();

  // Fetch current symbols from database
  const { data: databaseSymbols, isLoading } = useQuery<Symbol[]>({
    queryKey: ['/api/battu/symbols'],
    queryFn: () => apiRequest('/api/battu/symbols')
  });

  // Add symbol mutation
  const addSymbolMutation = useMutation({
    mutationFn: (symbol: Omit<Symbol, 'id' | 'createdAt'>) => 
      apiRequest({ url: '/api/battu/symbols', method: 'POST', body: symbol }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battu/symbols'] });
      setNewSymbol({ symbol: "", name: "", exchange: "NSE", sector: "" });
    }
  });

  // Update symbol status mutation
  const updateSymbolMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => 
      apiRequest({ url: `/api/battu/symbols/${id}`, method: 'PATCH', body: { active } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battu/symbols'] });
    }
  });

  // Delete symbol mutation
  const deleteSymbolMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest({ url: `/api/battu/symbols/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battu/symbols'] });
    }
  });

  const handleAddPredefinedSymbol = (predefinedSymbol: typeof PREDEFINED_SYMBOLS[0]) => {
    const symbolData = {
      ...predefinedSymbol,
      active: true
    };
    addSymbolMutation.mutate(symbolData);
  };

  const handleAddCustomSymbol = () => {
    if (!newSymbol.symbol || !newSymbol.name) return;
    
    const symbolData = {
      ...newSymbol,
      active: true
    };
    addSymbolMutation.mutate(symbolData);
  };

  const handleToggleSymbol = (id: number, active: boolean) => {
    updateSymbolMutation.mutate({ id, active });
  };

  const handleDeleteSymbol = (id: number) => {
    deleteSymbolMutation.mutate(id);
  };

  const filteredPredefined = PREDEFINED_SYMBOLS.filter(symbol =>
    symbol.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    symbol.symbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
    symbol.sector.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeSymbols = databaseSymbols?.filter(s => s.active) || [];
  const totalSymbols = databaseSymbols?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Symbol Data Picker</h2>
            <p className="text-gray-600">Configure symbols for BATTU scanner</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            {activeSymbols.length} Active
          </Badge>
          <Badge variant="outline" className="text-gray-600">
            {totalSymbols} Total
          </Badge>
        </div>
      </div>

      {/* Search Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Symbols</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search by name, symbol, or sector..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Symbols */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Current Symbols</span>
            </CardTitle>
            <CardDescription>Symbols configured for scanning</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-gray-500">Loading symbols...</div>
            ) : !databaseSymbols || databaseSymbols.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No symbols configured yet. Add symbols from the predefined list or create custom ones.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {databaseSymbols.map((symbol) => (
                  <div key={symbol.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={symbol.active}
                        onCheckedChange={(checked) => handleToggleSymbol(symbol.id, !!checked)}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{symbol.name}</div>
                        <div className="text-sm text-gray-600">{symbol.symbol}</div>
                        {symbol.sector && (
                          <Badge variant="secondary" className="text-xs">
                            {symbol.sector}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSymbol(symbol.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Symbols */}
        <div className="space-y-4">
          {/* Predefined Symbols */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <span>Predefined Symbols</span>
              </CardTitle>
              <CardDescription>Popular Indian market symbols</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPredefined.map((symbol, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{symbol.name}</div>
                      <div className="text-xs text-gray-600">{symbol.symbol}</div>
                      <Badge variant="outline" className="text-xs">
                        {symbol.sector}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPredefinedSymbol(symbol)}
                      disabled={addSymbolMutation.isPending}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Symbol */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <span>Add Custom Symbol</span>
              </CardTitle>
              <CardDescription>Create your own symbol configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      placeholder="NSE:SYMBOL-EQ"
                      value={newSymbol.symbol}
                      onChange={(e) => setNewSymbol(prev => ({ ...prev, symbol: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Company Name"
                      value={newSymbol.name}
                      onChange={(e) => setNewSymbol(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="exchange">Exchange</Label>
                    <Select value={newSymbol.exchange} onValueChange={(value) => 
                      setNewSymbol(prev => ({ ...prev, exchange: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSE">NSE</SelectItem>
                        <SelectItem value="MCX">MCX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sector">Sector (Optional)</Label>
                    <Input
                      id="sector"
                      placeholder="IT, Banking, etc."
                      value={newSymbol.sector}
                      onChange={(e) => setNewSymbol(prev => ({ ...prev, sector: e.target.value }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddCustomSymbol}
                  disabled={!newSymbol.symbol || !newSymbol.name || addSymbolMutation.isPending}
                  className="w-full"
                >
                  {addSymbolMutation.isPending ? "Adding..." : "Add Custom Symbol"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scanner Configuration Summary */}
      {activeSymbols.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Scanner Configuration Ready</CardTitle>
            <CardDescription>
              {activeSymbols.length} symbols selected for BATTU scanner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeSymbols.slice(0, 10).map((symbol) => (
                <Badge key={symbol.id} variant="secondary" className="bg-green-100 text-green-800">
                  {symbol.name}
                </Badge>
              ))}
              {activeSymbols.length > 10 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  +{activeSymbols.length - 10} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}