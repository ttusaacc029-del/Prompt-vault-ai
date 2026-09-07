import { GoogleGenAI, Type } from '@google/genai';

function getApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim()
  );
}

export default async function handler(req: any, res: any) {
  // Always ensure JSON responses
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Use POST.',
      message: 'Method Not Allowed. Use POST.'
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON request body',
          message: 'Invalid JSON request body'
        });
      }
    }

    const {
      idea,
      style,
      duration,
      aspectRatio,
      cameraStyle,
      cameraMovement,
      lighting,
      targetEngine,
      visualQuality
    } = body || {};

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an idea to enhance.',
        message: 'Please provide an idea to enhance.'
      });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured in your environment variables. Please add GEMINI_API_KEY to your deployment settings.',
        message: 'GEMINI_API_KEY is not configured in your environment variables. Please add GEMINI_API_KEY to your deployment settings.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const effectiveCameraStyle = cameraStyle || cameraMovement || 'Dynamic smooth tracking';

    const promptInstruction = `You are the Lead Master AI Video Prompt Engineer for Prompt Vault.
Your mission is to transform the user's core idea into an elite, production-grade Master AI Video Prompt (designed for Runway Gen-3 Alpha, Kling 1.5, Luma Dream Machine, Sora, and Minimax).

CRITICAL RULE: You MUST preserve the user's original concept and core subject. Never substitute or change the fundamental idea.

User's Original Idea: "${idea.trim()}"
Desired Visual Style: ${style || 'Cinematic Photoreal 35mm'}
Desired Duration: ${duration || '5s'}
Aspect Ratio: ${aspectRatio || '16:9'}
Camera Movement Style: ${effectiveCameraStyle}
${lighting ? `Lighting: ${lighting}` : ''}
${targetEngine ? `Target Video Model: ${targetEngine}` : ''}
Visual Quality: ${visualQuality || '4K Photorealistic, pristine optics'}

Generate a structured, vivid, Hollywood-grade video generation prompt containing:
- Exact subject details and tactile textural nuances
- Environment and atmospheric depth layers
- Camera angle, lens characteristics (e.g. 35mm anamorphic, f/1.8), and camera trajectory
- Lighting conditions (e.g. volumetric rays, rim light, golden hour, neon bounce)
- Composition, depth of field, and fluid motion dynamics
- Mood, color palette, and color grading tones
- Negative guidance or optical artifacts to avoid (clean, no motion stutter, no distortion)

Return valid JSON strictly matching the response schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptInstruction,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedPrompt: {
              type: Type.STRING,
              description: 'The complete Master AI Video Prompt ready to copy-paste into an AI video generator.'
            },
            cameraDirection: {
              type: Type.STRING,
              description: 'Camera lens, angle, and specific camera movement details.'
            },
            lightingSpecs: {
              type: Type.STRING,
              description: 'Lighting setup, illumination, and color temperature.'
            },
            colorGrade: {
              type: Type.STRING,
              description: 'Color palette and tone grading specifications.'
            },
            pacingAndMotion: {
              type: Type.STRING,
              description: 'Kinetic pacing and subject motion dynamics.'
            },
            negativePrompt: {
              type: Type.STRING,
              description: 'Negative guidance and visual artifacts to avoid.'
            }
          },
          required: ['enhancedPrompt']
        }
      }
    });

    let enhancedPrompt = '';
    let cameraDirection = '';
    let lightingSpecs = '';
    let colorGrade = '';
    let pacingAndMotion = '';
    let negativePrompt = '';

    const text = response.text || '';
    try {
      const parsed = JSON.parse(text);
      enhancedPrompt = parsed.enhancedPrompt || '';
      cameraDirection = parsed.cameraDirection || '';
      lightingSpecs = parsed.lightingSpecs || '';
      colorGrade = parsed.colorGrade || '';
      pacingAndMotion = parsed.pacingAndMotion || '';
      negativePrompt = parsed.negativePrompt || '';
    } catch {
      enhancedPrompt = text.trim();
    }

    if (!enhancedPrompt) {
      enhancedPrompt = `${style || 'Cinematic'} Master Shot of ${idea.trim()}, hyper-realistic 4K detail, ${effectiveCameraStyle}, pristine optical depth of field, cinematic lighting, volumetric atmosphere, ultra-high resolution.`;
    }

    return res.status(200).json({
      success: true,
      enhancedPrompt,
      cameraDirection: cameraDirection || effectiveCameraStyle,
      lightingSpecs: lightingSpecs || lighting || 'Cinematic natural key light with subtle rim fill',
      colorGrade: colorGrade || 'Kodak Vision3 500T balanced palette',
      pacingAndMotion: pacingAndMotion || 'Fluid 24fps cinematic cadence',
      negativePrompt: negativePrompt || 'Blur, overexposure, plastic skin, jittery frame interpolation, chromatic aberration'
    });
  } catch (err: any) {
    console.error('Enhance prompt handler error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to enhance prompt with Gemini AI',
      message: err.message || 'Failed to enhance prompt with Gemini AI'
    });
  }
}
