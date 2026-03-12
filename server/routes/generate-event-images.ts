import { Router } from 'express';
import { generateEventImage, generateEventImages, EventImageRequest } from '../gemini-image-generator.js';

const router = Router();

// Generate single event image
router.post('/generate-event-image', async (req, res) => {
  try {
    const { category, eventName, description } = req.body;
    
    if (!category || !eventName) {
      return res.status(400).json({ 
        error: 'Category and eventName are required' 
      });
    }

    const imageRequest: EventImageRequest = {
      category,
      eventName,
      description
    };

    const imageUrl = await generateEventImage(imageRequest);
    
    if (imageUrl) {
      res.json({ 
        success: true, 
        imageUrl,
        category,
        eventName
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate image' 
      });
    }
  } catch (error) {
    console.error('Error generating event image:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Generate multiple event images
router.post('/generate-event-images', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ 
        error: 'Events array is required' 
      });
    }

    const imageUrls = await generateEventImages(events);
    
    res.json({ 
      success: true, 
      images: imageUrls,
      generatedCount: Object.keys(imageUrls).length
    });
  } catch (error) {
    console.error('Error generating event images:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

export default router;