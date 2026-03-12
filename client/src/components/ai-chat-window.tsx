import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  X, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Minimize2,
  Maximize2,
  Copy,
  Check
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Removed: base64Code and strategyCode - frontend generates these directly
}

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function AIChatWindow({ isOpen, onClose, initialQuery }: AIChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial query when window opens
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim() && messages.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [isOpen, initialQuery]);

  // EXACT SAME parseAIMessage function as working main tab BATTU AI
  const parseAIMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.replace(/^```(?:javascript)?\n?/, '').replace(/\n?```$/, '');
        return { type: 'code', content: code, index };
      }
      return { type: 'text', content: part, index };
    }).filter(part => part.content.trim());
  };

  // EXACT SAME copyToClipboard function as working main tab BATTU AI
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCodeIndex(index);
      setTimeout(() => setCopiedCodeIndex(null), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  // Get platform context for AI
  const { data: platformContext } = useQuery({
    queryKey: ['/api/ai-context'],
    enabled: isOpen,
  });

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use EXACT same API call as working main tab BATTU AI
      const response = await apiRequest('/api/gemini/chat', 'POST', {
        message: text,
        context: 'trading'
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'I can help you with trading analysis and strategy generation.',
        timestamp: new Date()
        // Removed: base64Code and strategyCode - frontend generates these directly
      };


      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[80vh]'
      }`}>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-6 h-6 text-indigo-500" />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                #1 BATTU AI
              </span>
              <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full font-semibold animate-pulse">
                ULTRA-SMART
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-full p-0">
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="relative">
                      <Bot className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                        #1
                      </div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      Welcome to #1 BATTU AI! 
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                      The world's smartest trading assistant with 50% text match intelligence
                    </p>
                    
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">🎯 Ultra-Smart Commands:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-700">"code"</span>
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-700">"rsi code"</span>
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-700">"reliance"</span>
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-700">"macd"</span>
                      </div>
                      <div className="border-t border-indigo-200 dark:border-indigo-700 pt-3">
                        <h5 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">🚀 NEW: Advanced Multi-Indicator Combinations:</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-2 py-1 rounded border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300">"rsi,macd code"</span>
                          <span className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-2 py-1 rounded border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300">"ema,rsi code"</span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 italic">✨ Trades only when ALL indicators agree!</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="flex flex-col items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-medium">Smart Stock Analysis</span>
                        <span className="text-xs text-gray-500">Live prices + fundamentals</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-700">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-medium">Code Generation</span>
                        <span className="text-xs text-gray-500">Trading strategies + bots</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 text-sm text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                        <BarChart3 className="w-5 h-5" />
                        <span className="font-medium">50% Text Matching</span>
                        <span className="text-xs text-gray-500">Understands short phrases</span>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 text-gray-800 dark:text-gray-200 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {/* EXACT SAME parseAIMessage display logic as working main tab BATTU AI */}
                        {message.role === 'assistant' ? (
                          <div className="space-y-2">
                            {parseAIMessage(message.content).map((part, partIndex) => (
                              <div key={partIndex}>
                                {part.type === 'text' ? (
                                  <div className="bg-slate-700 text-gray-200 px-3 py-2 rounded-lg text-sm whitespace-pre-wrap">
                                    {part.content}
                                  </div>
                                ) : (
                                  <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between bg-slate-800 px-3 py-2 border-b border-slate-600">
                                      <span className="text-xs text-gray-400 font-mono">Strategy Code</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(part.content, parseInt(message.id) * 100 + partIndex)}
                                        className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-slate-700"
                                      >
                                        {copiedCodeIndex === parseInt(message.id) * 100 + partIndex ? (
                                          <>
                                            <Check className="w-3 h-3 mr-1" />
                                            Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3 mr-1" />
                                            Copy
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <div className="p-3">
                                      <pre className="text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                                        {part.content}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-white">{message.content}</div>
                        )}
                      </div>
                      
                      <span className="text-xs opacity-70 mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-slate-800 to-slate-700 border border-purple-500/30 rounded-lg animate-pulse">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                      </div>
                      <span className="text-xs text-slate-300 font-medium animate-pulse">BATTU AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about stocks, market news, your trades, or any finance question..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}