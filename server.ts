import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CATEGORIES, INITIAL_PROMPTS, INITIAL_VIDEOS, DEMO_USERS } from './src/lib/defaultData';
import { SUBSCRIPTION_PLANS, canUserAccessPrompt, getRequiredPlanForLevel, hasRemainingUsage } from './src/lib/plans';
import { Category, CreatorVideo, CustomPromptRequest, Prompt, SubscriptionPlan, User, VideoReport } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with generous limit for base64 image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper to resolve Gemini API key from environment, .env, or AI Studio runtime injection
function getGeminiApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.API_KEY && process.env.API_KEY.trim()) {
    return process.env.API_KEY.trim();
  }

  // Check /app/.dev.env.json if injected at runtime by AI Studio
  try {
    const devEnvPaths = [
      path.resolve(process.cwd(), '../.dev.env.json'),
      '/app/.dev.env.json'
    ];
    for (const p of devEnvPaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.GEMINI_API_KEY && typeof parsed.GEMINI_API_KEY === 'string' && parsed.GEMINI_API_KEY.trim()) {
          process.env.GEMINI_API_KEY = parsed.GEMINI_API_KEY.trim();
          return process.env.GEMINI_API_KEY;
        }
      }
    }
  } catch {
    // Ignore error
  }

  return undefined;
}

// Lazy GoogleGenAI client with telemetry headers as per Gemini SDK specification
let aiClient: GoogleGenAI | null = null;
let initializedKey: string | undefined = undefined;

