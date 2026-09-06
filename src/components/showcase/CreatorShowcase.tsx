import React, { useState } from 'react';
import { CreatorVideo } from '../../types';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { 
  Play, Heart, Flag, Copy, Check, Plus, Video, Sparkles, 
  X, AlertTriangle, ChevronRight, User, Eye, UploadCloud
} from 'lucide-react';

interface CreatorShowcaseProps {
  videos: CreatorVideo[];
  onRefreshVideos: () => void;
  onOpenPricing: () => void;
}

export const CreatorShowcase: React.FC<CreatorShowcaseProps> = ({
  videos,
  onRefreshVideos,
  onOpenPricing
}) => {
  const { user, showToast } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<CreatorVideo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [likedVideoIds, setLikedVideoIds] = useState<Record<string, boolean>>({});

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [videoToReport, setVideoToReport] = useState<CreatorVideo | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDescription, setReportDescription] = useState('');

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadVideoUrl, setUploadVideoUrl] = useState('');
  const [uploadThumbUrl, setUploadThumbUrl] = useState('');
  const [uploadModel, setUploadModel] = useState('Runway Gen-3 Alpha');
  const [uploadCategory, setUploadCategory] = useState('Cinematic');
  const [uploadPromptUsed, setUploadPromptUsed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['all', 'Cinematic', 'Sci-Fi', 'Nature', 'Commercial', 'Fantasy', 'Horror'];

  const filteredVideos = activeCategory === 'all'
    ? videos
    : videos.filter(v => v.category.toLowerCase() === activeCategory.toLowerCase());

  const handleCopyPrompt = (e: React.MouseEvent, promptText: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    showToast('Prompt copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLike = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to like creator videos.');
      return;
    }
    const res = await api.likeVideo(videoId, user.uid);
    setLikedVideoIds(prev => ({ ...prev, [videoId]: res.hasLiked }));
    onRefreshVideos();
  };

  const handleOpenReport = (e: React.MouseEvent, video: CreatorVideo) => {
    e.stopPropagation();
    setVideoToReport(video);
    setReportReason('Inappropriate or NSFW content');
    setReportDescription('');
    setIsReportOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!videoToReport) return;
    try {
      await api.reportVideo({
        videoId: videoToReport.id,
        reporterId: user?.uid || 'anonymous',
        reporterName: user?.name || 'Community Member',
        reason: reportReason,
        description: reportDescription
      });
      showToast('Report submitted for moderation review.');
      setIsReportOpen(false);
      setVideoToReport(null);
    } catch (e) {
      showToast('Failed to submit report.');
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadPromptUsed.trim()) {
      showToast('Please provide a title and the prompt used.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.uploadVideo({
        title: uploadTitle.trim(),
        videoUrl: uploadVideoUrl.trim() || 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-look-of-a-man-in-a-neon-city-42618-large.mp4',
        thumbnailUrl: uploadThumbUrl.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
        aiGeneratorModel: uploadModel,
        category: uploadCategory,
        promptUsed: uploadPromptUsed.trim(),
        creatorId: user?.uid || 'usr-free',
        creatorName: user?.name || 'Creator',
        creatorAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        userPlan: user?.plan || 'FREE'
      });

      showToast('Video published to Community Showcase!');
      setIsUploadOpen(false);
      // Reset form
      setUploadTitle('');
      setUploadPromptUsed('');
      setUploadVideoUrl('');
      setUploadThumbUrl('');
      onRefreshVideos();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit video');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Gallery</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
            Creator Showcase
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Real AI-generated videos created by members using Prompt Vault Master Prompts. Inspect the prompt behind every render.
          </p>
        </div>

        <button
          id="showcase-submit-btn"
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Your Video</span>
        </button>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat === 'all' ? 'All Videos' : cat}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => {
          const hasLiked = likedVideoIds[video.id] || false;
          return (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0A101E] overflow-hidden hover:border-cyan-500/40 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              {/* Media Thumbnail with hover play icon */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-3.5 rounded-full bg-cyan-500 text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* AI Generator Model Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                    {video.aiGeneratorModel}
                  </span>
                </div>

                {/* Category badge */}
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/70 text-slate-200 backdrop-blur-md">
                    {video.category}
                  </span>
                </div>

                {/* Report trigger icon */}
                <button
                  onClick={(e) => handleOpenReport(e, video)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-slate-400 hover:text-rose-400 hover:bg-black/80 transition-colors"
                  title="Report video"
                >
                  <Flag className="w-3 h-3" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-400 font-display">
                    {video.title}
                  </h3>

                  {/* Prompt snippet */}
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 bg-slate-50 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                    "{video.promptUsed}"
                  </p>
                </div>

                {/* Creator info & stats */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={video.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={video.creatorName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {video.creatorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleLike(e, video.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        hasLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="text-[11px]">{video.likesCount + (hasLiked ? 1 : 0)}</span>
                    </button>

                    <button
                      onClick={(e) => handleCopyPrompt(e, video.promptUsed, video.id)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-400"
                      title="Copy prompt used"
                    >
                      {copiedId === video.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Full Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video player container */}
            <div className="relative aspect-video w-full bg-black">
              <video
                src={selectedVideo.videoUrl}
                poster={selectedVideo.thumbnailUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video info */}
            <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                    {selectedVideo.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {selectedVideo.aiGeneratorModel}
                    </span>
                    <span className="text-xs text-slate-400">
                      Category: {selectedVideo.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleLike(e, selectedVideo.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 hover:border-rose-500 flex items-center gap-1.5 text-rose-400"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>{selectedVideo.likesCount} Likes</span>
                </button>
              </div>

              {/* Full prompt used box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display">
                    Prompt Used for Generation
                  </span>
                  <button
                    onClick={(e) => handleCopyPrompt(e, selectedVideo.promptUsed, 'modal')}
                    className="text-xs text-cyan-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Prompt</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800">
                  {selectedVideo.promptUsed}
                </div>
              </div>

              {/* Creator details */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={selectedVideo.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={selectedVideo.creatorName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedVideo.creatorName}
                    </p>
                    <p className="text-[11px] text-slate-400">Creator Community Member</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleOpenReport(e, selectedVideo)}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report content</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Upload Video Modal */}
      {isUploadOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsUploadOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Submit Video to Creator Showcase
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVideo} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Video Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Alley Tracking Shot"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    AI Generator Model
                  </label>
                  <select
                    value={uploadModel}
                    onChange={(e) => setUploadModel(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Runway Gen-3 Alpha">Runway Gen-3 Alpha</option>
                    <option value="Kling 1.5 Pro">Kling 1.5 Pro</option>
                    <option value="Luma Dream Machine">Luma Dream Machine</option>
                    <option value="OpenAI Sora">OpenAI Sora</option>
                    <option value="Minimax Hailuo">Minimax Hailuo</option>
                    <option value="Pika 2.0">Pika 2.0</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cinematic">Cinematic</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Nature">Nature</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Horror">Horror</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Prompt Used
                </label>
                <textarea
                  required
                  rows={3}
                  value={uploadPromptUsed}
                  onChange={(e) => setUploadPromptUsed(e.target.value)}
                  placeholder="Paste the exact prompt that generated this video..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Video URL (MP4 / WebM direct link)
                </label>
                <input
                  type="url"
                  value={uploadVideoUrl}
                  onChange={(e) => setUploadVideoUrl(e.target.value)}
                  placeholder="https://assets.mixkit.co/... (Leave blank for sample video)"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish to Showcase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportOpen && videoToReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsReportOpen(false)}
        >
          <div 
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Report Content
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reporting video: <span className="font-semibold text-slate-300">"{videoToReport.title}"</span>. Our moderation team reviews flagged items.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for flag
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Inappropriate or NSFW content">Inappropriate or NSFW content</option>
                  <option value="Violent or harmful depictions">Violent or harmful depictions</option>
                  <option value="Misleading or broken link">Misleading or broken link</option>
                  <option value="Copyright infringement">Copyright infringement</option>
                  <option value="Other concern">Other concern</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
