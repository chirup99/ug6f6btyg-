import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Sector-specific podcast themes
const PODCAST_THEMES = {
  IT: {
    name: "TECH",
    topics: ["AI innovation", "startup stories", "tech careers", "digital transformation", "cybersecurity", "cloud computing", "blockchain", "software development", "tech entrepreneurship", "future technologies"]
  },
  FINANCE: {
    name: "FINANCE", 
    topics: ["investment strategies", "market analysis", "personal finance", "cryptocurrency", "trading tips", "economic trends", "wealth building", "financial planning", "stock market insights", "money management"]
  },
  COMMODITY: {
    name: "COMMODITY",
    topics: ["commodity trading", "gold investment", "oil markets", "agricultural futures", "metals analysis", "energy markets", "supply chain", "commodity strategies", "market volatility", "global trade"]
  },
  GLOBAL: {
    name: "GLOBAL",
    topics: ["global economics", "international trade", "geopolitics", "world markets", "emerging economies", "currency analysis", "global trends", "international business", "trade wars", "economic policies"]
  },
  BANKS: {
    name: "BANKING",
    topics: ["banking innovation", "digital banking", "fintech disruption", "monetary policy", "banking regulations", "interest rates", "credit markets", "payment systems", "banking technology", "financial services"]
  },
  AUTOMOBILE: {
    name: "AUTO",
    topics: ["electric vehicles", "automotive innovation", "auto industry trends", "car manufacturing", "autonomous vehicles", "automotive technology", "EV charging", "mobility solutions", "car reviews", "industry analysis"]
  },
  RESILIENCE: {
    name: "RESILIENCE",
    topics: ["mental strength", "overcoming challenges", "crisis management", "emotional resilience", "stress management", "adaptability", "life struggles", "bouncing back", "personal growth", "recovery stories"]
  }
};

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  duration: string;
  host: string;
  category: string;
  trending: boolean;
  listeners: string;
}