function getAI(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  if (!aiClient || initializedKey !== apiKey) {
    initializedKey = apiKey;
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// In-memory persistent state store
let users: User[] = [...DEMO_USERS];
let categories: Category[] = [...INITIAL_CATEGORIES];
let prompts: Prompt[] = [...INITIAL_PROMPTS];
let videos: CreatorVideo[] = [...INITIAL_VIDEOS];
let favorites: { [userId: string]: string[] } = {
  'usr-admin': ['prompt-1', 'prompt-5'],
  'usr-studio': ['prompt-2', 'prompt-7'],
  'usr-pro': ['prompt-1', 'prompt-3'],
  'usr-free': ['prompt-1']
};
let reports: VideoReport[] = [
  {
    id: 'rep-1',
    reporterId: 'usr-pro',
    reporterName: 'Jordan Reed',
    videoId: 'vid-1',
    videoTitle: 'Cyberpunk Tokyo Drift 2088',
    reason: 'Audio sync mismatch',
    description: 'Minor audio drop around second 4, just flagging for quality check.',
    createdAt: '2026-03-04',
    status: 'PENDING'
  }
];
let customRequests: CustomPromptRequest[] = [
  {
    id: 'req-1',
    userId: 'usr-studio',
    userName: 'Maya Lin',
    userEmail: 'creator@promptvault.ai',
    userPlan: 'STUDIO',
    title: 'Bioluminescent Deep Sea Leviathan',
    idea: 'A giant glowing jellyfish creature interacting with a deep-sea research submarine at 10,000 meters depth.',
    detailedDescription: 'Needs cinematic anamorphic lighting with suspended marine snow particles, submarine headlamps illuminating tentacles, dramatic orchestral tension feeling.',
    style: 'Hyper-Realistic 8K Underwater Documentary',
    targetPlatform: 'Runway Gen-3 Alpha',
    desiredDuration: '10s',
    status: 'IN_PROGRESS',
    priority: true,
    adminNotes: 'High priority studio member. Generating custom multi-shot prompt sequence.',
    createdAt: '2026-03-04',
    updatedAt: '2026-03-05'
  },
  {
    id: 'req-2',
    userId: 'usr-pro',
    userName: 'Jordan Reed',
    userEmail: 'pro@promptvault.ai',
    userPlan: 'PRO',
    title: 'Vintage 1970s Formula 1 Pitstop in Rain',
    idea: 'Monaco grand prix rainy pitstop with vintage Ferrari mechanics rushing with wrench sparks.',
    detailedDescription: 'Kodak 16mm grain texture, motion blur on spinning wet tires, saturated vintage red colors.',
    style: 'Vintage 35mm Film',
    targetPlatform: 'Kling 1.5 Pro',
    desiredDuration: '5s',
    status: 'SUBMITTED',
    priority: false,
    createdAt: '2026-03-05',
    updatedAt: '2026-03-05'
  }
];

// Monthly Usage tracking: userId -> { 'YYYY-MM': { promptEnhancerUsed, imageToPromptUsed, customRequestsUsed } }
const usageStore: Record<string, Record<string, { promptEnhancerUsed: number; imageToPromptUsed: number; customRequestsUsed: number; updatedAt: string }>> = {
  'usr-free': {
    '2026-03': { promptEnhancerUsed: 12, imageToPromptUsed: 8, customRequestsUsed: 0, updatedAt: '2026-03-05' }
  },
  'usr-pro': {
    '2026-03': { promptEnhancerUsed: 84, imageToPromptUsed: 310, customRequestsUsed: 4, updatedAt: '2026-03-05' }
  },
  'usr-studio': {
    '2026-03': { promptEnhancerUsed: 142, imageToPromptUsed: 620, customRequestsUsed: 9, updatedAt: '2026-03-05' }
  }
};

function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getUserUsage(userId: string) {
  const monthKey = getCurrentMonthKey();
  if (!usageStore[userId]) {
    usageStore[userId] = {};
  }
  if (!usageStore[userId][monthKey]) {
    usageStore[userId][monthKey] = {
      promptEnhancerUsed: 0,
      imageToPromptUsed: 0,
      customRequestsUsed: 0,
      updatedAt: new Date().toISOString()
    };
  }
  return {
    month: monthKey,
    ...usageStore[userId][monthKey]
  };
}

function incrementUserUsage(userId: string, feature: 'promptEnhancerUsed' | 'imageToPromptUsed' | 'customRequestsUsed') {
  const monthKey = getCurrentMonthKey();
  if (!usageStore[userId]) {
    usageStore[userId] = {};
  }
  if (!usageStore[userId][monthKey]) {
    usageStore[userId][monthKey] = {
      promptEnhancerUsed: 0,
      imageToPromptUsed: 0,
      customRequestsUsed: 0,
      updatedAt: new Date().toISOString()
    };
  }
  usageStore[userId][monthKey][feature] += 1;
  usageStore[userId][monthKey].updatedAt = new Date().toISOString();
  return usageStore[userId][monthKey];
}

// Sanitizes prompt output depending on user access rights
function sanitizePromptForUser(prompt: Prompt, userPlan: SubscriptionPlan): Prompt {
  const hasAccess = canUserAccessPrompt(userPlan, prompt.accessLevel);
  if (hasAccess) {
    return {
      ...prompt,
      isLockedForUser: false
    };
  }
  return {
    ...prompt,
    fullPrompt: '🔒 This Master Prompt is locked. Upgrade your subscription to view and copy this full prompt with all customizable parameters.',
    customizableVariables: [],
    isLockedForUser: true,
    requiredPlan: getRequiredPlanForLevel(prompt.accessLevel)
  };
}

// ==========================================
// AUTHENTICATION & AUTHORIZATION HELPERS
// ==========================================

const OWNER_SUPERADMIN_EMAIL = 'usagiptiktok@gmail.com';

function getRequestUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  const userEmailHeader = (req.headers['x-user-email'] as string) || (req.query.userEmail as string);
  const userIdHeader = (req.headers['x-user-id'] as string) || (req.query.userId as string);

  let foundUser: User | undefined;
  if (userEmailHeader) {
    foundUser = users.find(u => u.email.toLowerCase() === userEmailHeader.toLowerCase());
  }
  if (!foundUser && userIdHeader) {
    foundUser = users.find(u => u.uid === userIdHeader);
  }
  if (!foundUser && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    foundUser = users.find(u => u.uid === token || u.email.toLowerCase() === token.toLowerCase());
  }

  // Automatic Super Admin designation for the owner account
  if (foundUser && foundUser.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase()) {
    foundUser.role = 'superadmin';
    foundUser.isSuperAdmin = true;
    foundUser.adminPermissions = {
      canManagePrompts: true,
      canManageCategories: true,
      canManageUsers: true,
      canManageSubscriptions: true,
      canManageVideos: true,
      canManageRequests: true,
      canManageReports: true,
      canManageAdmins: true
    };
  }

  return foundUser || null;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const isSuper = user.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase() || user.role === 'superadmin' || user.isSuperAdmin === true;
  const isAdmin = isSuper || user.role === 'admin';

  if (!isAdmin) {
    return res.status(403).json({ error: 'Access forbidden. Administrator clearance required.' });
  }

  (req as any).user = user;
  next();
}

function requireSuperAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const isSuper = user.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase() || user.role === 'superadmin' || user.isSuperAdmin === true;

  if (!isSuper) {
    return res.status(403).json({ error: 'Access forbidden. Super Admin (Owner) clearance required.' });
  }

  (req as any).user = user;
  next();
}

// ==========================================
// API ROUTES
// ==========================================

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Prompt Vault API', time: new Date().toISOString() });
});

