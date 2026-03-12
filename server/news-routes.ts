import express from 'express';
import { getNewsForSector, NEWS_SECTORS } from './news-service.js';
import { getTrendingPodcastsForSector } from './podcast-service.js';

export const newsRouter = express.Router();

// Get daily news for a specific sector
newsRouter.post('/api/daily-news', async (req, res) => {
  try {
    const { sector } = req.body;
    
    if (!sector || !NEWS_SECTORS[sector as keyof typeof NEWS_SECTORS]) {
      return res.status(400).json({ error: 'Valid sector is required' });
    }

    console.log(`📰 Generating daily news for: ${sector}`);
    const newsData = await getNewsForSector(sector as keyof typeof NEWS_SECTORS);
    
    res.json({ 
      success: true, 
      ...newsData,
      duration: '1 minute'
    });
  } catch (error) {
    console.error('Daily news generation error:', error);
    res.status(500).json({ error: 'Failed to generate daily news' });
  }
});

// Get all available news sectors
newsRouter.get('/api/news-sectors', (req, res) => {
  const sectors = Object.entries(NEWS_SECTORS).map(([key, config]) => ({
    id: key,
    title: config.title,
    subtitle: config.subtitle,
    gradient: config.gradient,
    buttonColor: config.buttonColor,
    icon: config.icon
  }));

  res.json({ sectors });
});

// Get trending podcasts for a specific sector
newsRouter.post('/api/trending-podcasts', async (req, res) => {
  try {
    const { sector } = req.body;
    
    if (!sector || !NEWS_SECTORS[sector as keyof typeof NEWS_SECTORS]) {
      return res.status(400).json({ error: 'Valid sector is required' });
    }

    console.log(`🎧 Generating trending podcasts for: ${sector}`);
    const podcastData = await getTrendingPodcastsForSector(sector as keyof typeof NEWS_SECTORS);
    
    res.json({ 
      success: true, 
      ...podcastData
    });
  } catch (error) {
    console.error('Trending podcasts generation error:', error);
    res.status(500).json({ error: 'Failed to generate trending podcasts' });
  }
});

// Get latest headlines for all sectors
newsRouter.get('/api/all-daily-news', async (req, res) => {
  try {
    console.log('📰 Fetching latest news for all sectors...');
    
    const allNews = await Promise.all(
      Object.keys(NEWS_SECTORS).map(async (sector) => {
        try {
          return await getNewsForSector(sector as keyof typeof NEWS_SECTORS);
        } catch (error) {
          console.error(`Error fetching news for ${sector}:`, error);
          return null;
        }
      })
    );

    const validNews = allNews.filter(news => news !== null);
    
    res.json({ 
      success: true, 
      newsData: validNews,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('All daily news error:', error);
    res.status(500).json({ error: 'Failed to fetch daily news' });
  }
});