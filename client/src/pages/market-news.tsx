import { useEffect, useState } from "react";
import { useRouter } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

interface NewsData {
  sector: string;
  title: string;
  subtitle: string;
  summary: string;
  headlines: string[];
  icon: string;
  gradient: string;
}

export default function MarketNews() {
  const router = useRouter();
  const [newsData, setNewsData] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const SECTORS = ["IT", "FINANCE", "COMMODITY", "GLOBAL", "BANKS", "AUTOMOBILE"];

  useEffect(() => {
    fetchAllSectorNews();
  }, []);

  const fetchAllSectorNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const newsPromises = SECTORS.map(sector =>
        fetch("/api/daily-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sector })
        })
          .then(res => res.json())
          .then(data => ({
            sector,
            ...data
          }))
          .catch(err => {
            console.error(`Failed to fetch news for ${sector}:`, err);
            return null;
          })
      );

      const results = await Promise.all(newsPromises);
      const validResults = results.filter((r): r is NewsData => r !== null);
      setNewsData(validResults);
    } catch (err) {
      console.error("Error fetching market news:", err);
      setError("Failed to load market news. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading market news from all sectors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-950 to-blue-950 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="text-white hover:bg-white/10"
            data-testid="button-back-market-news"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Market News</h1>
            <p className="text-slate-400 text-sm">Latest news from all sectors</p>
          </div>
        </div>

        {error && (
          <Card className="bg-red-500/10 border-red-500/20 p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </Card>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsData.map((news) => (
            <Card
              key={news.sector}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
              data-testid={`card-market-news-${news.sector.toLowerCase()}`}
            >
              {/* Header with Icon and Gradient */}
              <div className={`bg-gradient-to-r ${news.gradient} p-4 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
                <div className="relative">
                  <span className="text-4xl block mb-2">{news.icon}</span>
                  <h3 className="text-white font-bold text-lg">{news.title}</h3>
                  <p className="text-white/80 text-xs">{news.subtitle}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Summary */}
                <div>
                  <p className="text-slate-300 text-sm leading-relaxed">{news.summary}</p>
                </div>

                {/* Headlines */}
                <div>
                  <h4 className="text-white font-semibold text-sm mb-2">Top Headlines:</h4>
                  <ul className="space-y-1">
                    {news.headlines.slice(0, 3).map((headline, idx) => (
                      <li key={idx} className="text-slate-400 text-xs leading-relaxed flex gap-2">
                        <span className="text-blue-400 flex-shrink-0">•</span>
                        <span>{headline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {newsData.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <p className="text-slate-400">No news available at the moment.</p>
            <Button
              variant="outline"
              onClick={fetchAllSectorNews}
              className="mt-4"
              data-testid="button-retry-market-news"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
