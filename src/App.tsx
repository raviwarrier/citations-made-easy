import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  saveActivePagePosition,
  clearActiveDocumentSession
} from './utils/documentStorage';
import { querySqliteCitations, saveCitationToSqlite, deleteCitationFromSqlite } from './utils/sqliteDb';

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
import { MobileNoticeBanner } from './components/MobileNoticeBanner';
import { PostItNoteModal } from './components/PostItNoteModal';
import { CitationsRepositoryView } from './components/CitationsRepositoryView';

export default function App() {
  // 1. Settings state (Default dark mode onyx)
  const [settings, setSettings] = useState<ReaderSettings>(loadUserSettings);

  // 2. Active Document & Page state (Opens blank on startup)
  const [activeDocument, setActiveDocument] = useState<ResearchDocument | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSessionLoaded, setIsSessionLoaded] = useState<boolean>(false);

  // 3. Document Citations state (auto-loaded per document fingerprint)
  const [citations, setCitations] = useState<CitationEntry[]>([]);

  // 3b. SQLite Full Repository Citations (Across all papers/articles/books)
  const [allRepositoryCitations, setAllRepositoryCitations] = useState<CitationEntry[]>([]);
  const [isRepositoryOpen, setIsRepositoryOpen] = useState<boolean>(false);

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

  // 5b. Pending citation extraction for Pastel Yellow Post-It Note capture
  const [pendingPostItData, setPendingPostItData] = useState<{
    text: string;
    pageNumber: number;
    chapterTitle?: string;
    contextBefore?: string;
    contextAfter?: string;
    attribution?: any;
  } | null>(null);

  const [isCopiedToast, setIsCopiedToast] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Show temporary toast message
  const showToast = (message: string) => {
    setToastNotification(message);
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Load all citations from SQLite repository
  const refreshRepositoryCitations = useCallback(async () => {
    try {
      const all = await querySqliteCitations();
      setAllRepositoryCitations(all);
    } catch (err) {
      console.warn('Failed to query SQLite repository:', err);
    }
  }, []);

  // Update & Persist Settings
  const handleUpdateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveUserSettings(updated);
      return updated;
    });
  }, []);

  // Cycle Reading Theme (Onyx -> Slate -> Paper -> Sepia)
  const cycleTheme = useCallback(() => {
    const themes: ReadingTheme[] = ['onyx', 'slate', 'paper', 'sepia'];
    const nextIdx = (themes.indexOf(settings.theme) + 1) % themes.length;
    handleUpdateSettings({ theme: themes[nextIdx] });
    showToast(`Switched theme: ${themes[nextIdx].toUpperCase()}`);
  }, [settings.theme, handleUpdateSettings]);

  // Page change handler with instant position persistence
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    saveActivePagePosition(newPage);
  }, []);

  // Initialize on startup: Open Blank (Requirement 4) & Load SQLite Repository
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // Refresh SQLite Citations
        await refreshRepositoryCitations();

        const savedSession = await loadActiveDocumentSession();
        if (!isMounted) return;

        // If user previously opened a document, restore it; otherwise open blank
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
          // Open blank on startup (Requirement 4)
          setActiveDocument(null);
          setCurrentPage(1);
        }
      } catch (err) {
        console.warn('Session init error:', err);
        setActiveDocument(null);
      } finally {
        if (isMounted) setIsSessionLoaded(true);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [refreshRepositoryCitations]);

  // Load document citations upon changing active document
  useEffect(() => {
    if (!activeDocument) {
      setCitations([]);
      return;
    }

    // Record document in recent history
    recordRecentDoc({
      fingerprint: activeDocument.fingerprint,
      title: activeDocument.title,
      authors: activeDocument.authors,
      year: activeDocument.publicationYear,
      fileType: activeDocument.fileType,
    });

    // Check local storage for existing citations for this specific document
    const docCitations = loadDocCitations(activeDocument.fingerprint);
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

  // Close currently opened document and return to the opening screen
  const handleCloseDocument = useCallback(async () => {
    setActiveDocument(null);
    setCurrentPage(1);
    setSelectionData(null);
    setPendingPostItData(null);
    setJumpHistory(null);
    setSelectedCitationId(null);
    window.getSelection()?.removeAllRanges();
    await clearActiveDocumentSession();
    showToast('Document closed. Returned to opening screen.');
  }, []);

  // Trigger Citation Capture: Opens Pastel Yellow Post-It Note (Requirement 2)
  const handleExtractSelection = useCallback(() => {
    if (!selectionData || !activeDocument) return;

    const { text, pageNumber, chapterTitle } = selectionData;
    const fullPageText = activeDocument.pages[pageNumber - 1]?.text || text;
    const scanResult = scanSelectionContext(fullPageText, text);

    // Show Post-It Note capture overlay
    setPendingPostItData({
      text,
      pageNumber,
      chapterTitle: chapterTitle || activeDocument.chapterName,
      contextBefore: scanResult.contextBefore,
      contextAfter: scanResult.contextAfter,
      attribution: scanResult.attribution,
    });
  }, [selectionData, activeDocument]);

  // Confirm Save from Pastel Yellow Post-It Note (Pins to SQLite DB & local state)
  const handleConfirmPostItSave = (userNote: string, tags: string[]) => {
    if (!pendingPostItData || !activeDocument) return;

    const { text, pageNumber, chapterTitle, contextBefore, contextAfter, attribution } = pendingPostItData;

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
      contextBefore,
      contextAfter,
      thirdPartyAttribution: attribution,
      tags: tags || [],
      userNote: userNote || undefined,
      createdAt: Date.now(),
    };

    // Append to document citations and save to SQLite
    const updated = appendDocCitation(newCitation);
    setCitations(updated);
    setSelectedCitationId(newCitation.id);
    setIsSidebarOpen(true);
    setSelectionData(null);
    setPendingPostItData(null);

    // Refresh repository citations list
    refreshRepositoryCitations();

    // Clear browser selection
    window.getSelection()?.removeAllRanges();

    if (attribution?.isThirdPartyQuote && attribution.detectedAuthor) {
      showToast(`Citation pinned to SQLite! Detected: ${attribution.detectedAuthor}`);
    } else {
      showToast(`Citation & Post-It pinned to SQLite DB! (Page ${pageNumber})`);
    }
  };

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
    // Open Post-It note with context attached
    handleExtractSelection();
  }, [selectionData, activeDocument, handleExtractSelection]);

  // Delete citation
  const handleDeleteCitation = (id: string, fingerprint?: string) => {
    const docFp = fingerprint || activeDocument?.fingerprint;
    if (!docFp) return;
    const updated = deleteDocCitation(docFp, id);
    if (activeDocument && activeDocument.fingerprint === docFp) {
      setCitations(updated);
    }
    if (selectedCitationId === id) setSelectedCitationId(null);
    refreshRepositoryCitations();
    showToast('Citation deleted from SQLite database.');
  };

  // Save edited citation
  const handleSaveEditedCitation = (updated: CitationEntry) => {
    const list = appendDocCitation(updated);
    if (activeDocument && activeDocument.fingerprint === updated.docFingerprint) {
      setCitations(list);
    }
    refreshRepositoryCitations();
    showToast('Citation & notes updated in SQLite DB.');
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

  // Open source in reader from full repository view
  const handleOpenSourceInReader = (docFingerprint: string, pageNumber: number) => {
    setIsRepositoryOpen(false);
    // Find doc in sample documents or load
    const foundDoc = SAMPLE_DOCUMENTS.find((d) => d.fingerprint === docFingerprint);
    if (foundDoc) {
      handleSelectDocument(foundDoc, pageNumber);
    } else {
      showToast(`Opening document at Page ${pageNumber}...`);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const isModalOpen = Boolean(
        pendingPostItData ||
        editingCitation ||
        isDocPickerOpen ||
        isExportModalOpen ||
        isShortcutsOpen ||
        isRepositoryOpen
      );

      if (e.key === 'Escape') {
        setIsDocPickerOpen(false);
        setIsExportModalOpen(false);
        setIsShortcutsOpen(false);
        setIsRepositoryOpen(false);
        setEditingCitation(null);
        setSelectionData(null);
        setPendingPostItData(null);
        window.getSelection()?.removeAllRanges();
        return;
      }

      // If any modal/overlay is currently active, do not execute reader shortcuts
      if (isModalOpen) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowLeft') {
        if (currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      } else if (e.key === 'k' || e.key === 'ArrowRight') {
        if (activeDocument && currentPage < activeDocument.pages.length) {
          handlePageChange(currentPage + 1);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (selectionData) {
          e.preventDefault();
          handleExtractSelection();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (selectionData) {
          e.preventDefault();
          handleQuickCopySelection();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (selectionData) {
          e.preventDefault();
          handleScanContext();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        refreshRepositoryCitations();
        setIsRepositoryOpen((prev) => !prev);
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
      } else if (e.key === 'w' || e.key === 'W') {
        if (activeDocument) {
          e.preventDefault();
          handleCloseDocument();
        }
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
    pendingPostItData,
    editingCitation,
    isDocPickerOpen,
    isExportModalOpen,
    isShortcutsOpen,
    isRepositoryOpen,
    handleExtractSelection,
    handleQuickCopySelection,
    handleScanContext,
    handleCloseDocument,
    handleUpdateSettings,
    cycleTheme,
    refreshRepositoryCitations,
  ]);

  const totalPages = activeDocument?.pages?.length || 1;
  const currentTheme = THEMES[settings.theme] || THEMES.onyx;

  // Unique tags collected across all SQLite repository citations
  const repositoryTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of allRepositoryCitations) {
      if (c.tags && Array.isArray(c.tags)) {
        c.tags.forEach((t) => {
          const clean = t.trim();
          if (clean) set.add(clean);
        });
      }
    }
    return Array.from(set);
  }, [allRepositoryCitations]);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${currentTheme.rootBg} ${currentTheme.rootText} selection:bg-[#FBBF24] selection:text-[#2C2C2C] font-sans antialiased`}>
      {/* 1. Main Reader Header */}
      {!settings.focusMode && (
        <ReaderHeader
          document={activeDocument}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenDocumentPicker={() => setIsDocPickerOpen(true)}
          onCloseDocument={handleCloseDocument}
          onOpenRepository={() => {
            refreshRepositoryCitations();
            setIsRepositoryOpen(true);
          }}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          onToggleMetaSidebar={() => setIsMetaSidebarOpen((prev) => !prev)}
          isMetaSidebarOpen={isMetaSidebarOpen}
          citationCount={citations.length}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
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

      {/* 2. Main Layout: Left Metadata Drawer + Reading Canvas + Right Extracts Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Metadata & Controls Sidebar */}
        {isMetaSidebarOpen && !settings.focusMode && (
          <DocumentMetadataSidebar
            document={activeDocument}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenDocumentPicker={() => setIsDocPickerOpen(true)}
            onCloseDocument={handleCloseDocument}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onClose={() => setIsMetaSidebarOpen(false)}
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
          onSelectDocument={handleSelectDocument}
          onOpenRepository={() => {
            refreshRepositoryCitations();
            setIsRepositoryOpen(true);
          }}
          allRepositoryCitationsCount={allRepositoryCitations.length}
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
            onDeleteCitation={(id) => handleDeleteCitation(id)}
            onEditCitation={(citation) => setEditingCitation(citation)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            selectedCitationId={selectedCitationId}
            onJumpToPage={handleJumpToCitation}
          />
        )}
      </div>

      {/* 3. Bottom Shortcut & Status Bar */}
      {!settings.focusMode && (
        <ReaderFooter
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onToggleMetadata={() => setIsMetaSidebarOpen((v) => !v)}
          citationCount={citations.length}
          hasActiveDoc={Boolean(activeDocument)}
          theme={settings.theme}
        />
      )}

      {/* 5. Modals & Version 2 Overlays */}

      {/* Pastel Yellow Post-It Note for Capturing Citations, Tags, and Notes (Requirement 2) */}
      <PostItNoteModal
        key={pendingPostItData ? `postit-${pendingPostItData.pageNumber}-${pendingPostItData.text.slice(0, 30)}` : 'closed'}
        isOpen={Boolean(pendingPostItData)}
        onClose={() => setPendingPostItData(null)}
        onSave={handleConfirmPostItSave}
        quoteText={pendingPostItData?.text || ''}
        pageNumber={pendingPostItData?.pageNumber || 1}
        chapterTitle={pendingPostItData?.chapterTitle}
        docTitle={activeDocument?.title}
        authors={activeDocument?.authors}
        year={activeDocument?.publicationYear}
        suggestedTags={repositoryTags}
        theme={settings.theme}
      />

      {/* Fullscreen Citations & SQLite Repository Viewer (Requirement 5) */}
      {isRepositoryOpen && (
        <CitationsRepositoryView
          citations={allRepositoryCitations.length > 0 ? allRepositoryCitations : citations}
          onClose={() => setIsRepositoryOpen(false)}
          onEditCitation={(citation) => setEditingCitation(citation)}
          onDeleteCitation={(docFp, id) => handleDeleteCitation(id, docFp)}
          onOpenSourceInReader={handleOpenSourceInReader}
          citationStyle={settings.citationStyle}
          onUpdateCitationStyle={(style) => handleUpdateSettings({ citationStyle: style })}
          theme={settings.theme}
        />
      )}

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

