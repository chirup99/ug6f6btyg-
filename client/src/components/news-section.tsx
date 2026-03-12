import { useQuery } from "@tanstack/react-query";
import { Newspaper, ExternalLink, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewsItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  source: string;
  createdAt: string;
  imageUrl?: string;
}

export function NewsSection() {
  const { data: news, isLoading, error } = useQuery<NewsItem[]>({
    queryKey: ["/api/neofeed/finance-news"],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        <span className="text-xs text-slate-500">Fetching latest market updates...</span>
      </div>
    );
  }

  if (error || !news || news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-center px-4">
        <Newspaper className="h-8 w-8 text-slate-300 mb-1" />
        <p className="text-xs text-slate-500">No recent news available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto custom-thin-scrollbar pr-1">
        <div className="space-y-3 py-1">
          {news.map((item) => (
            <div 
              key={item.id} 
              className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tight px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/30 rounded">
                  {item.source}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1.5 line-clamp-2">
                {item.title}
              </h4>
              {item.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                  {item.description}
                </p>
              )}
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Read full article <ExternalLink className="h-2.5 w-2.5 ml-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
