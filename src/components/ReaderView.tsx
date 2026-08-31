import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Layers, 
  Hash, 
  Quote, 
  FileText, 
  Sparkles, 
  ArrowUpRight, 
  Maximize2,
  Undo2,
  FileCode,
  LayoutTemplate
} from 'lucide-react';
import { CitationEntry, DocumentPage, ReaderSettings, ResearchDocument } from '../types';
import { THEMES } from '../utils/themeStyles';
import { PdfPageView } from './PdfPageView';

interface ReaderViewProps {
  document: ResearchDocument | null;
  settings: ReaderSettings;
  currentPage: number;
  onPageChange: (page: number) => void;
  existingCitations: CitationEntry[];
  onTextSelected: (selectionInfo: {
    text: string;
    pageNumber: number;
    chapterTitle?: string;
    boundingRect: DOMRect;
  } | null) => void;
  onOpenCitationInspector: (citationId?: string) => void;
  onOpenDocumentPicker: () => void;
  jumpHistory?: { previousPage: number; citationId?: string; quoteText?: string } | null;
  onResumePreviousPosition?: () => void;
  targetHighlightQuote?: string | null;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  document,
  settings,
  currentPage,
  onPageChange,
  existingCitations,
  onTextSelected,
  onOpenCitationInspector,
  onOpenDocumentPicker,
  jumpHistory,
  onResumePreviousPosition,
  targetHighlightQuote,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = THEMES[settings.theme] || THEMES.sepia;

  // View mode: 'original' preserves exact PDF/EPUB/HTML layout (images, tables, columns), 'text' provides clean reader view
  const [viewMode, setViewMode] = useState<'original' | 'text'>('original');

  // Sync default view mode when document changes
  useEffect(() => {
    if (document?.fileType === 'pdf' || document?.fileType === 'epub' || document?.fileType === 'html') {
      setViewMode('original');
    }
  }, [document?.id, document?.fileType]);

  // Font family classes
  const fontClasses = {
    serif: 'font-serif-scholarly',
    sans: 'font-sans-scholarly',
    mono: 'font-mono-scholarly',
  };

  // Line height classes
  const lineHeights = {
    relaxed: 'leading-relaxed',
    normal: 'leading-normal',
    compact: 'leading-snug',
  };

  // Content width constraints
  const contentWidths = {
    narrow: 'max-w-2xl',
    medium: 'max-w-3xl',
    wide: 'max-w-4xl',
  };

  const activePage: DocumentPage | undefined = document?.pages?.[currentPage - 1];
  const totalPages = document?.pages?.length || 1;

  // Filter citations for current page
  const pageCitations = existingCitations.filter((c) => c.pageNumber === currentPage);

  // Handle text selection in HTML/Text reader
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      onTextSelected(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) {
      onTextSelected(null);
      return;
    }

