/**
 * Central AI Service
 * Routes AI generation requests through secure server-side API endpoints
 * to keep API keys strictly protected.
 */

export interface AIEnhanceOptions {
  idea: string;
  style?: string;
  cameraMovement?: string;
  lighting?: string;
  aspectRatio?: string;
  targetEngine?: string;
  negativePrompts?: string;
}

export interface AIEnhanceResponse {
  enhancedPrompt: string;
  cameraDirection: string;
  lightingSpecs: string;
  colorGrade: string;
  pacingAndMotion: string;
  negativePrompt: string;
  suggestedVariables: Array<{ key: string; label: string; defaultValue: string }>;
  suggestedEngines: string[];
}

export interface ImageToPromptOptions {
  imageBase64: string;
  mimeType: string;
  targetEngine?: string;
  aspectRatio?: string;
  additionalNotes?: string;
}

export interface ImageToPromptResponse {
  sceneDescription: string;
  generatedMasterPrompt: string;
  cameraMotion: string;
  lightingAtmosphere: string;
  colorPalette: string[];
  visualElements: string[];
  recommendedEngine: string;
}

class AIService {
  private baseUrl = '/api/ai';

  /**
   * Sends user prompt parameters to the server-side Gemini 3.8 pipeline
   */
  async enhancePrompt(
    options: AIEnhanceOptions, 
    userToken?: { userId?: string; userPlan?: string }
  ): Promise<AIEnhanceResponse> {
    const res = await fetch(`${this.baseUrl}/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        userId: userToken?.userId,
        userPlan: userToken?.userPlan || 'FREE'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to enhance prompt with AI. Please try again.');
    }

    return data;
  }

  /**
   * Analyzes an uploaded reference image and generates a cinematic video prompt
   */
  async analyzeImageToPrompt(
    options: ImageToPromptOptions,
    userToken?: { userId?: string; userPlan?: string }
  ): Promise<ImageToPromptResponse> {
    const res = await fetch(`${this.baseUrl}/image-to-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        userId: userToken?.userId,
        userPlan: userToken?.userPlan || 'FREE'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to analyze image with AI. Please check file format.');
    }

    return data;
  }
}

export const aiService = new AIService();
