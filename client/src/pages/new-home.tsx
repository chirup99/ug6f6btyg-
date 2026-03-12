import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Code, 
  PenTool, 
  Target, 
  BookOpen, 
  Grid3X3,
  Send,
  Sparkles
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function NewHome() {
  const [searchQuery, setSearchQuery] = useState("");
  const { getUserDisplayName } = useCurrentUser();
  const displayName = getUserDisplayName().split(' ')[0]; // Just use first name for a friendly greeting

  const actionButtons = [
    {
      name: "Research",
      icon: Search,
      color: "bg-gray-700 hover:bg-gray-600 text-gray-200",
      description: "Search and analyze",
    },
    {
      name: "Claude Sonnet 4",
      icon: null,
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      description: "AI assistance",
      badge: "1",
    },
    {
      name: "Code",
      icon: Code,
      color: "bg-gray-700 hover:bg-gray-600 text-gray-200",
      description: "Programming help",
    },
    {
      name: "Write",
      icon: PenTool,
      color: "bg-green-600 hover:bg-green-700 text-white",
      description: "Content creation",
    },
    {
      name: "Strategize",
      icon: Target,
      color: "bg-purple-600 hover:bg-purple-700 text-white",
      description: "Plan and organize",
    },
    {
      name: "Learn",
      icon: BookOpen,
      color: "bg-orange-600 hover:bg-orange-700 text-white",
      description: "Educational content",
    },
    {
      name: "From your apps",
      icon: Grid3X3,
      color: "bg-pink-600 hover:bg-pink-700 text-white",
      description: "App integrations",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-12">
        {/* Greeting */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-6 w-6 text-orange-400" />
            <h1 className="text-3xl font-normal text-gray-100">
              What's new, {displayName}?
            </h1>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-3xl mx-auto">
          <Input
            placeholder="How can I help you today?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 pr-12 text-lg rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Button
            size="sm"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-gray-300"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
          {actionButtons.map((button, index) => (
            <Button
              key={index}
              variant="secondary"
              className={`${button.color} border-0 h-11 px-4 rounded-full font-medium transition-all duration-200 relative`}
            >
              <div className="flex items-center gap-2">
                {button.icon && <button.icon className="h-4 w-4" />}
                <span>{button.name}</span>
                {button.badge && (
                  <Badge variant="secondary" className="bg-white text-blue-600 ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold">
                    {button.badge}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}