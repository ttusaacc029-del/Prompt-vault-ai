import { aiService, AIEnhanceOptions, AIEnhanceResponse } from './aiService';

export interface EnhancerPreset {
  id: string;
  name: string;
  camera: string;
  lighting: string;
  style: string;
  engine: string;
}

export const CINEMATIC_PRESETS: EnhancerPreset[] = [
  {
    id: 'anamorphic-dramatic',
    name: 'Anamorphic Dramatic',
    camera: '35mm Panavision anamorphic lens, slow dolly-in with subtle handheld breathing',
    lighting: 'High-contrast chiaroscuro, volumetric warm tungsten key, cool cyan fill',
    style: 'Cinematic Thriller',
    engine: 'Runway Gen-3 Alpha'
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neo-Noir',
    camera: 'Arri Alexa Mini, 50mm Prime f/1.4, tracking tracking shot at street level',
    lighting: 'Drenched wet asphalt reflection, magenta & electric cyan neon signage',
    style: 'Sci-Fi Cyberpunk',
    engine: 'Kling 1.5 Pro'
  },
  {
    id: 'nature-macro',
    name: 'National Geographic Macro',
    camera: '100mm f/2.8 Macro lens, shallow depth of field, slow panning rack focus',
    lighting: 'Golden hour diffused backlight, soft bokeh sun flares, misty atmosphere',
    style: 'Photorealistic Nature',
    engine: 'Luma Dream Machine'
  },
  {
    id: 'commercial-product',
    name: 'Apple/Automotive Commercial',
    camera: 'Bolt high-speed robotic arm, circular 360-degree sweep, pristine sharpness',
    lighting: 'Softbox studio lighting, clean specular highlights, minimal rim light',
    style: 'Commercial Luxury',
    engine: 'OpenAI Sora'
  }
];

class PromptEnhancerService {
  /**
   * Enhances raw user concepts into a multi-variable master prompt
   */
  async enhance(
    options: AIEnhanceOptions,
    userContext?: { userId?: string; userPlan?: string }
  ): Promise<AIEnhanceResponse> {
    if (!options.idea.trim()) {
      throw new Error('Please provide an initial concept or idea to enhance.');
    }
    return await aiService.enhancePrompt(options, userContext);
  }

  /**
   * Builds ready-to-copy generation text string
   */
  formatFinalPrompt(res: AIEnhanceResponse, engine: string): string {
    return `${res.enhancedPrompt} --camera: ${res.cameraDirection} --lighting: ${res.lightingSpecs} --color: ${res.colorGrade} --motion: ${res.pacingAndMotion} --engine: ${engine}`;
  }
}

export const promptEnhancerService = new PromptEnhancerService();
