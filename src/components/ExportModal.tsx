import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  File,
  Sparkles
} from 'lucide-react';
import { CitationEntry, CitationStyle, ExportFormat, ReadingTheme, ResearchDocument } from '../types';
import { 
  generateBibtexExport, 
  generateCsvExport, 
  generateJsonExport, 
  generateMarkdownExport, 
  generatePdfExport, 
  generatePlainTextExport, 
  triggerFileDownload 
} from '../utils/exportGenerators';
import { THEMES } from '../utils/themeStyles';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ResearchDocument | null;
  citations: CitationEntry[];
  currentStyle: CitationStyle;
  theme?: ReadingTheme;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  document,
  citations,
  currentStyle,
  theme = 'sepia',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('bibtex');
  const [isCopied, setIsCopied] = useState(false);

  const currentTheme = THEMES[theme] || THEMES.sepia;

  if (!isOpen) return null;

  const getExportContent = (): string => {
    switch (selectedFormat) {
      case 'bibtex':
        return generateBibtexExport(citations);
      case 'markdown':
        return generateMarkdownExport(citations, document || undefined, currentStyle);
      case 'txt':
        return generatePlainTextExport(citations, currentStyle);
      case 'csv':
        return generateCsvExport(citations);
      case 'json':
        return generateJsonExport(citations, document || undefined);
      case 'pdf':
        return `[PDF Reference Sheet Preview]\nDocument: ${document?.title || 'Citations Made Easy'}\nTotal Entries: ${citations.length}\nFormat: Academic Standard\nClick 'Download PDF' to generate the binary .pdf dossier.`;
      default:
        return '';
    }
  };

  const handleDownload = () => {
    const baseName = document?.title
      ? document.title.slice(0, 24).toLowerCase().replace(/[^a-z0-9]/g, '_')
      : 'citations_made_easy';

    if (selectedFormat === 'pdf') {
      generatePdfExport(citations, document || undefined, currentStyle);
      return;
    }

    const content = getExportContent();
    const extensions: Record<ExportFormat, { ext: string; mime: string }> = {
      bibtex: { ext: '.bib', mime: 'text/plain;charset=utf-8' },
      markdown: { ext: '.md', mime: 'text/markdown;charset=utf-8' },
      txt: { ext: '.txt', mime: 'text/plain;charset=utf-8' },
      csv: { ext: '.csv', mime: 'text/csv;charset=utf-8' },
      json: { ext: '.json', mime: 'application/json;charset=utf-8' },
      pdf: { ext: '.pdf', mime: 'application/pdf' },
    };

    const { ext, mime } = extensions[selectedFormat];
    triggerFileDownload(content, `${baseName}${ext}`, mime);
  };

  const handleCopy = () => {
    if (selectedFormat === 'pdf') return;
    const content = getExportContent();
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formats: Array<{
    id: ExportFormat;
    label: string;
    ext: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'bibtex',
      label: 'BibTeX',
      ext: '.bib',
      desc: 'Standard for Zotero, Mendeley, Overleaf, LaTeX',
      icon: <FileCode className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'pdf',
      label: 'PDF Dossier',
      ext: '.pdf',
      desc: 'Print-ready reference sheet with quotes & citations',
      icon: <File className="w-4 h-4 text-red-500" />,
    },
    {
      id: 'markdown',
      label: 'Markdown',
      ext: '.md',
      desc: 'Formatted with blockquotes for Obsidian, Notion',
      icon: <FileText className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'txt',
      label: 'Plain Text',
      ext: '.txt',
      desc: 'Clean text file for Word or Google Docs',
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'csv',
      label: 'CSV Table',
      ext: '.csv',
      desc: 'Spreadsheet with all structured metadata columns',
      icon: <FileSpreadsheet className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'json',
      label: 'JSON / CFF',
      ext: '.json',
      desc: 'Raw structured research data & local backup',
      icon: <Table className="w-4 h-4 text-stone-400" />,
    },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none ${currentTheme.modalOverlay} backdrop-blur-xs`}>
      <div className={`w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh] border ${currentTheme.modalBg} ${currentTheme.modalBorder} ${currentTheme.modalText}`}>
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between ${currentTheme.modalHeaderBg} ${currentTheme.modalBorder}`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${currentTheme.btnPrimary}`}>
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.modalText}`}>
                Export Reference Dossier
              </h3>
              <p className={`text-[11px] ${currentTheme.sidebarMuted}`}>
                Export {citations.length} extracted citation entries for this document
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Format selection cards */}
          <div className="space-y-1.5">
            <label className={`text-[10px] font-bold uppercase tracking-widest ${currentTheme.sidebarMuted}`}>
              Select Export Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormat(f.id)}
                  className={`p-2.5 rounded-md border text-left transition flex flex-col gap-1 cursor-pointer ${
                    selectedFormat === f.id
                      ? `${currentTheme.cardBg} ${currentTheme.cardSelectedBorder} shadow-2xs`
                      : `${currentTheme.cardBg} ${currentTheme.cardBorder} hover:${currentTheme.cardHoverBorder}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 font-bold text-xs ${currentTheme.cardText}`}>
                      {f.icon}
                      <span>{f.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${currentTheme.sidebarMuted}`}>{f.ext}</span>
                  </div>
                  <span className={`text-[10px] leading-tight ${currentTheme.sidebarMuted}`}>
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>Preview</span>
              <span className={`font-mono text-[10px] ${currentTheme.sidebarMuted}`}>
                Style: {currentStyle.toUpperCase()}
              </span>
            </div>
            <div className="relative">
              <pre className={`p-3 rounded-md font-mono text-[11px] h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed border ${currentTheme.codeBoxBg} ${currentTheme.codeBoxBorder} ${currentTheme.codeBoxText}`}>
                {getExportContent()}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className={`p-3 border-t flex items-center justify-between gap-3 ${currentTheme.modalFooterBg} ${currentTheme.modalBorder}`}>
          {selectedFormat !== 'pdf' && (
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded border text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${currentTheme.btnSecondary}`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied to Clipboard' : 'Copy Content'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${currentTheme.sidebarMuted} hover:${currentTheme.modalText}`}
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className={`px-4 py-1.5 rounded text-xs font-bold transition shadow-2xs flex items-center gap-2 cursor-pointer ${currentTheme.btnPrimary}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {formats.find((f) => f.id === selectedFormat)?.label}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
