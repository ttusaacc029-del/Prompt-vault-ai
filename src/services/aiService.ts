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

  private async safePost<T>(endpoint: string, payload: any): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
    } catch (netErr: any) {
      throw new Error(`Network error: ${netErr.message || 'Failed to reach AI service.'}`);
    }

    const rawText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (!res.ok) {
      let errorMsg = data?.error || data?.message;
      if (!errorMsg) {
        if (res.status === 404) {
          errorMsg = `AI endpoint ${endpoint} was not found (404).`;
        } else if (rawText.trim().startsWith('<') || rawText.trim().toLowerCase().includes('the page could not be found')) {
          errorMsg = `Server error (${res.status}): AI endpoint returned an HTML error page.`;
        } else if (rawText.trim().length > 0 && rawText.trim().length < 200) {
          errorMsg = rawText.trim();
        } else {
          errorMsg = `Server error (${res.status}): AI operation failed.`;
        }
      }
      throw new Error(errorMsg);
    }

    if (data === null || data === undefined) {
      throw new Error('AI service returned an invalid response format.');
    }

    return data as T;
  }

  /**
   * Sends user prompt parameters to the server-side Gemini 3.8 pipeline
   */
  async enhancePrompt(
    options: AIEnhanceOptions, 
    userToken?: { userId?: string; userPlan?: string }
  ): Promise<AIEnhanceResponse> {
    return this.safePost<AIEnhanceResponse>('/enhance-prompt', {
      ...options,
      userId: userToken?.userId,
      userPlan: userToken?.userPlan || 'FREE'
    });
  }

  /**
   * Analyzes an uploaded reference image and generates a cinematic video prompt
   */
  async analyzeImageToPrompt(
    options: ImageToPromptOptions,
    userToken?: { userId?: string; userPlan?: string }
  ): Promise<ImageToPromptResponse> {
    return this.safePost<ImageToPromptResponse>('/image-to-prompt', {
      ...options,
      userId: userToken?.userId,
      userPlan: userToken?.userPlan || 'FREE'
    });
  }
}

export const aiService = new AIService();
