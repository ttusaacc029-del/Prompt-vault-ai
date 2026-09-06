import React, { useState, useRef } from 'react';
import { useAuth } from '../../lib/authContext';
import { SUBSCRIPTION_PLANS } from '../../lib/plans';
import { api } from '../../lib/api';
import { 
  Image as ImageIcon, Upload, RefreshCw, Copy, Check, FolderLock, 
  Sparkles, AlertCircle, Camera, Sun, Compass, Play, Eye
} from 'lucide-react';

interface ImageToPromptProps {
  onOpenPricing: () => void;
}

export const ImageToPrompt: React.FC<ImageToPromptProps> = ({ onOpenPricing }) => {
  const { user, usage, refreshUsage, showToast } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Result state
  const [analysisResult, setAnalysisResult] = useState<{
    masterPrompt: string;
    analysis: {
      subject: string;
      lighting: string;
      environment: string;
      camera: string;
      motionSuggestion: string;
    };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const userPlan = user?.plan || 'FREE';
  const planConfig = SUBSCRIPTION_PLANS[userPlan];
  const monthlyLimit = planConfig.imageToPrompt;
  const usedCount = usage?.imageToPromptUsed || 0;
  const isUnlimited = monthlyLimit === 'unlimited';
  const remainingCount = isUnlimited ? 'unlimited' : Math.max(0, (monthlyLimit as number) - usedCount);
  const isLimitReached = !isUnlimited && (remainingCount as number) <= 0;

  // Curated demo reference images for quick 1-click test
  const demoSamples = [
    {
      label: 'Cyberpunk Geisha',
      url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
    },
    {
      label: 'Nebula Astral Portal',
      url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80'
    },
    {
      label: 'Vintage 70s Sports Car',
      url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80'
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setSelectedImage(resultStr);
      setImagePreviewUrl(resultStr);
      setAnalysisResult(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (url: string) => {
    setImagePreviewUrl(url);
    setSelectedImage(url);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMessage('Please upload or select a reference image.');
      return;
    }
    if (isLimitReached) {
      setErrorMessage("You've reached your monthly Image-to-Prompt limit. Please upgrade your plan.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.imageToPrompt({
        userId: user?.uid || 'usr-free',
        userPlan,
        imageBase64: selectedImage,
        mimeType: 'image/jpeg'
      });

      setAnalysisResult({
        masterPrompt: res.masterPrompt,
        analysis: res.analysis
      });
      await refreshUsage();
      showToast('Master video prompt generated from image!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult?.masterPrompt) return;
    navigator.clipboard.writeText(analysisResult.masterPrompt);
    setCopied(true);
    showToast('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Quota Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Image → Prompt Credits
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              {isUnlimited
                ? `Unlimited on ${userPlan} Plan (${usedCount} analyzed this month)`
                : `${usedCount} / ${monthlyLimit} used (${remainingCount} remaining)`}
            </p>
          </div>
        </div>

        {!isUnlimited && (
          <div className="flex items-center gap-3">
            <div className="w-32 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isLimitReached ? 'bg-rose-500' : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(100, (usedCount / (monthlyLimit as number)) * 100)}%` }}
              />
            </div>
            {isLimitReached && (
              <button
                onClick={onOpenPricing}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold text-black bg-amber-400 hover:bg-amber-300 transition-colors"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload & Preview Column */}
        <div className="lg:col-span-5 space-y-5 p-6 rounded-2xl bg-white dark:bg-[#090F1C] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                Reference Image Upload
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload a concept visual to extract cinematic lighting, camera angles, and kinetic video prompts.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative aspect-[16/10] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden transition-all ${
                imagePreviewUrl
                  ? 'border-purple-500/50 bg-slate-900'
                  : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-slate-50 dark:bg-slate-900/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreviewUrl ? (
                <>
                  <img
                    src={imagePreviewUrl}
                    alt="Reference"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-bold text-white bg-black/70 px-3 py-1.5 rounded-lg">
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 w-fit mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to browse or drop an image
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Supports JPG, PNG, WEBP up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Quick Demo Stills */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Or try a test reference still:
              </span>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {demoSamples.map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(demo.url)}
                    className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-purple-400 group"
                  >
                    <img src={demo.url} alt={demo.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-black/50 text-[9px] font-bold text-white flex items-center justify-center p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {demo.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || isLimitReached || !imagePreviewUrl}
            className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isLimitReached || !imagePreviewUrl
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/20'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing visual parameters...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Reverse Engineer to Video Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 flex flex-col p-6 rounded-2xl bg-white dark:bg-[#090F1C] border border-slate-200 dark:border-slate-800 shadow-sm justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-display flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optical Breakdown & Kinetic Prompt</span>
              </span>
              {analysisResult && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Gemini 3.8 Flash Vision
                </span>
              )}
            </div>

            {analysisResult ? (
              <div className="space-y-4 mt-4">
                
                {/* Master Video Prompt */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                    Generated Master Video Prompt
                  </label>
                  <div className="p-4 rounded-xl bg-slate-900 text-purple-200 font-mono text-xs sm:text-sm leading-relaxed border border-purple-500/30">
                    {analysisResult.masterPrompt}
                  </div>
                </div>

                {/* Structured Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Subject Dissection</span>
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      {analysisResult.analysis.subject}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lighting & Atmosphere</span>
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      {analysisResult.analysis.lighting}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      <span>Camera Optics & Angle</span>
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      {analysisResult.analysis.camera}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Video Motion Suggestion</span>
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      {analysisResult.analysis.motionSuggestion}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-24 text-center space-y-3">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 w-fit mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No image analyzed yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Upload an image on the left to extract full cinematic prompt parameters ready for Runway, Kling, or Sora.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          {analysisResult && (
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-analyze</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Video Prompt'}</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
