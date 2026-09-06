import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Link2, 
  Eye, 
  ExternalLink,
  FileImage,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { uploadPromptThumbnail } from '../../lib/firebase';

interface ThumbnailUploaderProps {
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  disabled?: boolean;
}

export const ThumbnailUploader: React.FC<ThumbnailUploaderProps> = ({
  currentUrl = '',
  onUrlChange,
  disabled = false
}) => {
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ fileName: string; size: string } | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [manualUrlInput, setManualUrlInput] = useState('');

  // Enforce Administrator access
  if (!isAdmin) {
    return (
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        Thumbnail uploads are restricted to authorized Administrators.
      </div>
    );
  }

  const validateFile = (file: File): string | null => {
    const validMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif'
    ];
    if (!validMimeTypes.includes(file.type.toLowerCase())) {
      return 'Invalid file format. Please choose a JPEG, PNG, WEBP, GIF, or AVIF image.';
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      return `File size is ${mb}MB. Maximum permitted size is 10MB.`;
    }

    return null;
  };

  const processAndUploadFile = async (file: File) => {
    setErrorMessage(null);
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    // Create immediate local object URL for instant preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);
    setUploadProgress(0);

    const fileSizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    try {
      // Direct upload to Firebase Storage
      const downloadUrl = await uploadPromptThumbnail(file, (percent) => {
        setUploadProgress(percent);
      });

      // Update parent prompt form state with new storage URL
      onUrlChange(downloadUrl);
      setSuccessInfo({
        fileName: file.name,
        size: fileSizeStr
      });
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Upload failed:', err);
      // If Firebase Storage encounters bucket initialization issue, fallback to high-res data URL
      const isConfigOrNetworkIssue = err?.message?.includes('Storage') || err?.message?.includes('bucket') || err?.message?.includes('network');
      
      if (isConfigOrNetworkIssue) {
        // Fallback: Read as base64 data URL so Admin is never blocked from saving their prompt
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onUrlChange(base64);
          setSuccessInfo({
            fileName: file.name + ' (Direct Asset)',
            size: fileSizeStr
          });
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      setErrorMessage(err.message || 'Failed to upload image to Firebase Storage.');
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
    // Reset file input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleRemoveImage = () => {
    onUrlChange('');
    setLocalPreview(null);
    setSuccessInfo(null);
    setErrorMessage(null);
    setManualUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerPicker = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrlInput.trim()) {
      onUrlChange(manualUrlInput.trim());
      setSuccessInfo(null);
      setLocalPreview(null);
      setErrorMessage(null);
    }
  };

  const effectivePreview = localPreview || currentUrl;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
          Master Prompt Thumbnail
        </label>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`font-semibold transition-colors ${
              mode === 'upload' 
                ? 'text-cyan-500 underline underline-offset-4' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Firebase Storage Upload
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`font-semibold transition-colors ${
              mode === 'url' 
                ? 'text-cyan-500 underline underline-offset-4' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Paste Direct URL
          </button>
        </div>
      </div>

      {/* Hidden File Input for Device Image Selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Mode 1: Firebase Storage File Upload */}
      {mode === 'upload' && (
        <div className="space-y-2">
          {!effectivePreview ? (
            /* Upload Dropzone & Button */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleTriggerPicker}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:border-cyan-500/60 hover:bg-slate-100 dark:hover:bg-slate-900'
              } ${isUploading || disabled ? 'pointer-events-none opacity-80' : ''}`}
            >
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/20">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-cyan-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {isUploading 
                      ? `Uploading to Firebase Storage... (${uploadProgress}%)` 
                      : 'Click to select from device, or drag & drop'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    PNG, JPG, WEBP, GIF, or AVIF (Up to 10MB)
                  </p>
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerPicker();
                    }}
                    className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Upload Thumbnail</span>
                  </button>
                )}

                {/* Real-time Progress Bar */}
                {isUploading && (
                  <div className="w-full max-w-xs mt-3 space-y-1.5">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
                        style={{ width: `${Math.max(5, uploadProgress)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Sending to Cloud Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Image Preview & Replacement Controls */
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 group shadow-inner">
                <img
                  src={effectivePreview}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Active Thumbnail
                  </span>
                  {currentUrl.includes('firebasestorage') && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/80 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Firebase Storage
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={handleTriggerPicker}
                    disabled={isUploading}
                    className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    className="px-3.5 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Progress overlay when replacing */}
              {isUploading && (
                <div className="space-y-1.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      Uploading new version...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Metadata Info & Action Buttons */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2 overflow-hidden text-slate-500 dark:text-slate-400 text-[11px]">
                  <FileImage className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span className="truncate max-w-[220px]">
                    {successInfo?.fileName || (currentUrl.startsWith('data:') ? 'Image from device' : currentUrl)}
                  </span>
                  {successInfo?.size && (
                    <span className="font-mono text-slate-400">({successInfo.size})</span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTriggerPicker}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Direct URL Fallback Option */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                value={manualUrlInput || currentUrl}
                onChange={(e) => {
                  setManualUrlInput(e.target.value);
                  onUrlChange(e.target.value);
                }}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            {currentUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                title="Clear URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {currentUrl && (
            <div className="relative aspect-video w-48 rounded-lg overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
              <img src={currentUrl} alt="URL Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Error Message with Dismiss/Retry */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">{errorMessage}</p>
            <button
              type="button"
              onClick={handleTriggerPicker}
              className="text-[11px] underline underline-offset-2 hover:text-rose-300 font-bold"
            >
              Choose another image file
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
