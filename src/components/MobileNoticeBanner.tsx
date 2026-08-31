import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, X, ChevronRight, BookOpen, Bookmark } from 'lucide-react';
import { ReadingTheme } from '../types';
import { THEMES } from '../utils/themeStyles';

interface MobileNoticeBannerProps {
  theme?: ReadingTheme;
  onOpenMeta?: () => void;
  onOpenCitations?: () => void;
  citationCount: number;
}

const STORAGE_DISMISS_KEY = 'scholarread_mobile_advisory_dismissed';

export const MobileNoticeBanner: React.FC<MobileNoticeBannerProps> = ({
  theme = 'sepia',
  onOpenMeta,
  onOpenCitations,
  citationCount,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile || isDismissed) return null;

  const currentTheme = THEMES[theme] || THEMES.sepia;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
  };

  return (
    <div
      id="mobile-advisory-banner"
      className={`border-b px-3.5 py-2.5 flex flex-col gap-2 select-none z-30 transition-all font-sans text-xs shrink-0 ${currentTheme.sheetHighlight} ${currentTheme.sheetHighlightBorder}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Monitor className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <p className="font-bold text-[11px] leading-tight">
              Best experienced on a desktop browser
            </p>
            <p className="text-[10px] opacity-80 leading-snug">
              Designed for multi-column research papers, side-by-side citations & keyboard shortcuts.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded opacity-60 hover:opacity-100 transition shrink-0 cursor-pointer"
          title="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/5 dark:border-white/5">
        <button
          onClick={handleDismiss}
          className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer shadow-2xs ${currentTheme.btnPrimary}`}
        >
          Let me try my luck on the phone
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenMeta && (
            <button
              onClick={onOpenMeta}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 cursor-pointer ${currentTheme.btnSecondary}`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Details</span>
            </button>
          )}
          {onOpenCitations && (
            <button
              onClick={onOpenCitations}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 cursor-pointer ${currentTheme.btnSecondary}`}
            >
              <Bookmark className="w-3 h-3 text-amber-500" />
              <span>Citations ({citationCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
