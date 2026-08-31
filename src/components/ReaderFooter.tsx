import React from 'react';
import { HardDrive, ShieldCheck, Keyboard } from 'lucide-react';
import { ReadingTheme } from '../types';
import { THEMES } from '../utils/themeStyles';

interface ReaderFooterProps {
  onOpenShortcuts: () => void;
  onSaveLocalBackup?: () => void;
  onOpenExportModal?: () => void;
  onToggleMetadata?: () => void;
  citationCount?: number;
  theme?: ReadingTheme;
}

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  onOpenShortcuts,
  onSaveLocalBackup,
  onOpenExportModal,
  onToggleMetadata,
  citationCount = 0,
  theme = 'sepia',
}) => {
  const currentTheme = THEMES[theme] || THEMES.sepia;

  return (
    <footer
      id="reader-footer-bar"
      className={`h-8 flex items-center px-4 justify-between shrink-0 font-mono text-[9px] uppercase tracking-tighter select-none border-t z-30 ${currentTheme.headerBg} ${currentTheme.headerMuted} ${currentTheme.headerBorder}`}
    >
      {/* Left keyboard shortcuts hints */}
      <div className="flex items-center gap-4">
        {onSaveLocalBackup && (
          <>
            <button
              onClick={onSaveLocalBackup}
              className={`hover:${currentTheme.headerText} transition cursor-pointer`}
              title="Backup and save local session"
            >
              [ALT+S] Quick Save
            </button>
            <span className="opacity-30">•</span>
          </>
        )}
        {onToggleMetadata && (
          <>
            <button
              onClick={onToggleMetadata}
              className={`hover:${currentTheme.headerText} transition cursor-pointer`}
              title="Toggle Document Metadata sidebar"
            >
              [ALT+M] Metadata
            </button>
            <span className="opacity-30">•</span>
          </>
        )}
        {onOpenExportModal && (
          <>
            <button
              onClick={onOpenExportModal}
              className={`hover:${currentTheme.headerText} transition cursor-pointer`}
              title="Open Export Modal"
            >
              [ALT+X] Export ({citationCount})
            </button>
            <span className="opacity-30 hidden sm:inline">•</span>
          </>
        )}
        <button
          onClick={onOpenShortcuts}
          className={`hover:${currentTheme.headerText} transition cursor-pointer hidden sm:inline`}
          title="Show keyboard cheat sheet"
        >
          [?] Shortcuts
        </button>
      </div>

      {/* Right cache and security status */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        <span className="truncate">
          100% Local • No AI • Private
        </span>
      </div>
    </footer>
  );
};
