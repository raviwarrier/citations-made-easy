import React, { useState } from 'react';
import { X, Save, Edit3, Sparkles, Tag, BookOpen, Quote } from 'lucide-react';
import { CitationEntry, ReadingTheme } from '../types';
import { THEMES } from '../utils/themeStyles';

interface EditCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: CitationEntry | null;
  onSave: (updated: CitationEntry) => void;
  theme?: ReadingTheme;
}

export const EditCitationModal: React.FC<EditCitationModalProps> = ({
  isOpen,
  onClose,
  citation,
  onSave,
  theme = 'sepia',
}) => {
  const currentTheme = THEMES[theme] || THEMES.sepia;

  if (!isOpen || !citation) return null;

  const [quoteText, setQuoteText] = useState(citation.quoteText);
  const [pageNumber, setPageNumber] = useState(citation.pageNumber);
  const [chapterName, setChapterName] = useState(citation.chapterName || '');
  const [authorsStr, setAuthorsStr] = useState(citation.authors.join(', '));
  const [docTitle, setDocTitle] = useState(citation.docTitle);
  const [publicationYear, setPublicationYear] = useState(citation.publicationYear);
  const [journalOrBook, setJournalOrBook] = useState(citation.journalOrBookTitle || '');
  const [sourceOrPublisher, setSourceOrPublisher] = useState(citation.sourceOrPublisher || '');
  const [volume, setVolume] = useState(citation.volume || '');
  const [issue, setIssue] = useState(citation.issue || '');
  const [doi, setDoi] = useState(citation.doi || '');
  const [institute, setInstitute] = useState(citation.instituteOrOrg || '');
  const [userNote, setUserNote] = useState(citation.userNote || '');
  const [tagsStr, setTagsStr] = useState(citation.tags?.join(', ') || '');
  
  // Third party attribution
  const [isThirdParty, setIsThirdParty] = useState(
    citation.thirdPartyAttribution?.isThirdPartyQuote || false
  );
  const [thirdAuthor, setThirdAuthor] = useState(
    citation.thirdPartyAttribution?.detectedAuthor || ''
  );
  const [thirdYear, setThirdYear] = useState(
    citation.thirdPartyAttribution?.detectedYear || ''
  );
  const [thirdWork, setThirdWork] = useState(
    citation.thirdPartyAttribution?.originalWorkTitle || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CitationEntry = {
      ...citation,
      quoteText,
      pageNumber: Number(pageNumber) || 1,
      pageNumberDisplay: `p. ${pageNumber}`,
      chapterName: chapterName.trim() || undefined,
      docTitle,
      authors: authorsStr.split(',').map((a) => a.trim()).filter(Boolean),
      publicationYear,
      journalOrBookTitle: journalOrBook.trim() || undefined,
      sourceOrPublisher: sourceOrPublisher.trim() || 'Publisher',
      volume: volume.trim() || undefined,
      issue: issue.trim() || undefined,
      doi: doi.trim() || undefined,
      instituteOrOrg: institute.trim() || undefined,
      userNote: userNote.trim() || undefined,
      tags: tagsStr.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
      thirdPartyAttribution: isThirdParty
        ? {
            isThirdPartyQuote: true,
            detectedAuthor: thirdAuthor.trim() || undefined,
            detectedYear: thirdYear.trim() || undefined,
            originalWorkTitle: thirdWork.trim() || undefined,
            citingPhrase: `Attributed to ${thirdAuthor}`,
          }
        : undefined,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none ${currentTheme.modalOverlay} backdrop-blur-xs`}>
      <div className={`w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh] border ${currentTheme.modalBg} ${currentTheme.modalBorder} ${currentTheme.modalText}`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${currentTheme.modalHeaderBg} ${currentTheme.modalBorder}`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${currentTheme.btnPrimary}`}>
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.modalText}`}>
                Edit Structured Citation Metadata
              </h3>
              <p className={`text-[11px] ${currentTheme.sidebarMuted}`}>
                Refine bibliographic fields for accurate academic referencing
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quote Text */}
          <div className="space-y-1">
            <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
              Quotation Excerpt
            </label>
            <textarea
              rows={3}
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className={`w-full p-2.5 rounded-md border focus:outline-none font-mono text-[11px] leading-relaxed ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
              required
            />
          </div>

          {/* Location: Page & Chapter */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Page Number
              </label>
              <input
                type="number"
                value={pageNumber}
                onChange={(e) => setPageNumber(Number(e.target.value))}
                className={`w-full p-2 rounded border focus:outline-none font-mono ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
                required
              />
            </div>
            <div className="space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Chapter / Section Title
              </label>
              <input
                type="text"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                placeholder="e.g. Chapter 3: Results"
                className={`w-full p-2 rounded border focus:outline-none ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder}`}
              />
            </div>
          </div>

          {/* Authors & Title */}
          <div className="space-y-1">
            <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
              Document Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className={`w-full p-2 rounded border focus:outline-none ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Authors (comma-separated)
              </label>
              <input
                type="text"
                value={authorsStr}
                onChange={(e) => setAuthorsStr(e.target.value)}
                placeholder="e.g. Smith, John, Jane Doe"
                className={`w-full p-2 rounded border focus:outline-none ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder}`}
                required
              />
            </div>
            <div className="space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Year
              </label>
              <input
                type="text"
                value={publicationYear}
                onChange={(e) => setPublicationYear(e.target.value)}
                className={`w-full p-2 rounded border focus:outline-none font-mono ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
                required
              />
            </div>
          </div>

          {/* Journal, Publisher, DOI, Institute */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Journal or Book Title
              </label>
              <input
                type="text"
                value={journalOrBook}
                onChange={(e) => setJournalOrBook(e.target.value)}
                placeholder="e.g. Physical Review Letters"
                className={`w-full p-2 rounded border focus:outline-none ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Publisher or Source
              </label>
              <input
                type="text"
                value={sourceOrPublisher}
                onChange={(e) => setSourceOrPublisher(e.target.value)}
                placeholder="e.g. Oxford University Press"
                className={`w-full p-2 rounded border focus:outline-none ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Volume / Issue
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Vol"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className={`w-1/2 p-2 rounded border font-mono ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
                />
                <input
                  type="text"
                  placeholder="No"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className={`w-1/2 p-2 rounded border font-mono ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
                />
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                DOI / URL
              </label>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="e.g. 10.1103/PhysRevLett.132.040601"
                className={`w-full p-2 rounded border focus:outline-none font-mono text-[11px] ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder}`}
              />
            </div>
          </div>

          {/* Third-Party Attribution Section */}
          <div className={`p-3 rounded-md border space-y-2 ${currentTheme.cardBg} ${currentTheme.cardBorder}`}>
            <div className="flex items-center justify-between">
              <label className={`font-bold flex items-center gap-1.5 cursor-pointer ${currentTheme.cardText}`}>
                <input
                  type="checkbox"
                  checked={isThirdParty}
                  onChange={(e) => setIsThirdParty(e.target.checked)}
                  className="rounded"
                />
                <span>Third-Party Quote / Secondary Source Attribution</span>
              </label>
              <span className={`text-[10px] font-mono ${currentTheme.sidebarMuted}`}>e.g. "as cited in"</span>
            </div>

            {isThirdParty && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Original Author (e.g. Bell)"
                  value={thirdAuthor}
                  onChange={(e) => setThirdAuthor(e.target.value)}
                  className={`p-1.5 rounded border ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
                />
                <input
                  type="text"
                  placeholder="Original Year (e.g. 1964)"
                  value={thirdYear}
                  onChange={(e) => setThirdYear(e.target.value)}
                  className={`p-1.5 rounded border font-mono ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
                />
                <input
                  type="text"
                  placeholder="Work Title (optional)"
                  value={thirdWork}
                  onChange={(e) => setThirdWork(e.target.value)}
                  className={`p-1.5 rounded border ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText}`}
                />
              </div>
            )}
          </div>

          {/* User Notes & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Researcher Note
              </label>
              <input
                type="text"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Personal research note or commentary..."
                className={`w-full p-2 rounded border focus:outline-none ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`font-bold uppercase tracking-widest text-[10px] ${currentTheme.sidebarMuted}`}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="quantum, error-correction, bell"
                className={`w-full p-2 rounded border focus:outline-none font-mono text-[11px] ${currentTheme.inputBg} ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder}`}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className={`pt-3 border-t -mx-5 -mb-5 p-3 flex items-center justify-end gap-2 ${currentTheme.modalFooterBg} ${currentTheme.modalBorder}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded font-bold transition cursor-pointer ${currentTheme.sidebarMuted} hover:${currentTheme.modalText}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 rounded font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${currentTheme.btnPrimary}`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Citation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
