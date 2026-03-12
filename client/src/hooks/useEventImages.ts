import { useState, useEffect } from 'react';

export interface EventData {
  category: string;
  eventName: string;
  description?: string;
}

export interface EventImageState {
  loading: boolean;
  images: Record<string, string>;
  error: string | null;
}

export const useEventImages = () => {
  const [state, setState] = useState<EventImageState>({
    loading: false,
    images: {},
    error: null
  });

  const generateEventImage = async (event: EventData, retryCount = 0) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/events/generate-event-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        const key = `${event.category}-${event.eventName}`.replace(/\s+/g, '-').toLowerCase();
        setState(prev => ({
          ...prev,
          loading: false,
          images: {
            ...prev.images,
            [key]: data.imageUrl
          }
        }));
        return data.imageUrl;
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic for overloaded API (503 errors)
      if (errorMessage.includes('503') && retryCount < 3) {
        console.log(`AI service overloaded, retrying in ${2 ** (retryCount + 1)} seconds...`);
        setTimeout(() => {
          generateEventImage(event, retryCount + 1);
        }, 1000 * 2 ** (retryCount + 1)); // Exponential backoff: 2s, 4s, 8s
        return null;
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return null;
    }
  };

  const generateMultipleImages = async (events: EventData[], retryCount = 0) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/events/generate-event-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: events || [] }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success && data.images) {
        setState(prev => ({
          ...prev,
          loading: false,
          images: {
            ...prev.images,
            ...data.images
          }
        }));
        return data.images;
      } else {
        throw new Error('No images in response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic for overloaded API (503 errors)
      if (errorMessage.includes('503') && retryCount < 3) {
        console.log(`AI service overloaded, retrying in ${2 ** (retryCount + 1)} seconds...`);
        setTimeout(() => {
          generateMultipleImages(events, retryCount + 1);
        }, 1000 * 2 ** (retryCount + 1)); // Exponential backoff: 2s, 4s, 8s
        return null;
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return null;
    }
  };

  const getImageForEvent = (category: string, eventName: string): string | null => {
    const key = `${category}-${eventName}`.replace(/\s+/g, '-').toLowerCase();
    return state.images[key] || null;
  };

  return {
    ...state,
    generateEventImage,
    generateMultipleImages,
    getImageForEvent
  };
};