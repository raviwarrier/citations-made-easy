import React from 'react';
import { BookmarkPlus, Copy, Sparkles, Check } from 'lucide-react';
import { CitationStyle, ReadingTheme } from '../types';
import { THEMES } from '../utils/themeStyles';

interface SelectionToolbarProps {
  position: { top: number; left: number };
  selectedText: string;
  pageNumber: number;
  chapterTitle?: string;
  onExtractCitation: () => void;
  onQuickCopy: () => void;
  onScanContext: () => void;
  onAddNote: () => void;
  isCopied: boolean;
  citationStyle: CitationStyle;
  theme?: ReadingTheme;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  position,
  selectedText,
  pageNumber,
  chapterTitle,
  onExtractCitation,
  onQuickCopy,
  onScanContext,
  onAddNote,
  isCopied,
  citationStyle,
  theme = 'sepia',
}) => {
  const currentTheme = THEMES[theme] || THEMES.sepia;
  const wordCount = selectedText.trim().split(/\s+/).filter(Boolean).length;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div
      id="selection-toolbar"
      style={
        isMobile
          ? undefined
          : {
              top: `${Math.max(10, position.top - 54)}px`,
              left: `${Math.max(16, Math.min(window.innerWidth - 380, position.left))}px`,
            }
      }
      className={`fixed z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 rounded-lg shadow-2xl border text-xs select-none font-sans ${
        isMobile
          ? 'bottom-4 left-3 right-3 max-w-sm mx-auto justify-between overflow-x-auto'
          : ''
      } ${currentTheme.floatingToolbarBg} ${currentTheme.floatingToolbarBorder} text-white`}
    >
      {/* Page & Word count badge */}
      <div className="flex items-center gap-1 text-[10px] font-mono text-stone-300 shrink-0">
        <span className="font-bold text-amber-400">p.{pageNumber}</span>
        <span>•</span>
        <span>{wordCount}w</span>
      </div>

      <span className="text-stone-500 hidden sm:inline">|</span>

      {/* Extract Citation Button */}
      <button
        id="btn-extract-citation"
        onClick={onExtractCitation}
        className="flex items-center gap-1.5 hover:text-amber-300 transition-colors font-semibold cursor-pointer text-xs shrink-0"
        title="Extract structured reference entry (Shortcut: E)"
      >
        <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
        <span>Add</span>
        <kbd className="text-[9px] bg-black/40 text-stone-200 px-1 py-0.2 rounded font-mono border border-white/10 hidden sm:inline">[E]</kbd>
      </button>

      <span className="text-stone-500 hidden sm:inline">|</span>

      {/* Quick Copy Formatted Citation */}
      <button
        id="btn-quick-copy-citation"
        onClick={onQuickCopy}
        className="flex items-center gap-1.5 hover:text-amber-300 transition-colors font-medium cursor-pointer text-xs shrink-0"
        title={`Quick copy in-text citation in ${citationStyle.toUpperCase()} format (Shortcut: C)`}
      >
        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
        <kbd className="text-[9px] bg-black/40 text-stone-200 px-1 py-0.2 rounded font-mono border border-white/10 hidden sm:inline">[C]</kbd>
      </button>

      <span className="text-stone-500 hidden sm:inline">|</span>

      {/* Capture Context / Secondary Quotations */}
      <button
        id="btn-capture-context"
        onClick={onScanContext}
        className="flex items-center gap-1.5 hover:text-amber-300 transition-colors font-medium cursor-pointer text-xs shrink-0"
        title="Capture surrounding sentences and detect secondary/third-party source authors (Shortcut: S)"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Capture Context</span>
        <span className="sm:hidden">Context</span>
        <kbd className="text-[9px] bg-black/40 text-stone-200 px-1 py-0.2 rounded font-mono border border-white/10 hidden sm:inline">[S]</kbd>
      </button>
    </div>
  );
};

