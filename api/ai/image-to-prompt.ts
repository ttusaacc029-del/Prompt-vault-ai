import { GoogleGenAI } from '@google/genai';

function getApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim()
  );
}

export default async function handler(req: any, res: any) {
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
      imageBase64,
      targetEngine = 'Runway Gen-3 Alpha',
      aspectRatio = '16:9',
      styleEmphasis = 'Cinematic'
    } = body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid base64 image.',
        message: 'Please provide a valid base64 image.'
      });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured in your environment variables.',
        message: 'GEMINI_API_KEY is not configured in your environment variables.'
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

    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const prompt = `Analyze this reference frame with precision and generate a professional Master AI Video Prompt engineered for ${targetEngine}.
Desired style emphasis: ${styleEmphasis}. Aspect ratio: ${aspectRatio}.

Return ONLY valid JSON matching this exact structure:
{
  "masterPrompt": "string (the full master prompt ready for video generation)",
  "subjectBreakdown": "string (details of the subject, attire, expressions)",
  "lightingAndAtmosphere": "string (lighting setup, color temperature, atmospheric haze)",
  "cameraAndLens": "string (lens type, camera angle, motion trajectory)",
  "suggestedEngine": "${targetEngine}"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { masterPrompt: text.trim() };
    }

    return res.status(200).json({
      success: true,
      masterPrompt: parsed.masterPrompt || 'Cinematic shot based on uploaded reference frame.',
      subjectBreakdown: parsed.subjectBreakdown || 'Primary subject detailed from source visual.',
      lightingAndAtmosphere: parsed.lightingAndAtmosphere || 'Volumetric natural lighting.',
      cameraAndLens: parsed.cameraAndLens || '35mm anamorphic prime, subtle push-in tracking.',
      suggestedEngine: parsed.suggestedEngine || targetEngine
    });
  } catch (err: any) {
    console.error('Image-to-prompt handler error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to analyze image with Gemini AI',
      message: err.message || 'Failed to analyze image with Gemini AI'
    });
  }
}