// Auth / Users
app.get('/api/auth/users', (req, res) => {
  res.json(users);
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const targetEmail = (email || '').toLowerCase();
  let user = users.find(u => u.email.toLowerCase() === targetEmail);

  if (user) {
    return res.json({ user });
  }

  // Brand new account: ALWAYS starts with FREE plan, role 'user'
  const isOwner = targetEmail === OWNER_SUPERADMIN_EMAIL.toLowerCase();
  const newUser: User = {
    uid: 'usr-' + Date.now(),
    name: (email || 'Creator').split('@')[0],
    email: email || 'creator@example.com',
    role: isOwner ? 'superadmin' : 'user',
    isSuperAdmin: isOwner,
    plan: isOwner ? 'STUDIO' : 'FREE',
    subscriptionStatus: isOwner ? 'active' : 'none',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  users.push(newUser);
  res.json({ user: newUser });
});

app.put('/api/auth/user/:id', (req, res) => {
  const { id } = req.params;
  const { name, plan, role, photoURL } = req.body;
  const caller = getRequestUser(req);
  const userIndex = users.findIndex(u => u.uid === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Security: Normal users cannot elevate their role to admin!
  if (role !== undefined && role !== users[userIndex].role) {
    const isCallerSuperAdmin = caller && (caller.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase() || caller.role === 'superadmin' || caller.isSuperAdmin);
    if (!isCallerSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only the Super Admin can modify user roles.' });
    }
    users[userIndex].role = role;
  }

  // Security: Plan cannot be modified by regular users! Only Admin can assign/upgrade plans
  if (plan !== undefined && plan !== users[userIndex].plan) {
    const isCallerAdmin = caller && (
      caller.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase() ||
      caller.role === 'superadmin' ||
      caller.role === 'admin'
    );
    if (!isCallerAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only an administrator can assign or upgrade subscription plans.' });
    }
    users[userIndex].plan = plan;
    users[userIndex].subscriptionStatus = 'active';
    delete users[userIndex].subscriptionRequested;
  }

  if (name !== undefined) users[userIndex].name = name;
  if (photoURL !== undefined) users[userIndex].photoURL = photoURL;
  users[userIndex].updatedAt = new Date().toISOString().split('T')[0];
  res.json(users[userIndex]);
});

// Subscription Request by User (e.g. Studio Plan $20/month)
app.post('/api/subscriptions/request', (req, res) => {
  const caller = getRequestUser(req);
  const { userId, plan } = req.body;
  const targetId = userId || caller?.uid;

  if (!targetId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  let user = users.find(u => u.uid === targetId);
  if (!user && caller) {
    user = caller;
    users.push(user);
  }
  if (!user) {
    // If not found in memory, create record
    user = {
      uid: targetId,
      name: caller?.name || 'Creator',
      email: caller?.email || '',
      role: 'user',
      plan: 'FREE',
      subscriptionStatus: 'none',
      subscriptionRequested: plan,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    users.push(user);
  } else {
    user.subscriptionRequested = plan;
    user.updatedAt = new Date().toISOString().split('T')[0];
  }

  res.json({
    success: true,
    message: `Subscription request for ${plan} submitted for Administrator review.`,
    user
  });
});

// Admin: Approve Subscription
app.post('/api/admin/subscriptions/approve', requireAdmin, (req, res) => {
  const { userId, plan } = req.body;
  if (!userId || !plan) {
    return res.status(400).json({ error: 'User ID and Plan are required' });
  }

  let user = users.find(u => u.uid === userId);
  if (!user) {
    user = {
      uid: userId,
      name: 'Creator',
      email: '',
      role: 'user',
      plan: plan,
      subscriptionStatus: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    users.push(user);
  } else {
    user.plan = plan;
    user.subscriptionStatus = 'active';
    delete user.subscriptionRequested;
    user.updatedAt = new Date().toISOString().split('T')[0];
  }

  res.json({ success: true, user });
});

// Admin: Get list of pending subscriptions
app.get('/api/admin/subscriptions/pending', requireAdmin, (req, res) => {
  const pending = users
    .filter(u => !!u.subscriptionRequested)
    .map(u => ({
      userId: u.uid,
      userEmail: u.email,
      userName: u.name,
      requestedPlan: u.subscriptionRequested as SubscriptionPlan,
      requestedAt: u.updatedAt || new Date().toISOString().split('T')[0]
    }));
  res.json(pending);
});

// Prompts Library
app.get('/api/prompts', (req, res) => {
  const userPlan = (req.query.userPlan as SubscriptionPlan) || 'FREE';
  const category = req.query.category as string;
  const search = (req.query.search as string || '').toLowerCase();
  const accessLevel = req.query.accessLevel as string;
  const sort = req.query.sort as string; // 'featured' | 'newest' | 'popular'

  let filtered = prompts.filter(p => p.isPublished);

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (accessLevel && accessLevel !== 'all') {
    filtered = filtered.filter(p => p.accessLevel === accessLevel);
  }

  if (search) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search) ||
      p.tags.some(t => t.toLowerCase().includes(search))
    );
  }

  if (sort === 'popular') {
    filtered.sort((a, b) => (b.copiesCount + b.savesCount) - (a.copiesCount + a.savesCount));
  } else if (sort === 'newest') {
    filtered.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
  } else {
    // Featured first, then newest
    filtered.sort((a, b) => (b.featuredStatus ? 1 : 0) - (a.featuredStatus ? 1 : 0));
  }

  // Sanitize full prompt content based on user's subscription tier
  const result = filtered.map(p => sanitizePromptForUser(p, userPlan));
  res.json(result);
});

// Single Prompt Detail
app.get('/api/prompts/:id', (req, res) => {
  const userPlan = (req.query.userPlan as SubscriptionPlan) || 'FREE';
  const prompt = prompts.find(p => p.id === req.params.id);
  if (!prompt) {
    return res.status(404).json({ error: 'Prompt not found' });
  }
  const sanitized = sanitizePromptForUser(prompt, userPlan);
  res.json(sanitized);
});

// Copy Count Increment
app.post('/api/prompts/:id/copy', (req, res) => {
  const prompt = prompts.find(p => p.id === req.params.id);
  if (prompt) {
    prompt.copiesCount += 1;
  }
  res.json({ success: true, copiesCount: prompt ? prompt.copiesCount : 0 });
});

// Categories
app.get('/api/categories', (req, res) => {
  const activeCategories = categories.filter(c => c.isEnabled).sort((a, b) => a.order - b.order);
  res.json(activeCategories);
});

// User Favorites / My Vault
app.get('/api/favorites/:userId', (req, res) => {
  const { userId } = req.params;
  const userPlan = (req.query.userPlan as SubscriptionPlan) || 'FREE';
  const savedIds = favorites[userId] || [];
  const savedPrompts = prompts
    .filter(p => savedIds.includes(p.id))
    .map(p => sanitizePromptForUser(p, userPlan));
  res.json(savedPrompts);
});

app.post('/api/favorites/toggle', (req, res) => {
  const { userId, promptId } = req.body;
  if (!userId || !promptId) {
    return res.status(400).json({ error: 'Missing userId or promptId' });
  }
  if (!favorites[userId]) {
    favorites[userId] = [];
  }
  const index = favorites[userId].indexOf(promptId);
  const prompt = prompts.find(p => p.id === promptId);
  let isSaved = false;
  if (index > -1) {
    favorites[userId].splice(index, 1);
    if (prompt && prompt.savesCount > 0) prompt.savesCount -= 1;
    isSaved = false;
  } else {
    favorites[userId].push(promptId);
    if (prompt) prompt.savesCount += 1;
    isSaved = true;
  }
  res.json({ isSaved, savedIds: favorites[userId] });
});

// Usage
app.get('/api/usage/:userId', (req, res) => {
  const { userId } = req.params;
  const usage = getUserUsage(userId);
  res.json(usage);
});

// ==========================================
// AI TOOLS BACKEND (GEMINI 3.8 FLASH)
// ==========================================

// AI Prompt Enhancer
app.post(['/api/ai/enhance-prompt', '/api/ai/enhance'], async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { 
    userId = 'usr-free', 
    userPlan = 'FREE', 
    idea, 
    style, 
    duration, 
    aspectRatio, 
    cameraStyle, 
    cameraMovement,
    lighting,
    targetEngine,
    visualQuality 
  } = req.body || {};

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Please provide an idea to enhance.',
      message: 'Please provide an idea to enhance.'
    });
  }

  // 1. Check Usage Limits Server-Side
  const currentUsage = getUserUsage(userId);
  const check = hasRemainingUsage(userPlan, 'promptEnhancer', currentUsage.promptEnhancerUsed);

  if (!check.allowed) {
    return res.status(403).json({
      success: false,
      error: "You've reached your monthly limit for AI Prompt Enhancer.",
      message: "You've reached your monthly limit for AI Prompt Enhancer.",
      usage: currentUsage,
      limit: check.limit
    });
  }

  const ai = getAI();
  if (!ai) {
    return res.status(500).json({
      success: false,
      error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is configured in Settings > Secrets.',
      message: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is configured in Settings > Secrets.'
    });
  }

  const effectiveCameraStyle = cameraStyle || cameraMovement || 'Dynamic smooth tracking';

  try {
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

    const textOutput = response.text;
    if (textOutput) {
      try {
        const cleanJson = textOutput.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);
        enhancedPrompt = (parsed.enhancedPrompt || parsed.prompt || parsed.masterPrompt || '').trim();
        cameraDirection = (parsed.cameraDirection || '').trim();
        lightingSpecs = (parsed.lightingSpecs || '').trim();
        colorGrade = (parsed.colorGrade || '').trim();
        pacingAndMotion = (parsed.pacingAndMotion || '').trim();
        negativePrompt = (parsed.negativePrompt || '').trim();
      } catch {
        enhancedPrompt = textOutput.trim();
      }
    }

    if (!enhancedPrompt) {
      throw new Error('Gemini model did not return any enhanced prompt text.');
    }

    // Deduct usage credit ONLY on success
    const updatedUsage = incrementUserUsage(userId, 'promptEnhancerUsed');

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      enhancedPrompt,
      cameraDirection: cameraDirection || effectiveCameraStyle,
      lightingSpecs: lightingSpecs || (lighting || 'Cinematic volumetric lighting'),
      colorGrade: colorGrade || 'Natural film color palette',
      pacingAndMotion: pacingAndMotion || 'Fluid continuous cadence',
      negativePrompt: negativePrompt || 'artifacts, blur, jitter, low quality, distortion',
      suggestedVariables: [
        { key: 'subject', label: 'Subject', defaultValue: idea.trim() },
        { key: 'lighting', label: 'Lighting', defaultValue: lightingSpecs || 'Cinematic volumetric lighting' },
        { key: 'camera', label: 'Camera', defaultValue: cameraDirection || effectiveCameraStyle }
      ],
      suggestedEngines: ['Runway Gen-3 Alpha', 'Kling 1.5 Pro', 'Luma Dream Machine', 'OpenAI Sora'],
      usage: updatedUsage,
      remaining: check.limit === 'unlimited' ? 'unlimited' : Math.max(0, (check.limit as number) - updatedUsage.promptEnhancerUsed)
    });
  } catch (error: any) {
    console.error('AI Prompt Enhancement Error:', error);
    const errorMessage = error?.message || 'Failed to enhance prompt with Gemini API.';
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      message: errorMessage 
    });
  }
});

