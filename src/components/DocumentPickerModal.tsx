import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  BookOpen, 
  Clock, 
  Bookmark, 
  ArrowRight, 
  Sparkles,
  Layers,
  FileCode,
  File,
  Globe,
  Link2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { ReadingTheme, ResearchDocument } from '../types';
import { 
  fetchWebArticleByUrl,
  parseEpubFile, 
  parseHtmlFile, 
  parsePdfFile, 
  parseTextFile 
} from '../utils/documentParser';
import { getRecentDocs, RecentDocMeta } from '../utils/storage';
import { getDocumentFromDB } from '../utils/documentStorage';
import { THEMES } from '../utils/themeStyles';

interface DocumentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (doc: ResearchDocument) => void;
  currentDocFingerprint?: string;
  theme?: ReadingTheme;
}

export const DocumentPickerModal: React.FC<DocumentPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
  currentDocFingerprint,
  theme = 'sepia',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTheme = THEMES[theme] || THEMES.sepia;

  if (!isOpen) return null;

  const recentDocs: RecentDocMeta[] = getRecentDocs();

  const handleUrlSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setIsFetchingUrl(true);
    setErrorMessage(null);

    try {
      const doc = await fetchWebArticleByUrl(urlInput.trim());
      onSelectDocument(doc);
      onClose();
    } catch (err: any) {
      console.error('URL Fetch Error:', err);
      setErrorMessage(
        err?.message || 'Unable to load webpage. Please check the URL and verify robots.txt permissions.'
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsedDoc: ResearchDocument;

      if (ext === 'pdf') {
        parsedDoc = await parsePdfFile(file);
      } else if (ext === 'epub') {
        parsedDoc = await parseEpubFile(file);
      } else if (ext === 'md' || ext === 'txt') {
        parsedDoc = await parseTextFile(file);
      } else if (ext === 'html' || ext === 'htm') {
        parsedDoc = await parseHtmlFile(file);
      } else {
        // Default text fallback
        parsedDoc = await parseTextFile(file);
      }

      onSelectDocument(parsedDoc);
      onClose();
    } catch (err: any) {
      console.error('Document parsing error:', err);
      setErrorMessage(
        err?.message || 'Failed to parse the selected document. Please check the file format.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none ${currentTheme.modalOverlay} backdrop-blur-xs`}>
      <div className={`w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh] border ${currentTheme.modalBg} ${currentTheme.modalBorder} ${currentTheme.modalText}`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${currentTheme.modalHeaderBg} ${currentTheme.modalBorder}`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${currentTheme.btnPrimary}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.modalText}`}>
                Open Research Document
              </h3>
              <p className={`text-[11px] ${currentTheme.sidebarMuted}`}>
                Supports PDF, EPUB, Markdown (.md), Plain Text (.txt), and HTML articles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded transition font-mono text-xs cursor-pointer ${currentTheme.sidebarMuted} hover:${currentTheme.modalText}`}
          >
            [ESC]
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Web Article URL Reader Input */}
          <div className={`p-4 rounded-lg border space-y-3 ${currentTheme.cardBg} ${currentTheme.cardBorder}`}>
            <div className="flex items-center justify-between">
              <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${currentTheme.sidebarMuted}`}>
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Fetch from Web URL (Reader View)</span>
              </label>
              <span className={`text-[9px] font-mono flex items-center gap-1 opacity-80 ${currentTheme.sidebarMuted}`}>
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Robots.txt verified</span>
              </span>
            </div>

            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${currentTheme.sidebarMuted}`} />
                <input
                  type="url"
                  placeholder="https://en.wikipedia.org/wiki/Quantum_computing or any web article..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded text-xs border font-mono focus:outline-none ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder}`}
                />
              </div>
              <button
                type="submit"
                disabled={isFetchingUrl || !urlInput.trim()}
                className={`px-4 py-2 rounded font-bold text-xs transition shadow-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer ${currentTheme.btnPrimary}`}
              >
                {isFetchingUrl ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <span>Load URL</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Sample Web Links */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] pt-1">
              <span className={`font-mono text-[9px] uppercase ${currentTheme.sidebarMuted}`}>Try URL:</span>
              <button
                type="button"
                onClick={() => setUrlInput('https://en.wikipedia.org/wiki/Citation')}
                className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}
              >
                Wikipedia: Citation
              </button>
              <button
                type="button"
                onClick={() => setUrlInput('https://en.wikipedia.org/wiki/Digital_object_identifier')}
                className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}
              >
                Wikipedia: DOI
              </button>
              <button
                type="button"
                onClick={() => setUrlInput('https://arxiv.org/abs/2301.00234')}
                className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}
              >
                arXiv Abstract
              </button>
            </div>
          </div>

          {/* Upload / Drag & Drop Target */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-lg border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? `${currentTheme.cardBg} ${currentTheme.cardSelectedBorder}`
                : `${currentTheme.cardBg} ${currentTheme.cardBorder} hover:${currentTheme.cardHoverBorder}`
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.epub,.md,.txt,.html,.htm"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${currentTheme.badgeBg} ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1">
              <p className={`text-xs font-bold ${currentTheme.modalText}`}>
                {isLoading ? 'Parsing and extracting bibliographic structure...' : 'Click to select or drag & drop research paper here'}
              </p>
              <p className={`text-[10px] font-mono ${currentTheme.sidebarMuted}`}>
                PDF • EPUB • Markdown (.md) • Plain Text (.txt) • HTML articles
              </p>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/30">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Curated Preloaded Research Papers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${currentTheme.sidebarMuted}`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Preloaded Research Library</span>
              </label>
              <span className={`text-[10px] font-mono ${currentTheme.sidebarMuted}`}>Sample corpus</span>
            </div>

            <div className="grid gap-2">
              {SAMPLE_DOCUMENTS.map((doc) => {
                const isActive = currentDocFingerprint === doc.fingerprint;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      onSelectDocument(doc);
                      onClose();
                    }}
                    className={`p-3 rounded-md border text-left cursor-pointer transition flex items-center justify-between gap-3 ${
                      isActive
                        ? `${currentTheme.cardBg} ${currentTheme.cardSelectedBorder} shadow-2xs`
                        : `${currentTheme.cardBg} ${currentTheme.cardBorder} hover:${currentTheme.cardHoverBorder}`
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${currentTheme.btnPrimary}`}>
                          {doc.fileType}
                        </span>
                        <h4 className={`text-xs font-bold truncate ${currentTheme.cardText}`}>
                          {doc.title}
                        </h4>
                      </div>
                      <p className={`text-[11px] truncate ${currentTheme.sidebarMuted}`}>
                        {doc.authors.join(', ')} • {doc.journalOrBookTitle || doc.sourceOrPublisher} ({doc.publicationYear})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isActive ? (
                        <span className={`text-[10px] font-mono font-bold ${currentTheme.modalText}`}>
                          [Active]
                        </span>
                      ) : (
                        <ArrowRight className={`w-3.5 h-3.5 ${currentTheme.sidebarMuted}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Documents with Saved Local Citations */}
          {recentDocs.length > 0 && (
            <div className={`space-y-2 pt-2 border-t ${currentTheme.modalBorder}`}>
              <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${currentTheme.sidebarMuted}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Recent Local Documents & Extracts</span>
              </label>

              <div className="grid gap-2">
                {recentDocs.map((rec) => {
                  const isActive = currentDocFingerprint === rec.fingerprint;
                  return (
                    <div
                      key={rec.fingerprint}
                      onClick={async () => {
                        // Check if in sample corpus
                        const sampleMatch = SAMPLE_DOCUMENTS.find((s) => s.fingerprint === rec.fingerprint);
                        if (sampleMatch) {
                          onSelectDocument(sampleMatch);
                          onClose();
                          return;
                        }
                        // Otherwise retrieve from IndexedDB
                        const storedDoc = await getDocumentFromDB(rec.fingerprint);
                        if (storedDoc) {
                          onSelectDocument(storedDoc);
                          onClose();
                        }
                      }}
                      className={`p-2.5 rounded-md border flex items-center justify-between text-xs cursor-pointer transition ${
                        isActive
                          ? `${currentTheme.cardBg} ${currentTheme.cardSelectedBorder} shadow-2xs`
                          : `${currentTheme.cardBg} ${currentTheme.cardBorder} hover:${currentTheme.cardHoverBorder}`
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <p className={`font-bold truncate ${currentTheme.cardText}`}>{rec.title}</p>
                        <p className={`text-[10px] ${currentTheme.sidebarMuted}`}>
                          {rec.authors?.join(', ')} • {rec.fileType.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold ${currentTheme.badgeBg} ${currentTheme.badgeBorder} border ${currentTheme.badgeText}`}>
                          <Bookmark className="w-3 h-3 text-amber-500" />
                          <span>{rec.citationCount} saved</span>
                        </span>
                        <ArrowRight className={`w-3.5 h-3.5 ${currentTheme.sidebarMuted}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t text-right ${currentTheme.modalFooterBg} ${currentTheme.modalBorder}`}>
          <button
            onClick={onClose}
            className={`px-4 py-1 rounded border text-xs font-bold transition shadow-2xs cursor-pointer ${currentTheme.btnSecondary}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
