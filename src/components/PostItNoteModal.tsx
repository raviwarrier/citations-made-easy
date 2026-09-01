import React, { useState, useEffect, useRef } from 'react';
import { Tag, Pin, X, CornerDownLeft, MessageSquare } from 'lucide-react';
import { ReadingTheme } from '../types';

interface PostItNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string, tags: string[]) => void;
  quoteText: string;
  pageNumber: number;
  chapterTitle?: string;
  docTitle?: string;
  authors?: string[];
  year?: string;
  existingNotes?: string;
  existingTags?: string[];
  suggestedTags?: string[];
  theme?: ReadingTheme;
}

const DEFAULT_TAG_SUGGESTIONS = [
  'key-argument',
  'methodology',
  'counter-evidence',
  'definition',
  'future-work',
  'literature-review',
  'thesis-chapter-1',
  'to-follow-up',
];

export const PostItNoteModal: React.FC<PostItNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  quoteText,
  pageNumber,
  chapterTitle,
  docTitle,
  existingNotes = '',
  existingTags,
  suggestedTags = [],
}) => {
  const [note, setNote] = useState(existingNotes || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(() => (existingTags ? [...existingTags] : []));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(false);

  // Re-sync state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setNote(existingNotes || '');
      setTags(existingTags ? [...existingTags] : []);
      setTagInput('');
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      prevIsOpenRef.current = true;
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      prevIsOpenRef.current = false;
    }
  }, [isOpen, existingNotes]); // Do NOT include existingTags as dependency to avoid reference loops

  if (!isOpen) return null;

  // Combine document/repository tags with defaults, deduplicating
  const availableSuggestions = Array.from(
    new Set([...suggestedTags, ...DEFAULT_TAG_SUGGESTIONS])
  ).filter((s) => s && s.trim().length > 0);

  // Process and add tags: handles both single tag string and comma-delimited multiple tags
  const handleAddTagsFromInput = (input: string) => {
    if (!input || !input.trim()) return;

    // Split by comma in case user pastes or types comma-delimited text
    const candidateTags = input
      .split(',')
      .map((t) => t.trim().replace(/^#+/, ''))
      .filter((t) => t.length > 0);

    if (candidateTags.length === 0) return;

    setTags((prev) => {
      const updated = [...prev];
      for (const t of candidateTags) {
        if (!updated.includes(t)) {
          updated.push(t);
        }
      }
      return updated;
    });

    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  const handleSave = () => {
    // If there is pending tag input, parse comma-separated or single text before saving
    let finalTags = [...tags];
    if (tagInput.trim()) {
      const pending = tagInput
        .split(',')
        .map((t) => t.trim().replace(/^#+/, ''))
        .filter((t) => t.length > 0);

      for (const t of pending) {
        if (!finalTags.includes(t)) {
          finalTags.push(t);
        }
      }
    }
    onSave(note.trim(), finalTags);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      onKeyDown={handleModalKeyDown}
    >
      {/* Note Container */}
      <div
        className="relative w-full max-w-xl bg-[#fdfbf7] text-[#1c1917] rounded-md shadow-2xl border border-stone-200 border-t-6 border-t-amber-400/90 transform transition-all duration-200 select-auto overflow-hidden"
        style={{
          boxShadow: '0 25px 40px -10px rgba(0, 0, 0, 0.45), 0 10px 20px -5px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Subtle Frosted Tape effect */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-stone-100/70 backdrop-blur-xs border border-stone-300/60 rotate-1 pointer-events-none rounded-xs shadow-xs" />

        {/* Note Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-stone-200 bg-[#fbf8f2]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded bg-amber-100 text-amber-900 border border-amber-300/50">
              <Pin className="w-4 h-4 text-amber-800" />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-stone-900 flex items-center gap-2 font-sans">
                Post-It Note
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-stone-200/80 text-stone-700 border border-stone-300/60">
                  Citation Note
                </span>
              </h3>
              <p className="text-xs text-stone-600 font-mono truncate max-w-xs mt-0.5">
                {docTitle || 'Document'} • p. {pageNumber}
                {chapterTitle ? ` • ${chapterTitle}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition cursor-pointer"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note Content Area */}
        <div className="p-5 space-y-4.5 bg-[#fdfbf7]">
          {/* Quote Excerpt Strip */}
          <div className="bg-[#f7f4ee] rounded-sm p-3.5 border-l-3 border-amber-500/80 text-xs sm:text-[13px] text-stone-800 font-serif italic line-clamp-3 select-text leading-relaxed border border-stone-200/60 border-l-amber-500">
            “{quoteText}”
          </div>

          {/* Long-Form Commentary Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-stone-800 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-stone-600" />
                Notes & Commentary:
              </label>
              <span className="text-[11px] text-stone-500 font-mono">
                {note.length} characters
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                } else {
                  e.stopPropagation();
                }
              }}
              placeholder='e.g., "Supports the main hypothesis in section 2; compare with findings from earlier study"'
              rows={4}
              className="w-full bg-white border border-stone-300 rounded-md p-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none font-sans leading-relaxed transition shadow-2xs select-text"
            />
          </div>

          {/* Tags & Categorization Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-stone-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-600" />
                Tags (Enter individually or comma-separated):
              </label>
              <span className="text-[11px] text-stone-500 font-mono">
                Press Enter or Add
              </span>
            </div>

            {/* Tag Input Field */}
            <div className="flex gap-2">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTagsFromInput(tagInput);
                  }
                }}
                placeholder='e.g., key-argument, methodology, chapter-2'
                className="flex-1 bg-white border border-stone-300 rounded-md px-3.5 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-sans shadow-2xs select-text"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddTagsFromInput(tagInput);
                }}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-900 font-mono text-xs font-semibold rounded-md border border-stone-300 transition cursor-pointer shrink-0"
              >
                + Add
              </button>
            </div>

            {/* Active Tags Display */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-100 text-stone-900 text-xs font-mono font-medium border border-stone-300 shadow-2xs"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(t);
                      }}
                      className="text-stone-400 hover:text-red-600 transition cursor-pointer ml-0.5"
                      title={`Remove tag #${t}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            <div className="pt-1.5">
              <span className="text-[11px] font-mono text-stone-500 mr-2 block mb-1">
                Suggested Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableSuggestions.map((suggestion) => {
                  const isSelected = tags.includes(suggestion);
                  if (isSelected) return null;
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddTagsFromInput(suggestion);
                      }}
                      className="text-xs font-mono px-2.5 py-1 rounded bg-[#f4f0e6] hover:bg-stone-200 text-stone-700 border border-stone-300/80 transition cursor-pointer active:scale-95"
                    >
                      +{suggestion}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Note Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#fbf8f2] border-t border-stone-200">
          <div className="text-[11px] font-mono text-stone-500 flex items-center gap-1">
            <CornerDownLeft className="w-3.5 h-3.5 text-stone-400" />
            <span>Ctrl + Enter to Save</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md text-xs font-mono font-medium text-stone-600 hover:bg-stone-200/70 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4.5 py-2 rounded-md bg-stone-900 hover:bg-black text-white font-mono text-xs font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Pin className="w-3.5 h-3.5 text-amber-300" />
              Save Note & Citation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