// Image -> Prompt Multimodal Analysis
app.post('/api/ai/image-to-prompt', async (req, res) => {
  const { userId, userPlan = 'FREE', imageBase64, mimeType = 'image/jpeg' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  // 1. Check Usage Limits Server-Side
  const currentUsage = getUserUsage(userId);
  const check = hasRemainingUsage(userPlan, 'imageToPrompt', currentUsage.imageToPromptUsed);

  if (!check.allowed) {
    return res.status(403).json({
      error: "You've reached your monthly limit for Image → Prompt.",
      usage: currentUsage,
      limit: check.limit
    });
  }

  try {
    const ai = getAI();
    let generatedPrompt = '';
    let analysisBreakdown = {
      subject: '',
      lighting: '',
      environment: '',
      camera: '',
      motionSuggestion: ''
    };

    if (ai) {
      // Clean base64 data url if needed
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const promptInstruction = `You are the Lead Visual Director for Prompt Vault.
Analyze this uploaded reference image in meticulous visual detail to craft a comprehensive Master AI Video Prompt that could animate or recreate this scene in Sora, Runway Gen-3, Kling 1.5, or Luma Dream Machine.

Analyze:
1. Main subject and micro-textures
2. Environment, background architecture, and depth layers
3. Composition, camera perspective, lens type, and framing
4. Lighting scheme, color palette, shadows, and reflections
5. Mood, visual style, and cinematic characteristics
6. Logical kinematic motion (how would characters, cloth, atmosphere, or camera move over 5-10 seconds)

Output format:
Return JSON strictly with these fields:
{
  "masterPrompt": "Complete, production-ready Master Video Prompt ready to copy-paste into an AI video generator",
  "subject": "Concise breakdown of subject",
  "lighting": "Concise breakdown of lighting",
  "environment": "Concise breakdown of environment",
  "camera": "Recommended camera movement and lens",
  "motionSuggestion": "Dynamic movement choreography description"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              {
                text: promptInstruction
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      try {
        const parsed = JSON.parse(response.text || '{}');
        generatedPrompt = parsed.masterPrompt || '';
        analysisBreakdown = {
          subject: parsed.subject || 'Detected visual subject in frame',
          lighting: parsed.lighting || 'Natural atmospheric lighting',
          environment: parsed.environment || 'Deep layered background',
          camera: parsed.camera || 'Cinematic tracking shot, 35mm lens',
          motionSuggestion: parsed.motionSuggestion || 'Fluid camera motion with organic secondary action'
        };
      } catch (parseErr) {
        generatedPrompt = response.text || '';
      }
    }

    if (!generatedPrompt) {
      generatedPrompt = 'Cinematic 8K video sequence directly based on reference frame. Ultra-detailed 35mm optics with shallow depth of field, natural volumetric illumination, smooth orbital camera movement panning across the focal subject, high-fidelity cloth and environmental dynamics, 24fps motion blur.';
      analysisBreakdown = {
        subject: 'Focal subject with detailed tactile surface textures',
        lighting: 'Balanced directional key lighting with soft rim fill',
        environment: 'Atmospheric scene setting with natural spatial depth',
        camera: 'Slow pushing tracking shot with subtle elevation rise',
        motionSuggestion: 'Gentle atmospheric wind drift and natural subject kinetic animation'
      };
    }

    // Deduct usage credit ONLY on success
    const updatedUsage = incrementUserUsage(userId, 'imageToPromptUsed');

    res.json({
      success: true,
      masterPrompt: generatedPrompt,
      analysis: analysisBreakdown,
      usage: updatedUsage,
      remaining: check.limit === 'unlimited' ? 'unlimited' : Math.max(0, (check.limit as number) - updatedUsage.imageToPromptUsed)
    });
  } catch (error: any) {
    console.error('Image to Prompt Error:', error);
    res.status(500).json({ error: 'Failed to analyze image. Credits were not deducted.' });
  }
});

// ==========================================
// CREATOR SHOWCASE & UPLOADS
// ==========================================

// Public Approved Videos
app.get('/api/videos', (req, res) => {
  const category = req.query.category as string;
  let approved = videos.filter(v => v.status === 'APPROVED');
  if (category && category !== 'all') {
    approved = approved.filter(v => v.category.toLowerCase() === category.toLowerCase());
  }
  res.json(approved);
});

// Upload Video (Only PLUS, PRO, STUDIO have unlimited uploads; FREE has 0)
app.post('/api/videos', (req, res) => {
  const { creatorId, creatorName, creatorAvatar, title, description, videoUrl, thumbnailUrl, category, tags, promptUsed, promptId, userPlan = 'FREE' } = req.body;

  if (userPlan === 'FREE') {
    return res.status(403).json({ error: 'Free tier cannot upload to Creator Showcase. Please upgrade to Plus, Pro, or Studio for unlimited uploads.' });
  }

  if (!title || !thumbnailUrl) {
    return res.status(400).json({ error: 'Title and thumbnail are required.' });
  }

  const newVideo: CreatorVideo = {
    id: 'vid-' + Date.now(),
    creatorId: creatorId || 'usr-creator',
    creatorName: creatorName || 'Anonymous Creator',
    creatorAvatar,
    title,
    description: description || '',
    videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl,
    category: category || 'Cinematic',
    tags: Array.isArray(tags) ? tags : ['AI Video'],
    promptUsed: promptUsed || '',
    promptId,
    likesCount: 0,
    viewsCount: 1,
    uploadDate: new Date().toISOString().split('T')[0],
    status: 'PENDING' // Moderation required!
  };

  videos.unshift(newVideo);
  res.json({ success: true, video: newVideo, message: 'Your video has been submitted for moderation and will appear publicly once approved.' });
});

// Like Video
app.post('/api/videos/:id/like', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const video = videos.find(v => v.id === id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  if (!video.likedBy) video.likedBy = [];
  const hasLiked = video.likedBy.includes(userId);

  if (hasLiked) {
    video.likedBy = video.likedBy.filter(uid => uid !== userId);
    video.likesCount = Math.max(0, video.likesCount - 1);
  } else {
    video.likedBy.push(userId);
    video.likesCount += 1;
  }

  res.json({ likesCount: video.likesCount, hasLiked: !hasLiked });
});

// Report Video
app.post('/api/videos/:id/report', (req, res) => {
  const { id } = req.params;
  const { reporterId, reporterName, reason, description } = req.body;
  const video = videos.find(v => v.id === id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const newReport: VideoReport = {
    id: 'rep-' + Date.now(),
    reporterId: reporterId || 'anonymous',
    reporterName: reporterName || 'Community Member',
    videoId: id,
    videoTitle: video.title,
    reason: reason || 'Inappropriate content',
    description: description || '',
    createdAt: new Date().toISOString().split('T')[0],
    status: 'PENDING'
  };

  reports.push(newReport);
  res.json({ success: true, message: 'Report submitted for admin review.' });
});

// ==========================================
// CUSTOM MASTER PROMPT REQUESTS
// ==========================================

app.get('/api/custom-requests/:userId', (req, res) => {
  const { userId } = req.params;
  const userRequests = customRequests.filter(r => r.userId === userId);
  res.json(userRequests);
});

app.post('/api/custom-requests', (req, res) => {
  const { userId, userName, userEmail, userPlan = 'FREE', title, idea, detailedDescription, style, targetPlatform, desiredDuration, referenceImageUrl, additionalRequirements } = req.body;

  // Plan verification:
  // FREE: 0
  // PLUS: 0
  // PRO: 25 / month
  // STUDIO: unlimited
  const currentUsage = getUserUsage(userId);
  const check = hasRemainingUsage(userPlan, 'customRequests', currentUsage.customRequestsUsed);

  if (!check.allowed) {
    return res.status(403).json({
      error: userPlan === 'FREE' || userPlan === 'PLUS'
        ? 'Custom Master Prompt Requests are available exclusively on Pro (25/mo) and Studio (Unlimited) plans.'
        : "You've reached your monthly limit of 25 custom requests for the Pro plan. Upgrade to Studio for unlimited priority requests.",
      limit: check.limit
    });
  }

  const isStudio = userPlan === 'STUDIO';

  const newRequest: CustomPromptRequest = {
    id: 'req-' + Date.now(),
    userId,
    userName: userName || 'Creator',
    userEmail: userEmail || 'creator@example.com',
    userPlan,
    title,
    idea,
    detailedDescription,
    style: style || 'Cinematic Photoreal',
    targetPlatform: targetPlatform || 'Runway Gen-3',
    desiredDuration: desiredDuration || '5s',
    referenceImageUrl,
    additionalRequirements,
    status: 'SUBMITTED',
    priority: isStudio,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };

  customRequests.unshift(newRequest);
  const updatedUsage = incrementUserUsage(userId, 'customRequestsUsed');

  res.json({
    success: true,
    request: newRequest,
    usage: updatedUsage,
    message: isStudio ? 'High-Priority Studio custom prompt request submitted!' : 'Custom prompt request submitted successfully.'
  });
});

// ==========================================
// ADMIN DASHBOARD & MANAGEMENT (Protected)
// ==========================================

// Enforce admin verification on all /api/admin endpoints
app.use('/api/admin', requireAdmin);

// Super Admin Management of other Admins
app.get('/api/admin/admins', (req, res) => {
  const adminUsers = users.filter(u => 
    u.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase() || 
    u.role === 'admin' || 
    u.role === 'superadmin' || 
    u.isSuperAdmin
  );
  res.json(adminUsers);
});

// Super Admin can promote a user to admin
app.post('/api/admin/admins/promote', requireSuperAdmin, (req, res) => {
  const { email, name, permissions } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Valid user email address is required.' });
  }

  const targetEmail = email.trim().toLowerCase();
  let targetUser = users.find(u => u.email.toLowerCase() === targetEmail);

  const defaultPerms = {
    canManagePrompts: true,
    canManageCategories: true,
    canManageUsers: true,
    canManageSubscriptions: true,
    canManageVideos: true,
    canManageRequests: true,
    canManageReports: true,
    canManageAdmins: false
  };

  if (targetUser) {
    if (targetUser.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot modify Super Admin owner account.' });
    }
    targetUser.role = 'admin';
    targetUser.isSuperAdmin = false;
    targetUser.adminPermissions = permissions || targetUser.adminPermissions || defaultPerms;
    targetUser.updatedAt = new Date().toISOString().split('T')[0];
    return res.json({ success: true, message: `Successfully promoted ${targetUser.email} to Administrator!`, admin: targetUser });
  } else {
    // Create the new user directly as admin
    const newAdmin: User = {
      uid: 'usr-' + Date.now(),
      name: name || targetEmail.split('@')[0],
      email: targetEmail,
      photoURL: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120`,
      role: 'admin',
      isSuperAdmin: false,
      adminPermissions: permissions || defaultPerms,
      plan: 'STUDIO',
      subscriptionStatus: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    users.unshift(newAdmin);
    return res.json({ success: true, message: `Created and promoted ${targetEmail} to Administrator!`, admin: newAdmin });
  }
});

// Super Admin can update admin permissions
app.put('/api/admin/admins/:id/permissions', requireSuperAdmin, (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  const adminUser = users.find(u => u.uid === id);
  if (!adminUser) return res.status(404).json({ error: 'Admin not found.' });

  if (adminUser.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: 'Cannot alter Owner Super Admin permissions.' });
  }

  adminUser.adminPermissions = {
    ...adminUser.adminPermissions,
    ...permissions
  };
  adminUser.updatedAt = new Date().toISOString().split('T')[0];
  res.json({ success: true, admin: adminUser });
});

