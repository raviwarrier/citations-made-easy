import React from 'react';
import { 
  BookOpen, 
  FileText, 
  User, 
  Calendar, 
  Bookmark, 
  Download, 
  HardDrive, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { CitationStyle, ReaderSettings, ResearchDocument } from '../types';
import { THEMES } from '../utils/themeStyles';

interface DocumentMetadataSidebarProps {
  document: ResearchDocument | null;
  settings: ReaderSettings;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  onOpenDocumentPicker: () => void;
  onOpenExportModal?: () => void;
  onClose?: () => void;
  onSaveLocalBackup?: () => void;
}

export const DocumentMetadataSidebar: React.FC<DocumentMetadataSidebarProps> = ({
  document,
  settings,
  onUpdateSettings,
  onOpenDocumentPicker,
  onOpenExportModal,
  onClose,
  onSaveLocalBackup,
}) => {
  const theme = THEMES[settings.theme] || THEMES.sepia;

  return (
    <>
      {/* Mobile Backdrop */}
      {onClose && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs" 
        />
      )}
      <aside
        id="document-metadata-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:relative md:w-64 md:inset-auto md:z-20 border-r p-5 flex flex-col gap-6 shrink-0 font-sans select-none overflow-y-auto shadow-2xl md:shadow-none transition-all duration-150 ${theme.sidebarBg} ${theme.sidebarText} ${theme.sidebarBorder}`}
      >
        {/* Top Header / Close */}
      <div className={`flex items-center justify-between pb-3 border-b ${theme.sidebarBorder}`}>
        <span className={`text-[10px] uppercase tracking-widest font-bold ${theme.sidebarMuted}`}>
          Document Details
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className={`text-xs font-mono px-1.5 py-0.5 rounded transition ${theme.sidebarMuted} hover:${theme.sidebarText} hover:bg-black/10 cursor-pointer`}
            title="Close Metadata Panel"
          >
            [Close]
          </button>
        )}
      </div>

      {/* Document Metadata Section */}
      <div>
        <label className={`text-[10px] uppercase tracking-widest font-bold mb-3 block ${theme.sidebarMuted}`}>
          Document Metadata
        </label>
        
        {document ? (
          <div className="space-y-3.5 text-xs">
            <div>
              <span className={`block text-[10px] uppercase font-bold tracking-wider mb-0.5 ${theme.sidebarMuted}`}>
                Title
              </span>
              <p className={`font-medium leading-snug line-clamp-3 ${theme.sidebarText}`} title={document.title}>
                {document.title}
              </p>
            </div>

            <div>
              <span className={`block text-[10px] uppercase font-bold tracking-wider mb-0.5 ${theme.sidebarMuted}`}>
                Authors
              </span>
              <p className={`font-medium ${theme.sidebarText}`}>
                {document.authors.length > 0 ? document.authors.join(', ') : 'Unknown Author'}
              </p>
            </div>

            <div>
              <span className={`block text-[10px] uppercase font-bold tracking-wider mb-0.5 ${theme.sidebarMuted}`}>
                Source / Journal
              </span>
              <p className={`font-medium truncate ${theme.sidebarText}`}>
                {document.journalOrBookTitle || document.sourceOrPublisher || 'Academic Archive'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={`block text-[10px] uppercase font-bold tracking-wider mb-0.5 ${theme.sidebarMuted}`}>
                  Year
                </span>
                <p className={`font-medium font-mono ${theme.sidebarText}`}>
                  {document.publicationYear || '2024'}
                </p>
              </div>
              <div>
                <span className={`block text-[10px] uppercase font-bold tracking-wider mb-0.5 ${theme.sidebarMuted}`}>
                  Format
                </span>
                <p className={`font-medium font-mono uppercase text-[11px] ${theme.sidebarText}`}>
                  {document.fileType}
                </p>
              </div>
            </div>

            {document.doi && (
              <div>
                <span className={`block text-[10px] uppercase font-bold tracking-wider mb-0.5 ${theme.sidebarMuted}`}>
                  DOI
                </span>
                <p className={`font-mono text-[10px] truncate ${theme.sidebarMuted}`} title={document.doi}>
                  {document.doi}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className={`p-3 rounded border text-xs ${theme.cardBg} ${theme.cardBorder} ${theme.sidebarMuted}`}>
            No document loaded.
          </div>
        )}
      </div>

      {/* Citation Style Selector */}
      <div>
        <label className={`text-[10px] uppercase tracking-widest font-bold mb-2 block ${theme.sidebarMuted}`}>
          Citation Style
        </label>
        <div className="relative">
          <select
            value={settings.citationStyle}
            onChange={(e) => onUpdateSettings({ citationStyle: e.target.value as CitationStyle })}
            className={`w-full border rounded p-2 text-xs appearance-none cursor-pointer font-medium focus:outline-none shadow-2xs ${theme.inputBg} ${theme.inputBorder} ${theme.inputText}`}
          >
            <option value="apa">APA (7th Edition)</option>
            <option value="mla">MLA (9th Edition)</option>
            <option value="chicago-author-date">Chicago (17th Author-Date)</option>
            <option value="chicago-notes">Chicago (Notes & Bibliography)</option>
            <option value="harvard">Harvard Standard</option>
            <option value="ieee">IEEE Numbered</option>
            <option value="bibtex">BibTeX Academic</option>
          </select>
          <div className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] ${theme.sidebarMuted}`}>
            ▼
          </div>
        </div>
      </div>

      {/* Reader Layout Controls */}
      <div>
        <label className={`text-[10px] uppercase tracking-widest font-bold mb-2 block ${theme.sidebarMuted}`}>
          Reading Geometry
        </label>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className={theme.sidebarMuted}>Typeface</span>
            <div className="flex gap-1">
              <button
                onClick={() => onUpdateSettings({ font: 'serif' })}
                className={`px-2 py-0.5 rounded text-[11px] font-serif border cursor-pointer ${
                  settings.font === 'serif' ? `${theme.cardBg} ${theme.cardSelectedBorder} font-bold` : `border-transparent ${theme.sidebarMuted}`
                }`}
              >
                Serif
              </button>
              <button
                onClick={() => onUpdateSettings({ font: 'sans' })}
                className={`px-2 py-0.5 rounded text-[11px] font-sans border cursor-pointer ${
                  settings.font === 'sans' ? `${theme.cardBg} ${theme.cardSelectedBorder} font-bold` : `border-transparent ${theme.sidebarMuted}`
                }`}
              >
                Sans
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={theme.sidebarMuted}>Type Size</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                className={`w-5 h-5 rounded border flex items-center justify-center font-bold text-[10px] cursor-pointer ${theme.btnSecondary}`}
              >
                -
              </button>
              <span className={`font-mono text-[10px] w-6 text-center ${theme.sidebarText}`}>{settings.fontSize}px</span>
              <button
                onClick={() => onUpdateSettings({ fontSize: Math.min(26, settings.fontSize + 1) })}
                className={`w-5 h-5 rounded border flex items-center justify-center font-bold text-[10px] cursor-pointer ${theme.btnSecondary}`}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={theme.sidebarMuted}>Width</span>
            <div className="flex gap-1">
              {(['narrow', 'medium', 'wide'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdateSettings({ contentWidth: w })}
                  className={`px-1.5 py-0.5 rounded text-[10px] capitalize border cursor-pointer ${
                    settings.contentWidth === w ? `${theme.cardBg} ${theme.cardSelectedBorder} font-bold` : `border-transparent ${theme.sidebarMuted}`
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons & Session Footnote */}
      <div className={`mt-auto pt-4 border-t ${theme.sidebarBorder} space-y-2`}>
        {onSaveLocalBackup && (
          <button
            onClick={onSaveLocalBackup}
            className={`w-full border py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${theme.btnSecondary}`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Save Local Session</span>
          </button>
        )}

        <button
          onClick={onOpenDocumentPicker}
          className={`w-full border py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${theme.btnSecondary}`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Start New Research</span>
        </button>

        <p className={`text-[9px] text-center pt-1 uppercase tracking-tighter ${theme.sidebarMuted}`}>
          Data stored locally • No cloud sync
        </p>
      </div>
    </aside>
    </>
  );
};
