import React, { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { PromptItem, Category, Platform } from '../types';
import { CATEGORIES, PLATFORMS } from '../data/prompts';

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
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'image'>('video');
  const [category, setCategory] = useState<Exclude<Category, 'All'>>('Cinematic');
  const [platform, setPlatform] = useState<Exclude<Platform, 'All'>>('TikTok');
  const [model, setModel] = useState('Runway Gen-3 Alpha');
  const [promptText, setPromptText] = useState('');
  const [howToUse, setHowToUse] = useState('');
  const [cameraSettings, setCameraSettings] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promptText.trim() || !howToUse.trim()) return;

    const newPrompt: PromptItem = {
      id: `user-${Date.now()}`,
      title: title.trim(),
      type,
      category,
      platform,
      model: model.trim() || 'Runway Gen-3 Alpha',
      aspectRatio: '9:16',
      prompt: promptText.trim(),
      howToUse: howToUse.trim(),
      cameraSettings: cameraSettings.trim() || undefined,
      copyCount: 1,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    onSubmit(newPrompt);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      // Reset form
      setTitle('');
      setPromptText('');
      setHowToUse('');
      setCameraSettings('');
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white border border-black shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-black tracking-tight">
            Submit an AI Prompt
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Share a tested, high-retention video or image prompt with fellow creators.
          </p>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-black text-white mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-black">Prompt Published</h3>
            <p className="text-xs text-neutral-500">
              Added to your active vault and ready for copying.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-semibold text-black mb-1">
                Prompt Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Vintage Super 8 Rooftop Golden Hour"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-sm text-black focus:outline-none focus:border-black"
              />
            </div>

            {/* Media Type & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-black mb-1">Media Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'video' | 'image')}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-black focus:outline-none focus:border-black"
                >
                  <option value="video">AI Video</option>
                  <option value="image">AI Image</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-black mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-black focus:outline-none focus:border-black"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Platform & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-black mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-black focus:outline-none focus:border-black"
                >
                  {PLATFORMS.filter((p) => p !== 'All').map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-black mb-1">Tested AI Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Runway Gen-3, Midjourney v6"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Prompt Text */}
            <div>
              <label className="block font-semibold text-black mb-1">
                Full Prompt Text *
              </label>
              <textarea
                required
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Paste the exact prompt text including camera, lighting, motion parameters..."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 font-mono text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            {/* How to use guide */}
            <div>
              <label className="block font-semibold text-black mb-1">
                How to use this prompt (One-line guide) *
              </label>
              <input
                type="text"
                required
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="e.g. Set camera zoom to -1.5, add subtle motion brush on hair."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            {/* Camera settings */}
            <div>
              <label className="block font-semibold text-black mb-1">
                Camera & Lens Notes (Optional)
              </label>
              <input
                type="text"
                value={cameraSettings}
                onChange={(e) => setCameraSettings(e.target.value)}
                placeholder="e.g. 35mm anamorphic, slow pan right"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 bg-black text-white font-bold text-xs hover:bg-neutral-800 transition-colors"
              >
                Publish to Vault
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
