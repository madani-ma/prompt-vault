import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  Sparkles,
  Layers,
  Database
} from 'lucide-react';
import { Category, Platform, PromptItem } from '../types';
import { sortPromptsNewestFirst } from '../utils/sorting';

interface AdminPageProps {
  onNavigateHome?: () => void;
}

const CATEGORIES: Exclude<Category, 'All'>[] = [
  'Cinematic',
  'Reel',
  'Comedy',
  'Product',
  'Character',
  'Sci-Fi',
  'Streetstyle',
  'Nature',
];

const PLATFORMS: Exclude<Platform, 'All'>[] = [
  'Instagram Reel',
  'TikTok',
  'YouTube Shorts',
];

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateHome }) => {
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<Category, 'All'>>('Cinematic');
  const [platform, setPlatform] = useState<Exclude<Platform, 'All'>>('Instagram Reel');
  const [promptType, setPromptType] = useState<'Image Prompt' | 'Video Prompt'>('Image Prompt');
  const [promptText, setPromptText] = useState('');
  
  // Optional Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  
  // Optional Advanced Details
  const [model, setModel] = useState('Midjourney v6.1 / Flux.1');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [howToUse, setHowToUse] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live prompts inspection
  const [recentPrompts, setRecentPrompts] = useState<PromptItem[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Fetch prompts to show live database state
  const loadRecentPrompts = async () => {
    setIsLoadingPrompts(true);
    try {
      const res = await fetch('/api/prompts', {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (res.ok) {
        const rawText = await res.text();
        let data: any = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch (parseErr) {
          console.warn('[Admin] Non-JSON response in loadRecentPrompts:', parseErr);
        }
        if (Array.isArray(data)) {
          setRecentPrompts(sortPromptsNewestFirst(data));
          return;
        }
      }
      // Fallback: check localStorage for any recently added custom prompts
      const saved = localStorage.getItem('prompt_vault_custom_prompts_v6');
      if (saved) {
        try {
          const parsedSaved = JSON.parse(saved);
          if (Array.isArray(parsedSaved)) {
            setRecentPrompts(sortPromptsNewestFirst(parsedSaved));
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error('Error fetching prompts for admin:', err);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  useEffect(() => {
    loadRecentPrompts();
  }, []);

  // Update default model when promptType changes
  const handleTypeChange = (newType: 'Image Prompt' | 'Video Prompt') => {
    setPromptType(newType);
    if (newType === 'Video Prompt' && model.includes('Midjourney')) {
      setModel('Runway Gen-3 / Luma Dream Machine');
    } else if (newType === 'Image Prompt' && model.includes('Runway')) {
      setModel('Midjourney v6.1 / Flux.1');
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    // Limit check: 12MB client check
    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 12MB. Please choose a smaller image.');
      return;
    }

    setErrorMessage(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Please provide a title for the prompt.');
      return;
    }

    if (!promptText.trim()) {
      setErrorMessage('Please provide the prompt text.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Determine image URL
    let resolvedImageUrl: string | undefined = undefined;
    if (imageInputMode === 'upload' && imagePreview) {
      resolvedImageUrl = imagePreview;
    } else if (imageInputMode === 'url' && imageUrlInput.trim()) {
      resolvedImageUrl = imageUrlInput.trim();
    }

    const payload = {
      title: title.trim(),
      category,
      platform,
      type: promptType === 'Video Prompt' ? 'video' : 'image',
      prompt: promptText.trim(),
      imageUrl: resolvedImageUrl,
      model: model.trim() || (promptType === 'Video Prompt' ? 'Runway Gen-3 / Luma Dream Machine' : 'Midjourney v6.1 / Flux.1'),
      aspectRatio: aspectRatio.trim() || '9:16',
      howToUse: howToUse.trim() || (promptType === 'Video Prompt' ? 'Use in your favorite AI video generator.' : 'Copy and paste this prompt into your preferred AI generator.'),
      submittedBy: '@Admin',
    };

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      let result: any = null;
      try {
        result = rawText ? JSON.parse(rawText) : null;
      } catch (parseErr) {
        console.warn('[Admin] Non-JSON response received from /api/prompts:', parseErr, rawText);
      }

      if (!response.ok) {
        const errorMsg = result?.error
          || (result?.details ? `${result.error}: ${result.details}` : null)
          || (rawText ? `Server Error (${response.status}): ${rawText.slice(0, 150)}` : `Server returned HTTP status ${response.status}`);
        throw new Error(errorMsg);
      }

      const nowIso = new Date().toISOString();
      const returnedPrompt = result?.prompt || {
        ...payload,
        id: `prompt-${Date.now()}-${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`,
        dateAdded: nowIso.split('T')[0],
        createdAt: nowIso,
      };

      // Client-side persistence backup: save to localStorage so it stays live across sessions/restarts
      try {
        const existingRaw = localStorage.getItem('prompt_vault_custom_prompts_v6');
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        const updatedList = [returnedPrompt, ...existingList.filter((p: any) => p.id !== returnedPrompt.id)];
        localStorage.setItem('prompt_vault_custom_prompts_v6', JSON.stringify(updatedList));
      } catch (storageErr) {
        console.warn('Could not save to localStorage:', storageErr);
      }

      // Success: clear form fields
      setTitle('');
      setPromptText('');
      removeImage();
      setHowToUse('');
      const storageNotice = result?.storage ? ` [saved to ${result.storage}]` : '';
      setSuccessMessage(`Prompt "${payload.title}" was successfully published live!${storageNotice} Ready for next prompt.`);

      // Focus back on title for fast sequential entry
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);

      // Refresh live prompts list
      loadRecentPrompts();
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'Network error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigate home
  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#84cc16] selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={handleGoHome}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Public Website"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Main Site</span>
            </a>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse" />
              <h1 className="text-sm font-black uppercase tracking-wider text-white">
                Prompt Vault · Admin
              </h1>
              <span className="text-[10px] font-mono uppercase bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20 px-2 py-0.5 rounded-full font-bold">
                Direct /api/prompts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Intro Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Add New Prompt
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Directly publishes prompts to the cloud repository. Newly submitted prompts appear immediately on the main public website without rebuild or redeploy.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50 text-xs font-mono text-slate-300">
              <Database className="w-3.5 h-3.5 text-[#84cc16]" />
              <span>{recentPrompts.length} live prompts</span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-start gap-3.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-bold text-emerald-300">{successMessage}</p>
              <div className="mt-2 flex items-center gap-3">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline underline-offset-4 text-emerald-400 hover:text-emerald-300 cursor-pointer inline-flex items-center gap-1"
                >
                  See it live on homepage <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="text-xs text-emerald-400/80 hover:text-emerald-200 cursor-pointer ml-auto"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-bold">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs underline text-rose-300 mt-1 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Row 1: Title */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
              Title <span className="text-[#84cc16]">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cinematic Obsidian Dragon Guardian"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] text-sm font-medium transition-all"
            />
          </div>

          {/* Row 2: Category, Platform, Type in 3 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Category <span className="text-[#84cc16]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<Category, 'All'>)}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-hidden focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] text-sm font-medium cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Platform <span className="text-[#84cc16]">*</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Exclude<Platform, 'All'>)}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-hidden focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] text-sm font-medium cursor-pointer"
              >
                {PLATFORMS.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Type <span className="text-[#84cc16]">*</span>
              </label>
              <select
                value={promptType}
                onChange={(e) => handleTypeChange(e.target.value as 'Image Prompt' | 'Video Prompt')}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-hidden focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] text-sm font-medium cursor-pointer"
              >
                <option value="Image Prompt">Image Prompt</option>
                <option value="Video Prompt">Video Prompt</option>
              </select>
            </div>
          </div>

          {/* Row 3: Prompt Text (Large Textarea) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Prompt Text <span className="text-[#84cc16]">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {promptText.length} characters
              </span>
            </div>
            <textarea
              rows={8}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste full prompt description here (composition, lighting, style, camera angles, color grading)..."
              required
              className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] font-mono text-xs sm:text-sm leading-relaxed transition-all"
            />
          </div>

          {/* Row 4: Optional Image Upload / URL */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                  Optional Thumbnail Image
                </label>
                <p className="text-[11px] text-slate-400">
                  Optional: If no image is provided, the card renders neatly as text-only without broken images.
                </p>
              </div>

              {/* Mode switch */}
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    imageInputMode === 'upload' ? 'bg-[#84cc16] text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    imageInputMode === 'url' ? 'bg-[#84cc16] text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image URL / Asset
                </button>
              </div>
            </div>

            {imageInputMode === 'upload' ? (
              <div>
                {imagePreview ? (
                  /* Preview Selected Image */
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-3 flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Thumbnail preview"
                      className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-xl bg-slate-900 border border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {imageFile?.name || 'Selected image'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Preview loaded'}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">
                        Will be stored as card thumbnail
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer mr-2"
                      title="Remove image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  /* Upload Dropzone */
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-[#84cc16]/70 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50 hover:bg-slate-950"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400 mb-3">
                      <Upload className="w-6 h-6 text-[#84cc16]" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-200">
                      Click to browse or drag & drop thumbnail image
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      PNG, JPG, WEBP up to 12MB. Optional.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* URL / Asset Path Input */
              <div className="space-y-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg or local asset file name"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] text-xs font-mono"
                />
                {imageUrlInput && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    ✓ Custom image path linked
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Advanced Settings (Model, Aspect Ratio, How-to-use) */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#84cc16]" />
              <span>{showAdvanced ? 'Hide Optional Specs' : 'Show Optional Specs (Model, Aspect Ratio, Usage Guide)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Engine / Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Midjourney v6.1 / Flux.1"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono cursor-pointer"
                  >
                    <option value="9:16">9:16 (Short-form / Stories / Reels)</option>
                    <option value="4:5">4:5 (Instagram Portrait)</option>
                    <option value="3:4">3:4 (Editorial / Vertical)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape / Widescreen)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    How to Use / Tips
                  </label>
                  <input
                    type="text"
                    value={howToUse}
                    onChange={(e) => setHowToUse(e.target.value)}
                    placeholder="Optional tips for users, e.g. Upload a selfie and use 35mm prime lens..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500 font-mono order-2 sm:order-1 text-center sm:text-left">
              Submits directly to <code className="text-[#84cc16]">/api/prompts</code> · Instant live sync
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto order-1 sm:order-2 px-8 py-3.5 bg-[#84cc16] hover:bg-[#a3e635] text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#84cc16]/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Publishing Live...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Add Prompt to Website</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Prompts Inspection Section */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#84cc16]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Live Prompts in Cloud Database ({recentPrompts.length})
              </h3>
            </div>
            <button
              onClick={loadRecentPrompts}
              disabled={isLoadingPrompts}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrompts ? 'animate-spin' : ''}`} />
              <span>Refresh list</span>
            </button>
          </div>

          {/* List of recent items */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {recentPrompts.slice(0, 8).map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl.startsWith('http') || p.imageUrl.startsWith('data:') || p.imageUrl.startsWith('/') ? p.imageUrl : `/${p.imageUrl}`}
                      alt={p.title}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                      {p.type === 'video' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{p.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="text-[#84cc16] font-semibold">{p.category}</span>
                      <span>·</span>
                      <span>{p.platform}</span>
                      <span>·</span>
                      <span className="font-mono">{p.dateAdded}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {p.type || 'image'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
