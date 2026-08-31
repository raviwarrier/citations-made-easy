import React, { useState, useEffect, useCallback } from 'react';
import { 
  CitationEntry, 
  CitationStyle, 
  DocumentPage, 
  ReaderSettings, 
  ReadingTheme, 
  ResearchDocument 
} from './types';
import { DEFAULT_SETTINGS, appendDocCitation, deleteDocCitation, loadDocCitations, loadUserSettings, recordRecentDoc, saveUserSettings } from './utils/storage';
import { SAMPLE_DOCUMENTS, SAMPLE_INITIAL_CITATIONS } from './data/sampleDocuments';
import { scanSelectionContext } from './utils/contextScanner';
import { formatFullCitation, formatInTextCitation } from './utils/citationFormatter';
import { THEMES } from './utils/themeStyles';
import { generateSamplePdfBuffer } from './utils/samplePdfGenerator';
import { 
  loadActiveDocumentSession, 
  saveActiveDocumentSession, 
  saveActivePagePosition 
} from './utils/documentStorage';

import { ReaderHeader } from './components/ReaderHeader';
import { ReaderView } from './components/ReaderView';
import { SelectionToolbar } from './components/SelectionToolbar';
import { CitationInspector } from './components/CitationInspector';
import { DocumentMetadataSidebar } from './components/DocumentMetadataSidebar';
import { ReaderFooter } from './components/ReaderFooter';
import { DocumentPickerModal } from './components/DocumentPickerModal';
import { ExportModal } from './components/ExportModal';
import { EditCitationModal } from './components/EditCitationModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { LocalBackupBanner } from './components/LocalBackupBanner';
import { MobileNoticeBanner } from './components/MobileNoticeBanner';