    // Check if selection is within our reading container
    if (containerRef.current && containerRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      onTextSelected({
        text: selectedText,
        pageNumber: currentPage,
        chapterTitle: activePage?.chapterTitle,
        boundingRect: rect,
      });
    }
  };

  if (!document) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors duration-150 ${theme.readerCanvasBg} ${theme.rootText}`}>
        <div className={`max-w-lg w-full p-8 rounded border text-center ${theme.cardBg} ${theme.cardBorder} space-y-5 shadow-sm`}>
          <div className={`w-12 h-12 mx-auto rounded ${theme.btnPrimary} flex items-center justify-center shadow-xs`}>
            <Quote className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className={`text-xl font-bold font-serif-scholarly ${theme.sheetHeading}`}>
              Citations Made Easy
            </h2>
            <p className={`text-xs ${theme.sheetMuted} leading-relaxed`}>
              Open a PDF, EPUB, journal paper, or web article to begin reading with instant multi-style citation generation, context scanning, and reference exporting.
            </p>
          </div>
          <button
            onClick={onOpenDocumentPicker}
            className={`w-full py-2.5 px-4 rounded ${theme.btnPrimary} font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer`}
          >
            <FileText className="w-4 h-4" />
            <span>Open or Browse Research Library</span>
          </button>
        </div>
      </div>
    );
  }

  // If document is PDF, and user is in 'original' mode, render high-fidelity PdfPageView
  const isPdf = document.fileType === 'pdf';
  const hasPdfBuffer = Boolean(document.rawArrayBuffer);

  if (isPdf && viewMode === 'original' && hasPdfBuffer) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Jump to Citation Resume Banner */}
        {jumpHistory && onResumePreviousPosition && (
          <div className={`px-6 py-2 border-b flex items-center justify-between text-xs select-none shrink-0 z-30 transition-all ${theme.sheetHighlight} ${theme.sheetHighlightBorder}`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-medium text-[11px]">
                Viewing citation on <strong>Page {currentPage}</strong>
                {jumpHistory.quoteText ? ` ("${jumpHistory.quoteText.slice(0, 45)}…")` : ''}
              </span>
            </div>
            <button
              onClick={onResumePreviousPosition}
              className={`px-3 py-1 rounded text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-xs ${theme.btnPrimary}`}
              title={`Return to your previous position on Page ${jumpHistory.previousPage}`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Resume Reading (Page {jumpHistory.previousPage})</span>
            </button>
          </div>
        )}

        <PdfPageView
          document={document}
          currentPage={currentPage}
          settings={settings}
          onPageChange={onPageChange}
          onTextSelected={(sel) => {
            if (sel) {
              onTextSelected({
                text: sel.text,
                pageNumber: sel.pageNumber,
                chapterTitle: activePage?.chapterTitle,
                boundingRect: sel.rect,
              });
            } else {
              onTextSelected(null);
            }
          }}
          onSwitchToTextMode={() => setViewMode('text')}
        />
      </div>
    );
  }

  // Rich HTML / Text Reader View (for Web, EPUB, HTML, or when text mode is chosen)
  return (
    <div 
      id="reader-view-container"
      className={`flex-1 flex flex-col overflow-hidden transition-colors duration-150 ${theme.readerCanvasBg}`}
      onMouseUp={handleMouseUp}
    >
      {/* Top Document Header Subtitle bar */}
      <div className={`px-6 py-2 border-b flex items-center justify-between text-xs select-none shrink-0 ${theme.headerBorder} ${theme.sidebarSubtleHeaderBg} ${theme.sidebarMuted} font-mono`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
            PAGE {currentPage} OF {totalPages}
          </span>
          {activePage?.chapterTitle && (
            <span className="font-medium truncate max-w-md opacity-90">
              — {activePage.chapterTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle view mode for PDF/HTML */}
          {isPdf && hasPdfBuffer && (
            <button
              onClick={() => setViewMode('original')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 cursor-pointer transition ${theme.btnSecondary}`}
              title="Switch back to original PDF layout with images, equations, and tables"
            >
              <LayoutTemplate className="w-3 h-3 text-amber-500" />
              <span>Original PDF Layout</span>
            </button>
          )}

          {pageCitations.length > 0 && (
            <button
              onClick={() => onOpenCitationInspector()}
              className={`flex items-center gap-1 font-bold text-[11px] hover:underline cursor-pointer ${theme.rootText}`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>{pageCitations.length} {pageCitations.length === 1 ? 'extract' : 'extracts'} on page</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[11px] font-mono opacity-75">
            <span>p. {currentPage}/{totalPages}</span>
          </div>
        </div>
      </div>

      {/* Jump to Citation Resume Banner */}
      {jumpHistory && onResumePreviousPosition && (
        <div className={`px-6 py-2 border-b flex items-center justify-between text-xs select-none shrink-0 transition-all ${theme.sheetHighlight} ${theme.sheetHighlightBorder}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-medium text-[11px]">
              Viewing citation on <strong>Page {currentPage}</strong>
              {jumpHistory.quoteText ? ` ("${jumpHistory.quoteText.slice(0, 45)}…")` : ''}
            </span>
          </div>
          <button
            onClick={onResumePreviousPosition}
            className={`px-3 py-1 rounded text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-xs ${theme.btnPrimary}`}
            title={`Return to your previous position on Page ${jumpHistory.previousPage}`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Resume Reading (Page {jumpHistory.previousPage})</span>
          </button>
        </div>
      )}

      {/* Main Paper Canvas (Scrollable) */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-8 md:px-12 flex justify-center"
      >
        <div className={`w-full ${contentWidths[settings.contentWidth]} transition-all duration-150`}>
          {/* Paper Sheet Frame */}
          <article 
            id={`reader-page-${currentPage}`}
            className={`p-8 md:p-12 rounded border transition-all duration-150 ${theme.sheetBg} ${theme.sheetBorder} shadow-sm`}
          >
            {/* Page Header banner */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-black/10 select-none font-mono text-[10px]">
              <span className={`uppercase tracking-widest ${theme.sheetMuted}`}>
                Page {currentPage} of {totalPages}
              </span>
              <span className={`uppercase tracking-wider ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText} px-2 py-0.5 rounded border text-[9px]`}>
                {document.fileType.toUpperCase()} {activePage?.htmlContent ? 'Document Format' : 'Reader View'}
              </span>
            </div>

            {/* Document Section Heading */}
            {activePage?.chapterTitle && (
              <h2 className={`font-serif text-2xl md:text-3xl mb-6 leading-tight font-normal ${theme.sheetHeading}`}>
                {activePage.chapterTitle}
              </h2>
            )}

            {/* If rich HTML formatting is available (EPUB, HTML, tables, figures), render authentic HTML */}
            {activePage?.htmlContent && viewMode === 'original' ? (
              <div
                className={`scholarly-html-content ${fontClasses[settings.font]} ${lineHeights[settings.lineHeight]} ${theme.selection} select-text leading-relaxed ${theme.sheetText} space-y-4`}
                style={{ fontSize: `${settings.fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: activePage.htmlContent }}
              />
            ) : (
              /* Reflowed text with preserved paragraph breaks */
              <div
                className={`${fontClasses[settings.font]} ${lineHeights[settings.lineHeight]} tracking-normal whitespace-pre-wrap ${theme.selection} select-text text-lg leading-relaxed ${theme.sheetText} space-y-4`}
                style={{ fontSize: `${settings.fontSize}px` }}
              >
                {activePage?.text || 'No text content available on this page.'}
              </div>
            )}

            {/* Existing Citations on this page */}
            {pageCitations.length > 0 && (
              <div className={`mt-10 pt-6 border-t ${theme.sheetBorder} space-y-3`}>
                <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${theme.sheetMuted}`}>
                  <div className="flex items-center gap-1.5">
                    <Quote className="w-3 h-3" />
                    <span>Active Extracts on Page {currentPage} ({pageCitations.length})</span>
                  </div>
                  <span className="text-[9px] opacity-75">Click to view in inspector</span>
                </div>
                <div className="grid gap-2">
                  {pageCitations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onOpenCitationInspector(c.id)}
                      className={`p-3 rounded border text-xs cursor-pointer transition flex items-start justify-between gap-3 ${theme.sheetHighlight} ${theme.sheetHighlightBorder}`}
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-serif-scholarly italic truncate font-medium">
                          "{c.quoteText}"
                        </p>
                        {c.thirdPartyAttribution?.isThirdPartyQuote && c.thirdPartyAttribution.detectedAuthor && (
                          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-mono font-semibold">
                            Attributed to: {c.thirdPartyAttribution.detectedAuthor} ({c.thirdPartyAttribution.detectedYear || 'n.d.'})
                          </span>
                        )}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Bottom Pagination & Progress Controls */}
          <div className="mt-6 mb-8 flex items-center justify-between text-xs select-none px-2 font-mono">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded border ${theme.btnSecondary} font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>[J] Prev Page</span>
            </button>

            {/* Reading progress bar */}
            <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs mx-4">
              <div className={`w-full ${theme.progressTrack} h-1.5 rounded-full overflow-hidden`}>
                <div
                  className={`${theme.progressFill} h-full transition-all duration-200 rounded-full`}
                  style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
              </div>
              <span className={`text-[10px] ${theme.sheetMuted} shrink-0 font-semibold`}>
                {Math.round((currentPage / totalPages) * 100)}%
              </span>
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded border ${theme.btnSecondary} font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer`}
            >
              <span>Next Page [K]</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scoped styling for rich HTML tables, images, blockquotes */}
      <style>{`
        .scholarly-html-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9em;
        }
        .scholarly-html-content th, .scholarly-html-content td {
          border: 1px solid rgba(0, 0, 0, 0.15);
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .scholarly-html-content th {
          background: rgba(0, 0, 0, 0.05);
          font-weight: bold;
        }
        .scholarly-html-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5rem auto;
          border-radius: 4px;
          display: block;
        }
        .scholarly-html-content blockquote {
          border-left: 3px solid rgba(217, 119, 6, 0.6);
          padding-left: 1rem;
          margin: 1.25rem 0;
          font-style: italic;
          opacity: 0.9;
        }
        .scholarly-html-content ul, .scholarly-html-content ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .scholarly-html-content ul {
          list-style-type: disc;
        }
        .scholarly-html-content ol {
          list-style-type: decimal;
        }
      `}</style>
    </div>
  );
};
