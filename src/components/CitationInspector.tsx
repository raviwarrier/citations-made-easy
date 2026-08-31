import React, { useState } from 'react';
import { 
  Bookmark, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Download, 
  FileText, 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { CitationEntry, CitationStyle, ReaderSettings, ResearchDocument } from '../types';
import { formatFullCitation, formatInTextCitation } from '../utils/citationFormatter';
import { THEMES } from '../utils/themeStyles';

interface CitationInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  document: ResearchDocument | null;
  citations: CitationEntry[];
  settings: ReaderSettings;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  onDeleteCitation: (id: string) => void;
  onEditCitation: (citation: CitationEntry) => void;
  onOpenExportModal: () => void;
  selectedCitationId?: string | null;
  onJumpToPage: (page: number, citation?: CitationEntry) => void;
}

export const CitationInspector: React.FC<CitationInspectorProps> = ({
  isOpen,
  onClose,
  document,
  citations,
  settings,
  onUpdateSettings,
  onDeleteCitation,
  onEditCitation,
  onOpenExportModal,
  selectedCitationId,
  onJumpToPage,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedContextId, setExpandedContextId] = useState<string | null>(null);
  const [copyAllStatus, setCopyAllStatus] = useState(false);

  const theme = THEMES[settings.theme] || THEMES.sepia;

  if (!isOpen) return null;

  const filteredCitations = citations.filter((c) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      c.quoteText.toLowerCase().includes(q) ||
      (c.userNote && c.userNote.toLowerCase().includes(q)) ||
      c.tags?.some((t) => t.toLowerCase().includes(q)) ||
      (c.thirdPartyAttribution?.detectedAuthor &&
        c.thirdPartyAttribution.detectedAuthor.toLowerCase().includes(q))
    );
  });

  const handleCopyInText = (entry: CitationEntry) => {
    const text = formatInTextCitation(entry, settings.citationStyle);
    navigator.clipboard.writeText(text);
    setCopiedId(`intext_${entry.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyFull = (entry: CitationEntry) => {
    const text = formatFullCitation(entry, settings.citationStyle);
    navigator.clipboard.writeText(text);
    setCopiedId(`full_${entry.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllBibliography = () => {
    if (citations.length === 0) return;
    const uniqueRefs = Array.from(
      new Set(citations.map((c) => formatFullCitation(c, settings.citationStyle)))
    );
    const text = uniqueRefs.join('\n\n');
    navigator.clipboard.writeText(text);
    setCopyAllStatus(true);
    setTimeout(() => setCopyAllStatus(false), 2000);
  };

  const citationStyles: Array<{ id: CitationStyle; label: string }> = [
    { id: 'apa', label: 'APA' },
    { id: 'mla', label: 'MLA' },
    { id: 'chicago-author-date', label: 'Chicago' },
    { id: 'harvard', label: 'Harvard' },
    { id: 'ieee', label: 'IEEE' },
    { id: 'bibtex', label: 'BibTeX' },
  ];

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
        id="citations-inspector-panel"
        className={`fixed inset-y-0 right-0 z-50 w-80 sm:w-96 max-w-[90vw] md:relative md:w-80 md:inset-auto md:z-20 border-l flex flex-col h-full shadow-2xl md:shadow-none transition-all duration-150 shrink-0 font-sans select-none ${theme.sidebarBg} ${theme.sidebarText} ${theme.sidebarBorder}`}
      >
        {/* Panel Header */}
      <div className={`p-4 border-b flex justify-between items-center shrink-0 ${theme.sidebarSubtleHeaderBg} ${theme.sidebarBorder}`}>
        <div className="flex items-center gap-2">
          <h3 className={`text-[10px] uppercase font-bold tracking-widest ${theme.sidebarText}`}>
            Extracts ({citations.length})
          </h3>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${theme.btnPrimary}`}>
            ACTIVE
          </span>
        </div>

        <button
          onClick={onClose}
          className={`p-1 rounded transition text-xs font-mono cursor-pointer ${theme.sidebarMuted} hover:${theme.sidebarText}`}
          title="Close panel"
        >
          [Close]
        </button>
      </div>

      {/* Citation Style Quick Switch Ribbon */}
      <div className={`px-4 py-2.5 border-b shrink-0 flex flex-col gap-1.5 ${theme.sidebarBorder} ${theme.sidebarSubtleHeaderBg}`}>
        <span className={`text-[9px] uppercase tracking-widest font-bold shrink-0 ${theme.sidebarMuted}`}>
          Format:
        </span>
        <div className="flex flex-wrap gap-1">
          {citationStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onUpdateSettings({ citationStyle: style.id })}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                settings.citationStyle === style.id
                  ? `${theme.btnPrimary} shadow-2xs`
                  : `${theme.cardBg} ${theme.sidebarMuted} border ${theme.sidebarBorder} hover:${theme.sidebarText}`
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search / Filter bar */}
      <div className={`p-3 border-b shrink-0 ${theme.cardBg} ${theme.sidebarBorder}`}>
        <div className="relative">
          <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${theme.sidebarMuted}`} />
          <input
            type="text"
            placeholder="Search quotations, authors, tags..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className={`w-full pl-8 pr-6 py-1.5 rounded border text-xs focus:outline-none font-sans ${theme.inputBg} ${theme.inputBorder} ${theme.inputText} ${theme.inputPlaceholder}`}
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono cursor-pointer ${theme.sidebarMuted} hover:${theme.sidebarText}`}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Citations Cards List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {filteredCitations.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-mono text-xs ${theme.badgeBg} ${theme.sidebarMuted}`}>
              0
            </div>
            <p className={`text-xs ${theme.sidebarMuted}`}>
              {citations.length === 0
                ? 'No extracts saved yet. Highlight text in the reading canvas and press [E] to extract citations!'
                : 'No citations match your search.'}
            </p>
          </div>
        ) : (
          filteredCitations.map((citation) => {
            const inText = formatInTextCitation(citation, settings.citationStyle);
            const fullRef = formatFullCitation(citation, settings.citationStyle);
            const isBibtex = settings.citationStyle === 'bibtex';
            const isSelected = selectedCitationId === citation.id;
            const isContextOpen = expandedContextId === citation.id;

            return (
              <div
                key={citation.id}
                id={`citation-card-${citation.id}`}
                className={`p-3.5 border rounded-md shadow-2xs space-y-2 transition-all ${theme.cardBg} ${theme.cardText} ${
                  isSelected
                    ? `${theme.cardSelectedBorder}`
                    : `${theme.cardBorder} ${theme.cardHoverBorder}`
                }`}
              >
                {/* Top card bar with Page & Actions */}
                <div className={`flex justify-between items-center text-[10px] font-mono ${theme.sidebarMuted}`}>
                  <button
                    onClick={() => onJumpToPage(citation.pageNumber, citation)}
                    className={`font-bold hover:underline cursor-pointer flex items-center gap-1 ${theme.cardText}`}
                    title="Click to jump to this page and quote"
                  >
                    <span>PAGE {citation.pageNumber}</span>
                    {citation.chapterName && (
                      <span className={`font-normal truncate max-w-[120px] ${theme.sidebarMuted}`}>
                        • {citation.chapterName}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditCitation(citation)}
                      className={`font-mono font-bold cursor-pointer hover:opacity-100 ${theme.sidebarMuted}`}
                      title="Edit metadata"
                    >
                      [EDIT]
                    </button>
                    <button
                      onClick={() => onDeleteCitation(citation.id)}
                      className="hover:text-red-500 font-mono font-bold cursor-pointer opacity-70 hover:opacity-100"
                      title="Delete entry"
                    >
                      [DEL]
                    </button>
                  </div>
                </div>

                {/* Quoted Text (Clickable to jump to quote location in reader) */}
                <blockquote
                  onClick={() => onJumpToPage(citation.pageNumber, citation)}
                  className={`font-mono text-[11px] leading-relaxed p-2 rounded border cursor-pointer transition hover:opacity-95 hover:border-amber-400/60 ${theme.quoteBlockBg} ${theme.quoteBlockBorder} ${theme.quoteBlockText}`}
                  title="Click to jump to this quote location in the document"
                >
                  "{citation.quoteText}"
                </blockquote>

                {/* Third-Party Attribution */}
                {citation.thirdPartyAttribution?.isThirdPartyQuote && citation.thirdPartyAttribution.detectedAuthor && (
                  <div className="p-2 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-600 dark:text-amber-300 space-y-0.5 font-mono">
                    <div className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Quoting: {citation.thirdPartyAttribution.detectedAuthor}</span>
                    </div>
                    {citation.thirdPartyAttribution.detectedYear && (
                      <p className="text-[9px] opacity-80">Year: {citation.thirdPartyAttribution.detectedYear}</p>
                    )}
                  </div>
                )}

                {/* Reference String Display */}
                <div className="space-y-1 pt-1">
                  {!isBibtex && (
                    <div className={`flex items-center justify-between text-[10px] font-mono p-1.5 rounded ${theme.sidebarSubtleHeaderBg}`}>
                      <span className={theme.sidebarMuted}>In-Text:</span>
                      <code className={`font-bold truncate max-w-[170px] ${theme.sidebarText}`}>{inText}</code>
                      <button
                        onClick={() => handleCopyInText(citation)}
                        className={`text-[9px] uppercase font-bold cursor-pointer ${theme.sidebarMuted} hover:${theme.sidebarText}`}
                      >
                        {copiedId === `intext_${citation.id}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  )}

                  <div className={`pt-1.5 border-t flex justify-between items-center text-xs ${theme.sidebarBorder}`}>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                      {settings.citationStyle}
                    </span>
                    <button
                      onClick={() => handleCopyFull(citation)}
                      className={`text-[9px] uppercase font-bold tracking-wider cursor-pointer ${theme.sidebarMuted} hover:${theme.sidebarText}`}
                    >
                      {copiedId === `full_${citation.id}` ? '✓ Copied' : 'Copy Ref'}
                    </button>
                  </div>
                </div>

                {/* Notes & Tags */}
                {citation.userNote && (
                  <p className={`text-[10px] italic p-1.5 rounded ${theme.sidebarSubtleHeaderBg} ${theme.sidebarMuted}`}>
                    Note: {citation.userNote}
                  </p>
                )}

                {citation.tags && citation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {citation.tags.map((t) => (
                      <span key={t} className={`text-[9px] font-mono px-1 rounded ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Scanned Context */}
                {(citation.contextBefore || citation.contextAfter) && (
                  <div className="pt-1">
                    <button
                      onClick={() => setExpandedContextId(isContextOpen ? null : citation.id)}
                      className={`text-[9px] font-mono flex items-center gap-1 cursor-pointer ${theme.sidebarMuted} hover:${theme.sidebarText}`}
                    >
                      {isContextOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>{isContextOpen ? 'Hide surrounding text' : 'View surrounding text'}</span>
                    </button>

                    {isContextOpen && (
                      <div className={`mt-1 p-2 rounded text-[10px] font-sans space-y-1 ${theme.sidebarSubtleHeaderBg} ${theme.sidebarText}`}>
                        {citation.contextBefore && <p className="opacity-90">…{citation.contextBefore}</p>}
                        {citation.contextAfter && <p className="opacity-90">{citation.contextAfter}…</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Export Selection */}
      <div className={`p-4 border-t shrink-0 space-y-2 ${theme.sidebarSubtleHeaderBg} ${theme.sidebarBorder}`}>
        <span className={`text-[10px] uppercase tracking-widest font-bold block ${theme.sidebarMuted}`}>
          Export Selection
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenExportModal}
            className={`border py-1.5 rounded text-[10px] font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer ${theme.btnSecondary}`}
          >
            <Download className="w-3 h-3" />
            <span>Choose Format</span>
          </button>
          <button
            onClick={handleCopyAllBibliography}
            disabled={citations.length === 0}
            className={`py-1.5 rounded text-[10px] font-bold transition shadow-2xs disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer ${theme.btnPrimary}`}
          >
            {copyAllStatus ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copyAllStatus ? 'Copied' : 'Copy All'}</span>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};