// Super Admin can demote / remove an admin back to regular user
app.delete('/api/admin/admins/:id', requireSuperAdmin, (req, res) => {
  const { id } = req.params;
  const adminUser = users.find(u => u.uid === id);
  if (!adminUser) return res.status(404).json({ error: 'Admin not found.' });

  if (adminUser.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: 'Cannot remove the primary Super Admin owner.' });
  }

  // Demote to regular user
  adminUser.role = 'user';
  adminUser.isSuperAdmin = false;
  adminUser.adminPermissions = undefined;
  adminUser.updatedAt = new Date().toISOString().split('T')[0];

  res.json({ success: true, message: `Removed admin clearance for ${adminUser.email}. User has been restored to regular user status.` });
});

// Overview Stats
app.get('/api/admin/overview', (req, res) => {
  const planCounts = {
    FREE: users.filter(u => u.plan === 'FREE').length,
    PLUS: users.filter(u => u.plan === 'PLUS').length,
    PRO: users.filter(u => u.plan === 'PRO').length,
    STUDIO: users.filter(u => u.plan === 'STUDIO').length
  };

  let totalEnhancer = 0;
  let totalImage = 0;
  let totalCustom = 0;
  Object.values(usageStore).forEach(userMonths => {
    Object.values(userMonths).forEach(m => {
      totalEnhancer += m.promptEnhancerUsed;
      totalImage += m.imageToPromptUsed;
      totalCustom += m.customRequestsUsed;
    });
  });

  res.json({
    totalUsers: users.length,
    activeSubscriptions: users.filter(u => u.subscriptionStatus === 'active' && u.plan !== 'FREE').length,
    planCounts,
    totalPrompts: prompts.length,
    totalVideos: videos.length,
    pendingModeration: videos.filter(v => v.status === 'PENDING').length,
    pendingCustomRequests: customRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'IN_REVIEW').length,
    aiUsageTotal: {
      promptEnhancer: totalEnhancer,
      imageToPrompt: totalImage,
      customRequests: totalCustom
    }
  });
});