export default function App() {
  // 1. Settings state
  const [settings, setSettings] = useState<ReaderSettings>(loadUserSettings);

  // 2. Active Document & Page state
  const [activeDocument, setActiveDocument] = useState<ResearchDocument | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSessionLoaded, setIsSessionLoaded] = useState<boolean>(false);

  // 3. Document Citations state (auto-loaded per document fingerprint)
  const [citations, setCitations] = useState<CitationEntry[]>([]);

  // 4. Modals & Sidebars (auto-collapsed on mobile by default to maximize reader space)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [isMetaSidebarOpen, setIsMetaSidebarOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1280 : true;
  });
  const [isDocPickerOpen, setIsDocPickerOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [editingCitation, setEditingCitation] = useState<CitationEntry | null>(null);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);

  // 4b. Jump History state for "Resume Reading"
  const [jumpHistory, setJumpHistory] = useState<{
    previousPage: number;
    citationId?: string;
    quoteText?: string;
  } | null>(null);

  // 5. Selection & Context Extraction state
  const [selectionData, setSelectionData] = useState<{
    text: string;
    pageNumber: number;
    chapterTitle?: string;
    boundingRect: DOMRect;
  } | null>(null);

  const [isCopiedToast, setIsCopiedToast] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Show temporary toast message
  const showToast = (message: string) => {
    setToastNotification(message);
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Update & Persist Settings
  const handleUpdateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveUserSettings(updated);
      return updated;
    });
  }, []);

  // Cycle Reading Theme (Paper -> Sepia -> Slate -> Onyx)
  const cycleTheme = useCallback(() => {
    const themes: ReadingTheme[] = ['paper', 'sepia', 'slate', 'onyx'];
    const nextIdx = (themes.indexOf(settings.theme) + 1) % themes.length;
    handleUpdateSettings({ theme: themes[nextIdx] });
    showToast(`Switched theme: ${themes[nextIdx].toUpperCase()}`);
  }, [settings.theme, handleUpdateSettings]);

  // Page change handler with instant position persistence
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    saveActivePagePosition(newPage);
  }, []);

  // Restore last active document and reading position on application startup
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const savedSession = await loadActiveDocumentSession();
        if (!isMounted) return;

        if (savedSession && savedSession.document) {
          const doc = savedSession.document;
          if (doc.fileType === 'pdf' && !doc.rawArrayBuffer) {
            try {
              doc.rawArrayBuffer = generateSamplePdfBuffer(doc);
            } catch {
              // ignore
            }
          }
          setActiveDocument(doc);
          setCurrentPage(savedSession.pageNumber || 1);
        } else {
          // Fallback to sample document for first-time visitors
          const sampleDoc = SAMPLE_DOCUMENTS[0];
          if (sampleDoc && sampleDoc.fileType === 'pdf' && !sampleDoc.rawArrayBuffer) {
            try {
              sampleDoc.rawArrayBuffer = generateSamplePdfBuffer(sampleDoc);
            } catch {
              // ignore
            }
          }
          setActiveDocument(sampleDoc);
          setCurrentPage(1);
          saveActiveDocumentSession(sampleDoc, 1);
        }
      } catch (err) {
        console.warn('Session init error:', err);
        const fallback = SAMPLE_DOCUMENTS[0];
        setActiveDocument(fallback);
      } finally {
        if (isMounted) setIsSessionLoaded(true);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load document citations upon changing active document
  useEffect(() => {
    if (!activeDocument) return;

    // Record document in recent history
    recordRecentDoc({
      fingerprint: activeDocument.fingerprint,
      title: activeDocument.title,
      authors: activeDocument.authors,
      year: activeDocument.publicationYear,
      fileType: activeDocument.fileType,
    });

    // Check local storage for existing citations for this specific document
    let docCitations = loadDocCitations(activeDocument.fingerprint);

    // If initial sample paper with no citations yet, seed initial ones for demo
    if (
      docCitations.length === 0 &&
      activeDocument.fingerprint === 'sample_quantum_2024_hash'
    ) {
      docCitations = SAMPLE_INITIAL_CITATIONS;
      docCitations.forEach((c) => appendDocCitation(c));
    }

    setCitations(docCitations);
    setSelectionData(null);
  }, [activeDocument]);

  // Select new document handler
  const handleSelectDocument = (doc: ResearchDocument, targetPage: number = 1) => {
    if (doc.fileType === 'pdf' && !doc.rawArrayBuffer) {
      try {
        doc.rawArrayBuffer = generateSamplePdfBuffer(doc);
      } catch (e) {
        console.warn('Sample PDF buffer generation:', e);
      }
    }
    setActiveDocument(doc);
    setCurrentPage(targetPage);
    saveActiveDocumentSession(doc, targetPage);
  };

  // Extract selected text into citation entry (Core Feature 1 & 2 & 3)
  const handleExtractSelection = useCallback(() => {
    if (!selectionData || !activeDocument) return;

    const { text, pageNumber, chapterTitle } = selectionData;

    // Scan full page / document text around selection for prior/succeeding context & 3rd party authors
    const fullPageText = activeDocument.pages[pageNumber - 1]?.text || text;
    const scanResult = scanSelectionContext(fullPageText, text);

    const newCitation: CitationEntry = {
      id: `cite_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      docFingerprint: activeDocument.fingerprint,
      docTitle: activeDocument.title,
      quoteText: text,
      pageNumber,
      pageNumberDisplay: `p. ${pageNumber}`,
      chapterName: chapterTitle || activeDocument.chapterName,
      authors: activeDocument.authors,
      publicationYear: activeDocument.publicationYear,
      publicationDate: activeDocument.publicationDate,
      sourceOrPublisher: activeDocument.sourceOrPublisher,
      journalOrBookTitle: activeDocument.journalOrBookTitle,
      volume: activeDocument.volume,
      issue: activeDocument.issue,
      edition: activeDocument.edition,
      instituteOrOrg: activeDocument.instituteOrOrg,
      doi: activeDocument.doi,
      url: activeDocument.url,
      isbn: activeDocument.isbn,
      arxivId: activeDocument.arxivId,
      contextBefore: scanResult.contextBefore,
      contextAfter: scanResult.contextAfter,
      thirdPartyAttribution: scanResult.attribution,
      tags: [],
      createdAt: Date.now(),
    };

    // Append and persist locally
    const updated = appendDocCitation(newCitation);
    setCitations(updated);
    setSelectedCitationId(newCitation.id);
    setIsSidebarOpen(true);
    setSelectionData(null);

    // Clear browser selection
    window.getSelection()?.removeAllRanges();

    if (scanResult.attribution.isThirdPartyQuote && scanResult.attribution.detectedAuthor) {
      showToast(`Extracted citation! Detected: ${scanResult.attribution.detectedAuthor}`);
    } else {
      showToast(`Citation extracted from Page ${pageNumber}!`);
    }
  }, [selectionData, activeDocument]);

  // Quick Copy formatted citation of selection
  const handleQuickCopySelection = useCallback(() => {
    if (!selectionData || !activeDocument) return;

    const { text, pageNumber, chapterTitle } = selectionData;
    const tempEntry: CitationEntry = {
      id: 'temp',
      docFingerprint: activeDocument.fingerprint,
      docTitle: activeDocument.title,
      quoteText: text,
      pageNumber,
      pageNumberDisplay: `p. ${pageNumber}`,
      chapterName: chapterTitle,
      authors: activeDocument.authors,
      publicationYear: activeDocument.publicationYear,
      sourceOrPublisher: activeDocument.sourceOrPublisher,
      journalOrBookTitle: activeDocument.journalOrBookTitle,
      doi: activeDocument.doi,
      tags: [],
      createdAt: Date.now(),
    };

    const inText = formatInTextCitation(tempEntry, settings.citationStyle);
    const full = formatFullCitation(tempEntry, settings.citationStyle);
    const copyString = `"${text}" — ${inText}\n\nReference: ${full}`;

    navigator.clipboard.writeText(copyString);
    setIsCopiedToast(true);
    setTimeout(() => setIsCopiedToast(false), 2000);
    showToast(`Copied ${settings.citationStyle.toUpperCase()} citation to clipboard!`);
  }, [selectionData, activeDocument, settings.citationStyle]);

  // Scan context explicitly
  const handleScanContext = useCallback(() => {
    if (!selectionData || !activeDocument) return;
    const { text, pageNumber } = selectionData;
    const fullPageText = activeDocument.pages[pageNumber - 1]?.text || text;
    const scanResult = scanSelectionContext(fullPageText, text);

    if (scanResult.attribution.detectedAuthor) {
      showToast(`Captured context! Attributed to: ${scanResult.attribution.detectedAuthor} (${scanResult.attribution.detectedYear || 'n.d.'})`);
    } else {
      showToast(`Captured context: ${scanResult.contextBefore ? 'Saved surrounding sentences.' : 'Direct primary source quote.'}`);
    }
    // Now extract with scanned metadata
    handleExtractSelection();
  }, [selectionData, activeDocument, handleExtractSelection]);

  // Delete citation
  const handleDeleteCitation = (id: string) => {
    if (!activeDocument) return;
    const updated = deleteDocCitation(activeDocument.fingerprint, id);
    setCitations(updated);
    if (selectedCitationId === id) setSelectedCitationId(null);
    showToast('Citation deleted.');
  };

  // Save edited citation
  const handleSaveEditedCitation = (updated: CitationEntry) => {
    const list = appendDocCitation(updated);
    setCitations(list);
    showToast('Citation updated successfully.');
  };

  // Jump to specific citation location in document
  const handleJumpToCitation = (page: number, citation?: CitationEntry) => {
    setJumpHistory({
      previousPage: currentPage,
      citationId: citation?.id,
      quoteText: citation?.quoteText,
    });
    handlePageChange(page);
    if (citation?.id) {
      setSelectedCitationId(citation.id);
    }
    showToast(`Jumped to Page ${page} (Citation Extract)`);
  };

  // Resume reading to position prior to jump
  const handleResumePreviousPosition = () => {
    if (jumpHistory) {
      const prev = jumpHistory.previousPage;
      setJumpHistory(null);
      handlePageChange(prev);
      showToast(`Resumed reading on Page ${prev}`);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        setIsDocPickerOpen(false);
        setIsExportModalOpen(false);
        setIsShortcutsOpen(false);
        setEditingCitation(null);
        setSelectionData(null);
        window.getSelection()?.removeAllRanges();
      } else if (e.key === 'j' || e.key === 'ArrowLeft') {
        // Previous page
        if (currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      } else if (e.key === 'k' || e.key === 'ArrowRight') {
        // Next page
        if (activeDocument && currentPage < activeDocument.pages.length) {
          handlePageChange(currentPage + 1);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        // Extract selection
        if (selectionData) {
          e.preventDefault();
          handleExtractSelection();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        // Quick copy citation
        if (selectionData) {
          e.preventDefault();
          handleQuickCopySelection();
        }
      } else if (e.key === 's' || e.key === 'S') {
        // Scan context
        if (selectionData) {
          e.preventDefault();
          handleScanContext();
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMetaSidebarOpen((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleUpdateSettings({ focusMode: !settings.focusMode });
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        cycleTheme();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setIsDocPickerOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPage,
    activeDocument,
    selectionData,
    settings.focusMode,
    handleExtractSelection,
    handleQuickCopySelection,
    handleScanContext,
    handleUpdateSettings,
    cycleTheme,
  ]);

  const totalPages = activeDocument?.pages?.length || 1;
  const currentTheme = THEMES[settings.theme] || THEMES.sepia;

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${currentTheme.rootBg} ${currentTheme.rootText} selection:bg-[#FBBF24] selection:text-[#2C2C2C] font-sans antialiased`}>
      {/* 1. Offline Local Storage Safety Banner */}
      <LocalBackupBanner />

      {/* 2. Main Reader Header */}
      {!settings.focusMode && (
        <ReaderHeader
          document={activeDocument}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenDocumentPicker={() => setIsDocPickerOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          onToggleMetaSidebar={() => setIsMetaSidebarOpen((prev) => !prev)}
          isMetaSidebarOpen={isMetaSidebarOpen}
          citationCount={citations.length}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          onPrevPage={() => handlePageChange(Math.max(1, currentPage - 1))}
        />
      )}

      {/* Mobile Advisory & Quick Action Banner (visible on <768px screens until dismissed) */}
      {!settings.focusMode && (
        <MobileNoticeBanner
          theme={settings.theme}
          onOpenMeta={() => setIsMetaSidebarOpen(true)}
          onOpenCitations={() => setIsSidebarOpen(true)}
          citationCount={citations.length}
        />
      )}

      {/* 3. Main Layout: Left Metadata Drawer + Reading Canvas + Right Extracts Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Metadata & Controls Sidebar */}
        {isMetaSidebarOpen && !settings.focusMode && (
          <DocumentMetadataSidebar
            document={activeDocument}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenDocumentPicker={() => setIsDocPickerOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onClose={() => setIsMetaSidebarOpen(false)}
            onSaveLocalBackup={() => showToast('Session and citations saved locally to browser storage.')}
          />
        )}

        {/* Center Main Reading Canvas */}
        <ReaderView
          document={activeDocument}
          settings={settings}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          existingCitations={citations}
          onTextSelected={setSelectionData}
          onOpenCitationInspector={(citationId) => {
            if (citationId) setSelectedCitationId(citationId);
            setIsSidebarOpen(true);
          }}
          onOpenDocumentPicker={() => setIsDocPickerOpen(true)}
          jumpHistory={jumpHistory}
          onResumePreviousPosition={handleResumePreviousPosition}
          targetHighlightQuote={jumpHistory?.quoteText}
        />

        {/* Floating Context Selection Toolbar */}
        {selectionData && (
          <SelectionToolbar
            position={{
              top: selectionData.boundingRect.top,
              left: selectionData.boundingRect.left + selectionData.boundingRect.width / 2 - 150,
            }}
            selectedText={selectionData.text}
            pageNumber={selectionData.pageNumber}
            chapterTitle={selectionData.chapterTitle}
            onExtractCitation={handleExtractSelection}
            onQuickCopy={handleQuickCopySelection}
            onScanContext={handleScanContext}
            onAddNote={() => {
              handleExtractSelection();
            }}
            isCopied={isCopiedToast}
            citationStyle={settings.citationStyle}
            theme={settings.theme}
          />
        )}

        {/* Right Reference Manager / Citation Inspector (Toggleable) */}
        {isSidebarOpen && !settings.focusMode && (
          <CitationInspector
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            document={activeDocument}
            citations={citations}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onDeleteCitation={handleDeleteCitation}
            onEditCitation={(citation) => setEditingCitation(citation)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            selectedCitationId={selectedCitationId}
            onJumpToPage={handleJumpToCitation}
          />
        )}
      </div>

      {/* 4. Bottom Shortcut & Status Bar */}
      {!settings.focusMode && (
        <ReaderFooter
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onSaveLocalBackup={() => {
            showToast('All extracts & metadata saved to local storage!');
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onToggleMetadata={() => setIsMetaSidebarOpen((v) => !v)}
          citationCount={citations.length}
          theme={settings.theme}
        />
      )}

      {/* 5. Modals */}
      <DocumentPickerModal
        isOpen={isDocPickerOpen}
        onClose={() => setIsDocPickerOpen(false)}
        onSelectDocument={handleSelectDocument}
        currentDocFingerprint={activeDocument?.fingerprint}
        theme={settings.theme}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        document={activeDocument}
        citations={citations}
        currentStyle={settings.citationStyle}
        theme={settings.theme}
      />

      <EditCitationModal
        isOpen={Boolean(editingCitation)}
        onClose={() => setEditingCitation(null)}
        citation={editingCitation}
        onSave={handleSaveEditedCitation}
        theme={settings.theme}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        theme={settings.theme}
      />

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md shadow-2xl text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2 select-none border ${THEMES[settings.theme].toastBg} ${THEMES[settings.theme].toastBorder} ${THEMES[settings.theme].toastText}`}>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{toastNotification}</span>
        </div>
      )}
    </div>
  );
}

