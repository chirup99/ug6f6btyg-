import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EventImageRequest {
  category: string;
  eventName: string;
  description?: string;
}

export async function generateEventImage(request: EventImageRequest): Promise<string | null> {
  try {
    const prompt = createImagePrompt(request);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("No image candidates generated");
      return null;
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      console.error("No content parts in response");
      return null;
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        // Convert base64 image to data URL
        const imageDataUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
        console.log(`✅ Generated image for ${request.category}: ${request.eventName}`);
        return imageDataUrl;
      }
    }

    console.error("No image data found in response");
    return null;
  } catch (error) {
    console.error(`❌ Failed to generate image for ${request.category}:`, error);
    return null;
  }
}

function createImagePrompt(request: EventImageRequest): string {
  const categoryPrompts = {
    "Art & Design": "Create a beautiful abstract art gallery scene with colorful paintings, modern sculptures, and artistic lighting. Include blue and purple tones with geometric patterns.",
    "Music": "Create a starry night concert scene with musical instruments, stage lights, and cosmic elements. Include deep blues and purples with stars and musical notes.",
    "Fashion": "Create an elegant fashion runway with pink and purple lighting, flowing fabrics, and modern design elements. Include geometric shapes and fashion silhouettes.",
    "Health & Wellness": "Create a serene wellness scene with meditation elements, natural lighting, and calming blue tones. Include peaceful water reflections and zen aesthetics.",
    "Food & Culinary": "Create a vibrant culinary scene with colorful ingredients, cooking elements, and warm orange-red tones. Include artistic food presentation and kitchen aesthetics.",
    "Technology": "Create a futuristic tech scene with digital elements, circuit patterns, and purple-violet lighting. Include abstract tech shapes and cyber aesthetics.",
    "Outdoor & Adventure": "Create an adventurous outdoor scene with mountain landscapes, gear equipment, and purple-blue gradients. Include adventure sports elements and nature.",
    "Startup Innovations": "Create an innovative workspace scene with modern technology, green-teal tones, and startup elements. Include creative workspaces and innovation symbols.",
    "Promotions": "Create a dynamic marketing scene with vibrant colors, promotional elements, and fuchsia-purple tones. Include creative advertising and brand elements.",
    "Default": "Create a professional event scene with modern design elements, gradient backgrounds, and sophisticated lighting."
  };

  const basePrompt = categoryPrompts[request.category as keyof typeof categoryPrompts] || categoryPrompts.Default;
  
  return `${basePrompt} The image should be modern, professional, and visually appealing with a resolution suitable for web display. Style: Clean, contemporary, with beautiful gradients and lighting effects. No text or words in the image.`;
}

export async function generateEventImages(events: EventImageRequest[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  // Generate images sequentially to avoid rate limits
  for (const event of events) {
    const imageUrl = await generateEventImage(event);
    if (imageUrl) {
      const key = `${event.category}-${event.eventName}`.replace(/\s+/g, '-').toLowerCase();
      results[key] = imageUrl;
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}