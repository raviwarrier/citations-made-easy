import React from 'react';
import { 
  BookOpen, 
  Bookmark, 
  FolderOpen, 
  Maximize2, 
  Minimize2, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Download,
  Sidebar,
  Database
} from 'lucide-react';
import { FontChoice, ReadingTheme, ReaderSettings, ResearchDocument } from '../types';
import { THEMES } from '../utils/themeStyles';

interface ReaderHeaderProps {
  document: ResearchDocument | null;
  settings: ReaderSettings;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  onOpenDocumentPicker: () => void;
  onOpenRepository?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleMetaSidebar?: () => void;
  isMetaSidebarOpen?: boolean;
  citationCount: number;
  onOpenShortcuts: () => void;
  onOpenExportModal: () => void;
  currentPage?: number;
  totalPages?: number;
  onNextPage?: () => void;
  onPrevPage?: () => void;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  document,
  settings,
  onUpdateSettings,
  onOpenDocumentPicker,
  onOpenRepository,
  onToggleSidebar,
  isSidebarOpen,
  onToggleMetaSidebar,
  isMetaSidebarOpen,
  citationCount,
  onOpenShortcuts,
  onOpenExportModal,
}) => {
  const theme = THEMES[settings.theme] || THEMES.sepia;

  return (
    <header
      id="reader-header"
      className={`h-14 border-b flex items-center justify-between px-4 md:px-6 shrink-0 font-sans select-none z-30 transition-colors ${theme.headerBg} ${theme.headerText} ${theme.headerBorder}`}
    >
      {/* Left section: App Brand & Document Title */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
        <button
          id="btn-open-doc-picker"
          onClick={onOpenDocumentPicker}
          className={`${theme.btnPrimary} px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition rounded flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0`}
          title="Start Research / Open Document (O)"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Start</span>
        </button>

        {/* Toggle Metadata Sidebar (Accessible on mobile & desktop) */}
        {onToggleMetaSidebar && (
          <button
            onClick={onToggleMetaSidebar}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono border transition shrink-0 ${
              isMetaSidebarOpen
                ? `${theme.cardBg} ${theme.cardSelectedBorder} font-bold shadow-2xs`
                : `${theme.headerBorder} hover:opacity-80 ${theme.headerMuted}`
            }`}
            title="Toggle Document Metadata Panel (M)"
          >
            <Sidebar className="w-3 h-3" />
            <span className="hidden sm:inline">[Meta]</span>
          </button>
        )}

        {/* Citations Repository Fullscreen Button */}
        {onOpenRepository && (
          <button
            id="btn-open-repository"
            onClick={onOpenRepository}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-mono font-medium border transition shrink-0 cursor-pointer ${theme.btnSecondary} hover:${theme.btnSecondaryHover} ${theme.headerText}`}
            title="Open Citations Repository"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>Repository</span>
          </button>
        )}

        {document && (
          <h1 
            className="text-xs md:text-sm font-medium truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[320px] md:max-w-[460px] italic opacity-90 hidden sm:block ml-1"
            title={document.title}
          >
            {document.title}
          </h1>
        )}
      </div>

      {/* Right section: 4-Way Theme Selector & Action Badges */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {/* Full Segmented 4-Theme Switcher (Tablets & Desktops) */}
        <div className={`hidden sm:flex rounded p-1 gap-1 items-center border ${theme.sidebarSubtleHeaderBg} ${theme.headerBorder}`}>
          {(['sepia', 'paper', 'slate', 'onyx'] as const).map((tKey) => {
            const isActive = settings.theme === tKey;
            const tObj = THEMES[tKey];
            return (
              <button
                key={tKey}
                onClick={() => onUpdateSettings({ theme: tKey })}
                className={`px-2 sm:px-2.5 py-0.5 text-[10px] uppercase font-bold transition-all rounded ${
                  isActive
                    ? `${theme.cardBg} ${theme.cardText} shadow-xs font-extrabold ring-1 ${theme.cardSelectedBorder}`
                    : `${theme.headerMuted} hover:opacity-100`
                }`}
                title={`Switch theme to ${tObj.label}`}
              >
                {tObj.label}
              </button>
            );
          })}
        </div>

        {/* Compact Single Cycle Button for Mobile screens */}
        <button
          onClick={() => {
            const themes: ReadingTheme[] = ['sepia', 'paper', 'slate', 'onyx'];
            const nextIdx = (themes.indexOf(settings.theme) + 1) % themes.length;
            onUpdateSettings({ theme: themes[nextIdx] });
          }}
          className={`sm:hidden px-2 py-1 rounded text-[10px] uppercase font-bold border transition ${theme.cardBg} ${theme.headerBorder} ${theme.cardText}`}
          title="Tap to cycle reading themes"
        >
          {THEMES[settings.theme]?.label || 'Theme'}
        </button>

        {/* Shortcuts & Extracts Drawer Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-shortcuts-modal"
            onClick={onOpenShortcuts}
            className={`w-8 h-8 rounded border flex items-center justify-center text-xs font-mono font-bold transition shadow-2xs cursor-pointer ${theme.btnSecondary}`}
            title="Keyboard Shortcuts (?)"
          >
            [?]
          </button>

          <button
            id="btn-toggle-citations"
            onClick={onToggleSidebar}
            className={`h-8 px-2.5 rounded flex items-center gap-1.5 text-xs font-bold transition shadow-2xs ${
              isSidebarOpen
                ? `${theme.btnPrimary}`
                : `${theme.btnSecondary}`
            }`}
            title="Toggle Extracts & Citations Drawer (B)"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{citationCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

