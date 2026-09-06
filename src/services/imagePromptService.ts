import { aiService, ImageToPromptOptions, ImageToPromptResponse } from './aiService';

class ImagePromptService {
  /**
   * Validates file size and MIME type before sending to server
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type)) {
      return {
        valid: false,
        error: 'Unsupported image format. Please upload JPEG, PNG, or WebP.'
      };
    }

    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return {
        valid: false,
        error: `Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size is 10MB.`
      };
    }

    return { valid: true };
  }

  /**
   * Encodes an image file to Base64 string
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // strip data:image/...;base64, prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Performs end-to-end image-to-prompt analysis
   */
  async analyze(
    options: ImageToPromptOptions,
    userContext?: { userId?: string; userPlan?: string }
  ): Promise<ImageToPromptResponse> {
    return await aiService.analyzeImageToPrompt(options, userContext);
  }
}

export const imagePromptService = new ImagePromptService();