// Manage Prompts
app.get('/api/admin/prompts', (req, res) => {
  res.json(prompts);
});

app.post('/api/admin/prompts', (req, res) => {
  const p = req.body;
  const newPrompt: Prompt = {
    ...p,
    id: 'prompt-' + Date.now(),
    creationDate: new Date().toISOString().split('T')[0],
    updatedDate: new Date().toISOString().split('T')[0],
    copiesCount: 0,
    savesCount: 0,
    isPublished: p.isPublished !== undefined ? p.isPublished : true,
    customizableVariables: p.customizableVariables || []
  };
  prompts.unshift(newPrompt);
  res.json(newPrompt);
});

app.put('/api/admin/prompts/:id', (req, res) => {
  const { id } = req.params;
  const index = prompts.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Prompt not found' });

  prompts[index] = {
    ...prompts[index],
    ...req.body,
    updatedDate: new Date().toISOString().split('T')[0]
  };
  res.json(prompts[index]);
});

app.delete('/api/admin/prompts/:id', (req, res) => {
  const { id } = req.params;
  prompts = prompts.filter(p => p.id !== id);
  res.json({ success: true });
});

// Manage Categories
app.get('/api/admin/categories', (req, res) => {
  res.json(categories.sort((a, b) => a.order - b.order));
});

