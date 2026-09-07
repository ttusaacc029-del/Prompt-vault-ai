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
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });

    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    let textBody = '';

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      try {
        textBody = await res.text();
      } catch {
        textBody = '';
      }
    }

    if (!res.ok) {
      let errorMsg = data?.error || data?.message;
      if (!errorMsg && textBody) {
        try {
          const parsed = JSON.parse(textBody);
          errorMsg = parsed.error || parsed.message;
        } catch {
          errorMsg = textBody.length > 200 ? textBody.slice(0, 200) + '...' : textBody;
        }
      }
      throw new Error(errorMsg || `Server error (${res.status}): AI operation failed.`);
    }

    if (!data) {
      if (textBody) {
        try {
          data = JSON.parse(textBody);
        } catch {
          throw new Error('Server returned an invalid response format.');
        }
      } else {
        try {
          data = await res.json();
        } catch {
          throw new Error('Failed to parse AI response as JSON.');
        }
      }
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
