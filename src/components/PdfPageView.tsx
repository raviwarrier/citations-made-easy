import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ReaderSettings, ResearchDocument } from '../types';
import { THEMES } from '../utils/themeStyles';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker setup:', err);
  }
}

interface PdfPageViewProps {
  document: ResearchDocument;
  currentPage: number;
  settings: ReaderSettings;
  onPageChange: (page: number) => void;
  onTextSelected: (selection: {
    text: string;
    pageNumber: number;
    contextBefore?: string;
    contextAfter?: string;
    rect: DOMRect;
  } | null) => void;
  onSwitchToTextMode?: () => void;
}

export const PdfPageView: React.FC<PdfPageViewProps> = ({
  document: doc,
  currentPage,
  settings,
  onPageChange,
  onTextSelected,
  onSwitchToTextMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState<number>(1.25);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 800 });

  const renderTaskRef = useRef<any>(null);
  const theme = THEMES[settings.theme] || THEMES.sepia;

  // 1. Load PDF Document Proxy when doc.rawArrayBuffer or doc changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setRenderError(null);

    async function loadPdf() {
      try {
        let data: ArrayBuffer | Uint8Array | undefined = doc.rawArrayBuffer;
        
        // If no raw buffer, try to create from sample or fallback
        if (!data) {
          throw new Error('PDF binary stream is not loaded.');
        }

        // Use a slice to prevent detachment issues
        const bufferCopy = data.slice(0);
        const loadingTask = pdfjsLib.getDocument({
          data: bufferCopy,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/',
          cMapPacked: true,
        });

        const loadedPdf = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDocProxy(loadedPdf);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error loading PDF Document:', err);
          setRenderError(err?.message || 'Failed to render PDF page. You can switch to Clean Text Reader mode.');
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [doc.id, doc.rawArrayBuffer]);

  // 2. Render Page to Canvas & TextLayer
  const renderPage = useCallback(async () => {
    if (!pdfDocProxy || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancellation
        }
      }

      setIsLoading(true);
      const page = await pdfDocProxy.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      setPageDimensions({ width: viewport.width, height: viewport.height });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      // White background for authentic paper look
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      ctx.restore();

      // 3. Render Text Content Overlay for native text selection
      if (textLayerRef.current) {
        const textLayerDiv = textLayerRef.current;
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

        const textContent = await page.getTextContent();

        // Build absolute positioned spans matching exact PDF coordinates
        textContent.items.forEach((item: any) => {
          if (!('str' in item) || !item.str) return;

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
          
          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - fontHeight}px`;
          span.style.fontSize = `${fontHeight}px`;
          span.style.fontFamily = item.fontName || 'sans-serif';
          span.style.position = 'absolute';
          span.style.color = 'transparent';
          span.style.whiteSpace = 'pre';
          span.style.cursor = 'text';
          span.style.lineHeight = '1';
          span.style.transformOrigin = '0% 0%';

          textLayerDiv.appendChild(span);
        });
      }

      setIsLoading(false);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering PDF page:', err);
        setRenderError('Could not render this specific page. Switch to text mode if needed.');
        setIsLoading(false);
      }
    }
  }, [pdfDocProxy, currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // 4. Handle text selection on PDF Text Layer
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 3) {
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Ensure selection is within our text layer or container
      if (containerRef.current && containerRef.current.contains(range.commonAncestorContainer)) {
        onTextSelected({
          text: selectedText,
          pageNumber: currentPage,
          rect,
        });
      }
    } catch (e) {
      console.warn('Selection error:', e);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.7, +(s - 0.2).toFixed(2)));
  const handleZoomReset = () => setScale(1.25);
  const handleFitWidth = () => {
    if (containerRef.current) {
      const availableWidth = containerRef.current.clientWidth - 80;
      const newScale = +(availableWidth / (pageDimensions.width / scale)).toFixed(2);
      setScale(Math.max(0.7, Math.min(2.2, newScale)));
    }
  };

  const totalPages = doc.pages?.length || (pdfDocProxy ? pdfDocProxy.numPages : 1);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      {/* Top PDF Controls Toolbar */}
      <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${theme.sidebarSubtleHeaderBg} ${theme.sidebarBorder}`}>
        {/* Left: Page Navigation & Mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded px-1 py-0.5 shadow-2xs">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={`p-1 rounded transition disabled:opacity-30 cursor-pointer hover:${theme.rootText}`}
              title="Previous Page (Arrow Left)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold px-1.5 min-w-[65px] text-center">
              p. {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`p-1 rounded transition disabled:opacity-30 cursor-pointer hover:${theme.rootText}`}
              title="Next Page (Arrow Right)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
            Authentic PDF Format
          </span>
        </div>

        {/* Middle/Right: Zoom & Display Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded px-1 py-0.5 shadow-2xs">
            <button
              onClick={handleZoomOut}
              className={`p-1 rounded transition cursor-pointer hover:${theme.rootText}`}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-12 text-center font-semibold">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className={`p-1 rounded transition cursor-pointer hover:${theme.rootText}`}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomReset}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition cursor-pointer hover:${theme.rootText}`}
              title="Reset Zoom (125%)"
            >
              100%
            </button>
            <button
              onClick={handleFitWidth}
              className={`p-1 rounded transition cursor-pointer hover:${theme.rootText}`}
              title="Fit to Width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {onSwitchToTextMode && (
            <button
              onClick={onSwitchToTextMode}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition flex items-center gap-1 cursor-pointer ${theme.btnSecondary}`}
              title="Switch to Reflowed Text Reader"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Clean Text View</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Canvas Stage */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={`flex-1 overflow-auto p-6 md:p-10 flex justify-center items-start ${theme.rootBg}`}
        style={{ cursor: 'text' }}
      >
        {renderError ? (
          <div className={`max-w-md p-6 rounded-lg border text-center space-y-3 ${theme.cardBg} ${theme.cardBorder}`}>
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-sm">PDF Render Notice</h4>
            <p className={`text-xs ${theme.sidebarMuted}`}>{renderError}</p>
            {onSwitchToTextMode && (
              <button
                onClick={onSwitchToTextMode}
                className={`px-4 py-2 rounded text-xs font-bold transition shadow-xs flex items-center gap-2 mx-auto cursor-pointer ${theme.btnPrimary}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open in Clean Text Reader</span>
              </button>
            )}
          </div>
        ) : (
          <div 
            className="relative shadow-2xl rounded-sm transition-all duration-75 border border-black/15 bg-white select-text"
            style={{
              width: `${pageDimensions.width}px`,
              height: `${pageDimensions.height}px`,
            }}
          >
            {/* Canvas for visual PDF graphics, math formulas, figures, images, columns */}
            <canvas
              ref={canvasRef}
              className="block rounded-sm pointer-events-none"
              style={{
                width: `${pageDimensions.width}px`,
                height: `${pageDimensions.height}px`,
              }}
            />

            {/* Selectable transparent text layer for text selection & citations */}
            <div
              ref={textLayerRef}
              className="pdf-text-layer absolute top-0 left-0 overflow-hidden leading-none select-text cursor-text"
              style={{
                width: `${pageDimensions.width}px`,
                height: `${pageDimensions.height}px`,
              }}
            />

            {/* Loading spinner overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-10">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-mono font-medium text-stone-700">
                  Rendering Page {currentPage}...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global CSS for crisp amber text selection on PDF canvas */}
      <style>{`
        .pdf-text-layer span::selection {
          background: rgba(245, 158, 11, 0.42) !important;
          color: transparent !important;
        }
      `}</style>
    </div>
  );
};
