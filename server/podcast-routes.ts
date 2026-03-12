import express from 'express';
import { generateTopicContent } from './gemini-service.js';
import { getNewsForSector, NEWS_SECTORS } from './news-service.js';

export const podcastRouter = express.Router();

// Generate podcast content using Gemini AI
podcastRouter.post('/api/podcast-content', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`🎧 Generating podcast content for: ${topic}`);
    const content = await generateTopicContent(topic);
    
    res.json({ 
      success: true, 
      content, 
      topic,
      duration: '1 minute',
      wordCount: content.split(' ').length
    });
  } catch (error) {
    console.error('Podcast content generation error:', error);
    res.status(500).json({ error: 'Failed to generate podcast content' });
  }
});

// Generate daily news content for swiping cards
podcastRouter.post('/api/daily-news', async (req, res) => {
  try {
    const { sector } = req.body;
    
    if (!sector || !NEWS_SECTORS[sector as keyof typeof NEWS_SECTORS]) {
      return res.status(400).json({ error: 'Valid sector is required' });
    }

    console.log(`📰 Generating daily news for sector: ${sector}`);
    const newsData = await getNewsForSector(sector as keyof typeof NEWS_SECTORS);
    
    res.json({ 
      success: true,
      summary: newsData.summary,
      headlines: newsData.headlines,
      title: newsData.title,
      subtitle: newsData.subtitle,
      icon: newsData.icon
    });
  } catch (error) {
    console.error('Daily news generation error:', error);
    res.status(500).json({ error: 'Failed to generate daily news content' });
  }
});

// Get available podcast topics
podcastRouter.get('/api/podcast-topics', (req, res) => {
  const topics = [
    {
      id: 'ai_trading',
      title: 'AI TRADING INSIGHTS',
      description: 'Machine learning strategies',
      icon: '🤖'
    },
    {
      id: 'startup_stories',
      title: 'STARTUP STORIES',
      description: 'Founder journey podcast',
      icon: '🚀'
    },
    {
      id: 'stock_market',
      title: 'STOCK MARKET DAILY',
      description: 'Market analysis & trends',
      icon: '📈'
    },
    {
      id: 'business_models',
      title: 'BUSINESS MODELS',
      description: 'How companies make money',
      icon: '💼'
    }
  ];

  res.json({ topics });
});