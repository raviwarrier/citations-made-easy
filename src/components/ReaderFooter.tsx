import React from 'react';
import { Keyboard, Sparkles, BookOpen } from 'lucide-react';
import { ReadingTheme } from '../types';
import { THEMES } from '../utils/themeStyles';

interface ReaderFooterProps {
  onOpenShortcuts: () => void;
  onOpenExportModal?: () => void;
  onToggleMetadata?: () => void;
  citationCount?: number;
  hasActiveDoc?: boolean;
  theme?: ReadingTheme;
}

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  onOpenShortcuts,
  onOpenExportModal,
  onToggleMetadata,
  citationCount = 0,
  hasActiveDoc = false,
  theme = 'sepia',
}) => {
  const currentTheme = THEMES[theme] || THEMES.sepia;

  return (
    <footer
      id="reader-footer-bar"
      className={`h-9 flex items-center px-4 md:px-6 justify-between shrink-0 font-mono text-xs select-none border-t z-30 transition-colors ${currentTheme.headerBg} ${currentTheme.headerMuted} ${currentTheme.headerBorder}`}
    >
      {/* Keyboard shortcuts tips */}
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap overflow-hidden">
        <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-500">
          <Keyboard className="w-3.5 h-3.5" />
          Shortcuts:
        </span>

        {hasActiveDoc && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] sm:text-xs">
            <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>W</kbd>
            <span>Close</span>
          </span>
        )}

        <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs">
          <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>E</kbd>
          <span>Extract</span>
        </span>

        <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs">
          <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>C</kbd>
          <span>Quick Copy</span>
        </span>

        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] sm:text-xs">
          <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>M</kbd>
          <span>Metadata</span>
        </span>

        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] sm:text-xs">
          <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>B</kbd>
          <span>Citations</span>
        </span>

        <span className="hidden md:inline-flex items-center gap-1 text-[11px] sm:text-xs">
          <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>R</kbd>
          <span>Repository</span>
        </span>

        {onOpenExportModal && citationCount > 0 && (
          <button
            onClick={onOpenExportModal}
            className={`hidden lg:inline-flex items-center gap-1 text-[11px] sm:text-xs hover:${currentTheme.headerText} transition cursor-pointer`}
            title="Open Export Modal"
          >
            <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>X</kbd>
            <span>Export ({citationCount})</span>
          </button>
        )}
      </div>

      {/* Right Shortcuts Modal Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenShortcuts}
          className={`text-xs font-mono font-medium hover:${currentTheme.headerText} transition cursor-pointer inline-flex items-center gap-1`}
          title="Show all keyboard shortcuts"
        >
          <span className="underline">[?] Cheat Sheet</span>
        </button>
      </div>
    </footer>
  );
};