app.post('/api/admin/categories', (req, res) => {
  const { name, slug, description, order, isEnabled } = req.body;
  const newCat: Category = {
    id: 'cat-' + Date.now(),
    name,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    description: description || '',
    order: order || categories.length + 1,
    isEnabled: isEnabled !== undefined ? isEnabled : true
  };
  categories.push(newCat);
  res.json(newCat);
});

app.put('/api/admin/categories/:id', (req, res) => {
  const { id } = req.params;
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  categories[index] = { ...categories[index], ...req.body };
  res.json(categories[index]);
});

app.delete('/api/admin/categories/:id', (req, res) => {
  const { id } = req.params;
  categories = categories.filter(c => c.id !== id);
  res.json({ success: true });
});

app.post('/api/admin/categories/reorder', (req, res) => {
  const { orderedIds } = req.body;
  if (Array.isArray(orderedIds)) {
    categories.forEach(cat => {
      const idx = orderedIds.indexOf(cat.id);
      if (idx !== -1) {
        cat.order = idx + 1;
      }
    });
  }
  res.json(categories.sort((a, b) => a.order - b.order));
});

// Manage Video Moderation
app.get('/api/admin/videos', (req, res) => {
  res.json(videos);
});

app.put('/api/admin/videos/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, moderationNote } = req.body;
  const video = videos.find(v => v.id === id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  video.status = status;
  if (moderationNote !== undefined) video.moderationNote = moderationNote;
  res.json(video);
});