export async function generateTrendingPodcasts(sector: keyof typeof PODCAST_THEMES): Promise<PodcastEpisode[]> {
  const sectorTheme = PODCAST_THEMES[sector];
  
  try {
    // Generate 10 detailed podcast episodes using Google AI
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate 10 trending Indian ${sectorTheme.name.toLowerCase()} podcast episodes. For each episode provide:
      - Title (compelling, 8-12 words)
      - Description (detailed, 25-30 words about episode content)
      - Host name (realistic Indian names)
      - Duration (15-45 minutes realistic format)
      - Listener count (realistic numbers like 12.5K, 45.2K, etc.)
      
      Focus on current Indian market trends, companies like TCS, Infosys, Reliance, SBI, Tata Motors, etc. Make it relevant to Indian audience.
      
      Format as JSON array with fields: title, description, host, duration, listeners`,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        responseMimeType: "application/json"
      }
    });

    let podcastData;
    try {
      podcastData = JSON.parse(response.text || '[]');
    } catch {
      // Fallback to manual parsing if JSON fails
      podcastData = await generateFallbackPodcasts(sector);
    }

    // Transform to our interface format
    const podcasts: PodcastEpisode[] = podcastData.slice(0, 10).map((item: any, index: number) => ({
      id: `${sector.toLowerCase()}-${index + 1}`,
      title: item.title || `${sectorTheme.name} Insights Episode ${index + 1}`,
      description: item.description || `Deep dive into ${sectorTheme.topics[index % sectorTheme.topics.length]} trends`,
      duration: item.duration || `${Math.floor(Math.random() * 30) + 15}m`,
      host: item.host || `Host ${index + 1}`,
      category: sectorTheme.name,
      trending: index < 3, // First 3 are trending
      listeners: item.listeners || `${Math.floor(Math.random() * 50) + 10}.${Math.floor(Math.random() * 9)}K`
    }));

    return podcasts;

  } catch (error) {
    console.error(`Error generating ${sector} podcasts:`, error);
    return await generateFallbackPodcasts(sector);
  }
}

async function generateFallbackPodcasts(sector: keyof typeof PODCAST_THEMES): Promise<PodcastEpisode[]> {
  const sectorTheme = PODCAST_THEMES[sector];
  
  const fallbackPodcasts: Record<string, PodcastEpisode[]> = {
    IT: [
      { id: "it-1", title: "TCS AI Revolution: Inside India's Tech Giant", description: "Exploring how TCS is leading AI transformation across global enterprises with innovative solutions", host: "Priya Sharma", duration: "32m", category: "TECH", trending: true, listeners: "45.2K" },
      { id: "it-2", title: "Infosys Digital Strategy: Future of Work", description: "Deep dive into Infosys's digital workplace transformation and remote work innovations", host: "Rajesh Kumar", duration: "28m", category: "TECH", trending: true, listeners: "38.7K" },
      { id: "it-3", title: "Indian Startup Unicorns: The Billion Dollar Journey", description: "Success stories of Indian tech startups reaching unicorn status in competitive markets", host: "Sneha Patel", duration: "35m", category: "TECH", trending: true, listeners: "52.1K" },
      { id: "it-4", title: "Wipro Cloud Migration: Enterprise Transformation", description: "How Wipro is helping global companies migrate to cloud infrastructure successfully", host: "Amit Singh", duration: "25m", category: "TECH", trending: false, listeners: "29.3K" },
      { id: "it-5", title: "HCL Tech Innovation Labs: Building Tomorrow", description: "Inside HCL's research and development initiatives creating cutting-edge technology solutions", host: "Kavya Nair", duration: "30m", category: "TECH", trending: false, listeners: "33.8K" }
    ],
    FINANCE: [
      { id: "finance-1", title: "Sensex 85000: Historic Market Milestone Analysis", description: "Expert analysis of Sensex crossing 85000 points and what it means for investors", host: "Vikram Chandra", duration: "40m", category: "FINANCE", trending: true, listeners: "67.3K" },
      { id: "finance-2", title: "RBI Policy Impact: Interest Rates and You", description: "Understanding how RBI's monetary policy decisions affect personal and business finances", host: "Meera Joshi", duration: "35m", category: "FINANCE", trending: true, listeners: "54.9K" },
      { id: "finance-3", title: "Mutual Fund SIP Revolution in India", description: "How systematic investment plans are changing wealth creation for middle-class Indians", host: "Rohit Agarwal", duration: "28m", category: "FINANCE", trending: true, listeners: "71.2K" },
      { id: "finance-4", title: "FII Inflows: Foreign Investment Surge Explained", description: "Analyzing the massive foreign institutional investor inflows into Indian markets", host: "Anita Desai", duration: "33m", category: "FINANCE", trending: false, listeners: "42.6K" },
      { id: "finance-5", title: "SEBI New Rules: Market Regulation Updates", description: "Latest SEBI regulations and their impact on retail and institutional investors", host: "Suresh Menon", duration: "26m", category: "FINANCE", trending: false, listeners: "38.1K" }
    ],
    COMMODITY: [
      { id: "commodity-1", title: "Gold Rush 2025: Indian Wedding Season Demand", description: "How festive season buying is driving gold prices to new highs in Indian markets", host: "Deepak Malhotra", duration: "31m", category: "COMMODITY", trending: true, listeners: "43.7K" },
      { id: "commodity-2", title: "MCX Crude Oil: Global Supply Chain Impact", description: "Analysis of crude oil futures and how global events affect Indian energy markets", host: "Ritu Sharma", duration: "29m", category: "COMMODITY", trending: true, listeners: "36.8K" },
      { id: "commodity-3", title: "Silver Imports Surge: Festive Buying Trends", description: "Record silver imports during festive season and investment opportunity analysis", host: "Arun Kapoor", duration: "24m", category: "COMMODITY", trending: true, listeners: "31.4K" },
      { id: "commodity-4", title: "Steel Production Records: Infrastructure Boom", description: "Indian steel industry hitting production records driven by infrastructure development", host: "Priyanka Reddy", duration: "27m", category: "COMMODITY", trending: false, listeners: "28.9K" },
      { id: "commodity-5", title: "Agricultural Exports: India's Global Position", description: "How Indian agricultural commodity exports are performing in international markets", host: "Manoj Gupta", duration: "33m", category: "COMMODITY", trending: false, listeners: "25.6K" }
    ],
    GLOBAL: [
      { id: "global-1", title: "India-US Trade: Final Phase Negotiations", description: "Inside the final phase of India-US trade deal negotiations and economic implications", host: "Sanjay Verma", duration: "42m", category: "GLOBAL", trending: true, listeners: "58.3K" },
      { id: "global-2", title: "Supply Chain Shift: India Manufacturing Hub", description: "How global companies are shifting supply chains to Indian manufacturing centers", host: "Pooja Singh", duration: "36m", category: "GLOBAL", trending: true, listeners: "47.1K" },
      { id: "global-3", title: "Foreign Portfolio Investment: $50B Milestone", description: "Analysis of foreign portfolio investments crossing $50 billion mark in India", host: "Rahul Jain", duration: "34m", category: "GLOBAL", trending: true, listeners: "62.7K" },
      { id: "global-4", title: "Renewable Energy: India's Global Leadership", description: "How India is emerging as a key player in global renewable energy transition", host: "Lakshmi Iyer", duration: "38m", category: "GLOBAL", trending: false, listeners: "41.2K" },
      { id: "global-5", title: "International Allocation: Investor Confidence", description: "Why international investors are increasing their allocation to Indian markets", host: "Karan Mehta", duration: "30m", category: "GLOBAL", trending: false, listeners: "35.8K" }
    ],
    BANKS: [
      { id: "banks-1", title: "SBI Infrastructure Lending: ₹15000 Cr Initiative", description: "State Bank of India's massive infrastructure lending program and economic impact", host: "Neha Agarwal", duration: "37m", category: "BANKING", trending: true, listeners: "49.6K" },
      { id: "banks-2", title: "HDFC Digital Growth: 18% Transaction Surge", description: "How HDFC Bank achieved 18% growth in digital transactions through innovation", host: "Arjun Prasad", duration: "32m", category: "BANKING", trending: true, listeners: "44.3K" },
      { id: "banks-3", title: "ICICI AI Platform: Customer Service Revolution", description: "ICICI Bank's AI-powered customer service platform transforming banking experience", host: "Shruti Malhotra", duration: "29m", category: "BANKING", trending: true, listeners: "52.8K" },
      { id: "banks-4", title: "Digital Lending Guidelines: RBI New Rules", description: "Understanding RBI's new digital lending guidelines and their impact on banks", host: "Vivek Sharma", duration: "26m", category: "BANKING", trending: false, listeners: "33.7K" },
      { id: "banks-5", title: "Banking NPAs: Decade Low Achievement", description: "How Indian banking sector achieved decade-low non-performing assets levels", host: "Manisha Gupta", duration: "31m", category: "BANKING", trending: false, listeners: "38.4K" }
    ],
    AUTOMOBILE: [
      { id: "auto-1", title: "Tata Motors EV: Sales Double Year-on-Year", description: "Inside Tata Motors' electric vehicle success story and market domination strategy", host: "Akash Patel", duration: "34m", category: "AUTO", trending: true, listeners: "41.9K" },
      { id: "auto-2", title: "Maruti Hybrid Technology: New Model Launch", description: "Maruti Suzuki's new hybrid technology models and competitive market positioning", host: "Swati Nair", duration: "28m", category: "AUTO", trending: true, listeners: "36.2K" },
      { id: "auto-3", title: "Mahindra EV Investment: ₹8000 Cr Plan", description: "Mahindra's massive ₹8000 crore electric vehicle investment plan and future roadmap", host: "Ravi Kumar", duration: "31m", category: "AUTO", trending: true, listeners: "48.5K" },
      { id: "auto-4", title: "Auto Exports Record: All-Time High 2025", description: "How Indian automobile exports reached all-time highs and global market impact", host: "Kritika Joshi", duration: "27m", category: "AUTO", trending: false, listeners: "29.7K" },
      { id: "auto-5", title: "EV Subsidies Extension: PLI Scheme Benefits", description: "Government's EV subsidy extension under PLI scheme and industry response", host: "Sandeep Rana", duration: "25m", category: "AUTO", trending: false, listeners: "32.1K" }
    ],
    RESILIENCE: [
      { id: "resilience-1", title: "Building Mental Resilience: Stress to Strength", description: "Expert insights on transforming daily stress into mental strength and emotional resilience", host: "Dr. Priya Chopra", duration: "42m", category: "RESILIENCE", trending: true, listeners: "58.9K" },
      { id: "resilience-2", title: "Comeback Stories: From Failure to Success", description: "Inspiring stories of individuals who overcame major setbacks to achieve remarkable success", host: "Rajesh Sethi", duration: "36m", category: "RESILIENCE", trending: true, listeners: "64.3K" },
      { id: "resilience-3", title: "Crisis Management: Leading Through Uncertainty", description: "How successful leaders navigate crises and emerge stronger using resilience strategies", host: "Kavita Sharma", duration: "39m", category: "RESILIENCE", trending: true, listeners: "52.7K" },
      { id: "resilience-4", title: "Emotional Recovery: Healing from Life Trauma", description: "Professional guidance on emotional healing and rebuilding life after traumatic experiences", host: "Dr. Amit Verma", duration: "33m", category: "RESILIENCE", trending: false, listeners: "41.2K" },
      { id: "resilience-5", title: "Adaptability Skills: Thriving in Change", description: "Developing adaptability skills to not just survive but thrive during life transitions", host: "Neha Gupta", duration: "28m", category: "RESILIENCE", trending: false, listeners: "35.8K" }
    ]
  };

  return fallbackPodcasts[sector] || fallbackPodcasts.FINANCE;
}

export async function getTrendingPodcastsForSector(sector: keyof typeof PODCAST_THEMES) {
  const podcasts = await generateTrendingPodcasts(sector);
  const sectorInfo = PODCAST_THEMES[sector];
  
  return {
    sector,
    sectorName: sectorInfo.name,
    podcasts,
    totalEpisodes: podcasts.length,
    trendingCount: podcasts.filter(p => p.trending).length,
    lastUpdated: new Date().toISOString()
  };
}