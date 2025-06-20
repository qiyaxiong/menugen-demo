export interface GeneratedImage {
  url: string;
  dishName: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export interface UsageInfo {
  count: number;
  limit: number;
  remaining: number;
}

export async function generateDishImage(dishName: string): Promise<{ imageUrl: string; usage?: UsageInfo; }> {
  try {
    const response = await fetch('/api/genimg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dishName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      imageUrl: data.imageUrl,
      usage: data.usage
    };
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

export function createImagePrompt(dishName: string): string {
  // Create a detailed prompt for food photography
  return `A professional food photography shot of ${dishName}, beautifully plated on an elegant plate, studio lighting, high resolution, appetizing, restaurant quality presentation, clean background, detailed textures, vibrant colors`;
} 