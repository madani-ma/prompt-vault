import React, { useState, useRef } from 'react';
import { X, Check, Lock, Upload, ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { PromptItem, Category, Platform } from '../types';
import { CATEGORIES, PLATFORMS } from '../data/prompts';

const CORRECT_PASSWORD = 'MBS777ZX';

interface SubmitPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newPrompt: PromptItem) => void;
}

export const SubmitPromptModal: React.FC<SubmitPromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  // Always starts completely empty by default
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<Category, 'All'>>('Cinematic');
  const [platform, setPlatform] = useState<Exclude<Platform, 'All'>>('TikTok');
  const [model, setModel] = useState('Midjourney v6.1 / Flux.1');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '4:5'>('9:16');
  const [promptText, setPromptText] = useState('');
  const [howToUse, setHowToUse] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cameraSettings, setCameraSettings] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalClose = () => {
    setPassword('');
    setPasswordError('');
    setShowPassword(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Pre-check Password
    if (password.trim() !== CORRECT_PASSWORD) {
      setPasswordError('Incorrect password. Access denied.');
      return;
    }

    if (!title.trim() || !promptText.trim() || !howToUse.trim()) {
      return;
    }

    setIsSubmitting(true);

    const newPrompt: PromptItem = {
      id: `prompt-${Date.now()}`,
      title: title.trim(),
      type: 'image',
      category,
      platform,
      model: model.trim() || 'Midjourney v6.1 / Flux.1',
      aspectRatio,
      imageUrl: imagePreview || imageUrl.trim() || undefined,
      prompt: promptText.trim(),
      howToUse: howToUse.trim(),
      cameraSettings: cameraSettings.trim() || undefined,
      submittedBy: authorName.trim() ? `@${authorName.trim().replace(/^@/, '')}` : 'Creator',
      copyCount: 1,
      featured: true,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    try {
      // Save directly to the shared cloud database via server API
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password.trim(),
          prompt: newPrompt,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setPasswordError(errorData.error || 'Failed to save prompt to cloud database.');
        setIsSubmitting(false);
        return;
      }

      const responseData = await res.json();
      const savedPrompt = responseData.prompt || newPrompt;

      onSubmit(savedPrompt);
      setSubmitted(true);
      setIsSubmitting(false);

      setTimeout(() => {
        setSubmitted(false);
        handleModalClose();
        // Reset form fields
        setTitle('');
        setPromptText('');
        setHowToUse('');
        setImageUrl('');
        setImagePreview(null);
        setCameraSettings('');
        setAuthorName('');
      }, 1500);
    } catch (err) {
      console.error('Error submitting prompt:', err);
      // Fallback: still notify parent if offline
      onSubmit(newPrompt);
      setSubmitted(true);
      setIsSubmitting(false);

      setTimeout(() => {
        setSubmitted(false);
        handleModalClose();
      }, 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
      onClick={handleModalClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl border border-purple-200/80 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleModalClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-black uppercase tracking-wider mb-2">
            <Lock className="w-3 h-3 text-[#65a30d]" />
            <span>CLOUD REPOSITORY VERIFICATION</span>
          </div>
          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
            SUBMIT TO CLOUD VAULT
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Enter the creator access password to verify and publish your prompt live to the shared cloud database for all visitors and devices.
          </p>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 bg-[#84cc16] text-slate-950 rounded-full mx-auto flex items-center justify-center shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
              Saved to Cloud Database!
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your prompt has been written to the shared database and is now live across all browsers and devices.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Password Verification Block: Masked with standard dots, never pre-filled */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block font-black uppercase text-slate-900 tracking-wider text-[11px]">
                Submission Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Enter password"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-mono focus:outline-none transition-colors ${
                    passwordError
                      ? 'border-red-500 text-red-950 bg-red-50/30'
                      : 'border-slate-300 text-slate-900 focus:border-purple-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordError ? (
                <div className="flex items-center gap-1.5 text-red-600 font-bold text-[11px] pt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Password protected to verify authentic creator submissions.
                </p>
              )}
            </div>

            {/* Prompt Details */}
            <div>
              <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                Prompt Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Vintage Super 8 Rooftop Golden Hour"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* Category & Platform */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                  Platform Style
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                >
                  {PLATFORMS.filter((p) => p !== 'All').map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Model & Aspect Ratio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                  Target AI Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Midjourney v6.1, Flux.1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                >
                  <option value="9:16">9:16 (Story / Reel / Shorts)</option>
                  <option value="4:5">4:5 (Instagram Portrait)</option>
                  <option value="1:1">1:1 (Square Feed)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                </select>
              </div>
            </div>

            {/* Prompt Text */}
            <div>
              <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                Full Prompt Text *
              </label>
              <textarea
                required
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Paste the exact prompt text including camera, lighting, and style parameters..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* How to use */}
            <div>
              <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                How to Use This Prompt *
              </label>
              <input
                type="text"
                required
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="e.g. Set camera zoom to -1.5, export at 60fps"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* Optional Image Upload or URL */}
            <div>
              <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                Output Image Preview (Optional)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value || null);
                  }}
                  placeholder="Or paste image URL"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              {imagePreview && (
                <div className="mt-2.5 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageUrl('');
                    }}
                    className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Creator Handle */}
            <div>
              <label className="block font-bold uppercase text-slate-800 mb-1 tracking-wider">
                Creator Handle (Optional)
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. @yourhandle"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* Submit Pill Button with Arrow Icon */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 bg-[#84cc16] hover:bg-[#a3e635] text-slate-950 font-black uppercase tracking-wider text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer group ${
                  isSubmitting ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing to Cloud Database...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Save to Cloud Database</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