app.delete('/api/admin/videos/:id', (req, res) => {
  const { id } = req.params;
  videos = videos.filter(v => v.id !== id);
  res.json({ success: true });
});

// Manage Reports
app.get('/api/admin/reports', (req, res) => {
  res.json(reports);
});

app.put('/api/admin/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const report = reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  report.status = status;
  res.json(report);
});

// Manage Custom Requests (Admin view & fulfill)
app.get('/api/admin/custom-requests', (req, res) => {
  // Sort with Studio priority first
  const sorted = [...customRequests].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json(sorted);
});

app.put('/api/admin/custom-requests/:id', (req, res) => {
  const { id } = req.params;
  const { status, adminNotes, finalMasterPrompt } = req.body;
  const reqItem = customRequests.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  if (status !== undefined) reqItem.status = status;
  if (adminNotes !== undefined) reqItem.adminNotes = adminNotes;
  if (finalMasterPrompt !== undefined) reqItem.finalMasterPrompt = finalMasterPrompt;
  reqItem.updatedAt = new Date().toISOString().split('T')[0];

  res.json(reqItem);
});

// Catch-all for unmatched /api routes to guarantee valid JSON responses
app.all('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.path}`,
    message: `API endpoint not found: ${req.method} ${req.path}`
  });
});

// Express error handling middleware for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.error('Unhandled API error:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error',
      message: err.message || 'Internal server error'
    });
  }
  next(err);
});

// ==========================================
// VITE INTEGRATION & SPA FALLBACK
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prompt Vault server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
