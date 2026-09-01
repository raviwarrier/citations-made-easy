import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  Copy,
  Check,
  BookOpen,
  Tag,
  FileText,
  Calendar,
  Layers,
  Database,
  Share2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Pin,
  RefreshCw,
  Plus,
  LayoutGrid,
  List
} from 'lucide-react';
import { CitationEntry, CitationStyle, ReadingTheme } from '../types';
import { formatFullCitation, formatInTextCitation } from '../utils/citationFormatter';
import { exportSqliteDatabaseBinary } from '../utils/sqliteDb';
import { THEMES } from '../utils/themeStyles';

interface CitationsRepositoryViewProps {
  citations: CitationEntry[];
  onClose: () => void;
  onEditCitation: (citation: CitationEntry) => void;
  onDeleteCitation: (fingerprint: string, id: string) => void;
  onOpenSourceInReader?: (docFingerprint: string, pageNumber: number) => void;
  citationStyle: CitationStyle;
  onUpdateCitationStyle: (style: CitationStyle) => void;
  theme: ReadingTheme;
}

// Keyword stems / synonyms mapping for researcher search queries
const KEYWORD_EXPANSIONS: Record<string, string[]> = {
  altruism: ['altruis', 'selfless', 'prosocial', 'benevolen', 'kindness', 'giving', 'unselfish'],
  altruistic: ['altruis', 'selfless', 'prosocial', 'benevolen'],
  quantum: ['quantum', 'entangle', 'non-local', 'wavefunction', 'superposition', 'qubit'],
  consciousness: ['conscious', 'awareness', 'qualia', 'subjective', 'mind', 'cognitive'],
  consensus: ['consensus', 'byzantine', 'distributed', 'fault-toleran', 'raft', 'paxos'],
  meaning: ['meaning', 'purpose', 'existential', 'significance', 'teleolog'],
  debris: ['debris', 'remnant', 'fragment', 'waste', 'clutter'],
};

export const CitationsRepositoryView: React.FC<CitationsRepositoryViewProps> = ({
  citations,
  onClose,
  onEditCitation,
  onDeleteCitation,
  onOpenSourceInReader,
  citationStyle,
  onUpdateCitationStyle,
  theme,
}) => {
  const currentTheme = THEMES[theme] || THEMES.onyx;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceFingerprint, setSelectedSourceFingerprint] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'page' | 'source'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  // Group citations by document sources
  const sourceGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        fingerprint: string;
        title: string;
        authors: string[];
        year: string;
        count: number;
      }
    >();

    for (const c of citations) {
      if (!map.has(c.docFingerprint)) {
        map.set(c.docFingerprint, {
          fingerprint: c.docFingerprint,
          title: c.docTitle || 'Untitled Document',
          authors: c.authors || [],
          year: c.publicationYear || '',
          count: 0,
        });
      }
      map.get(c.docFingerprint)!.count += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [citations]);

  // Extract all unique tags with frequency
  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of citations) {
      if (c.tags && Array.isArray(c.tags)) {
        for (const t of c.tags) {
          const clean = t.trim();
          if (clean) {
            map.set(clean, (map.get(clean) || 0) + 1);
          }
        }
      }
    }
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [citations]);

  // 5 most common tags from the repository
  const topCommonTags = useMemo(() => {
    return allTags.slice(0, 5).map((t) => t.tag);
  }, [allTags]);

  // Smart Filter Logic (Keyword stemming, source filtering, tag filtering)
  const filteredCitations = useMemo(() => {
    let result = [...citations];

    // 1. Filter by Source
    if (selectedSourceFingerprint !== 'all') {
      result = result.filter((c) => c.docFingerprint === selectedSourceFingerprint);
    }

    // 2. Filter by Tag
    if (selectedTag !== 'all') {
      result = result.filter(
        (c) => c.tags && c.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    // 3. Filter by Search Query & Smart Keyword Stemming
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const expansions = KEYWORD_EXPANSIONS[q] || [q];

      result = result.filter((c) => {
        const quote = (c.quoteText || '').toLowerCase();
        const note = (c.userNote || '').toLowerCase();
        const title = (c.docTitle || '').toLowerCase();
        const authors = (c.authors || []).join(' ').toLowerCase();
        const tags = (c.tags || []).join(' ').toLowerCase();
        const sourceOrPub = (c.sourceOrPublisher || '').toLowerCase();
        const journalOrBook = (c.journalOrBookTitle || '').toLowerCase();
        const year = (c.publicationYear || '').toLowerCase();
        const pubDate = (c.publicationDate || '').toLowerCase();
        const doi = (c.doi || '').toLowerCase();
        const url = (c.url || '').toLowerCase();
        const isbn = (c.isbn || '').toLowerCase();
        const arxiv = (c.arxivId || '').toLowerCase();
        const chapter = (c.chapterName || '').toLowerCase();
        const section = (c.sectionName || '').toLowerCase();
        const page = String(c.pageNumber || '').toLowerCase();
        const pageDisplay = (c.pageNumberDisplay || '').toLowerCase();
        const org = (c.instituteOrOrg || '').toLowerCase();
        const thirdPartyAuthor = (c.thirdPartyAttribution?.detectedAuthor || '').toLowerCase();
        const thirdPartyTitle = (c.thirdPartyAttribution?.originalWorkTitle || '').toLowerCase();

        // Check exact match or any smart keyword expansion match
        return expansions.some(
          (term) =>
            quote.includes(term) ||
            note.includes(term) ||
            title.includes(term) ||
            authors.includes(term) ||
            tags.includes(term) ||
            sourceOrPub.includes(term) ||
            journalOrBook.includes(term) ||
            year.includes(term) ||
            pubDate.includes(term) ||
            doi.includes(term) ||
            url.includes(term) ||
            isbn.includes(term) ||
            arxiv.includes(term) ||
            chapter.includes(term) ||
            section.includes(term) ||
            page.includes(term) ||
            pageDisplay.includes(term) ||
            org.includes(term) ||
            thirdPartyAuthor.includes(term) ||
            thirdPartyTitle.includes(term)
        );
      });
    }

    // 4. Sort Results
    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortBy === 'page') return (a.pageNumber || 0) - (b.pageNumber || 0);
      if (sortBy === 'source') return (a.docTitle || '').localeCompare(b.docTitle || '');
      return 0;
    });

    return result;
  }, [citations, selectedSourceFingerprint, selectedTag, searchQuery, sortBy]);

  // Export handlers
  const handleExportFiltered = (format: 'sqlite' | 'bibtex' | 'markdown' | 'csv' | 'json') => {
    if (filteredCitations.length === 0) {
      showToast('No citations match the current filter to export.');
      return;
    }

    const baseName =
      selectedSourceFingerprint !== 'all'
        ? (sourceGroups.find((s) => s.fingerprint === selectedSourceFingerprint)?.title || 'source')
            .toLowerCase()
            .replace(/[^a-z0-9]/gi, '_')
            .slice(0, 30)
        : selectedTag !== 'all'
        ? `tag_${selectedTag.replace(/[^a-z0-9]/gi, '_')}`
        : 'citations_repository';

    if (format === 'sqlite') {
      exportSqliteDatabaseBinary(filteredCitations, `${baseName}.sqlite`);
      showToast(`Exported ${filteredCitations.length} citations to SQLite DB!`);
    } else if (format === 'bibtex') {
      const bib = filteredCitations
        .map((c) => formatFullCitation(c, 'bibtex'))
        .join('\n\n');

      downloadFile(bib, `${baseName}.bib`, 'text/plain');
      showToast(`Exported ${filteredCitations.length} citations to BibTeX!`);
    } else if (format === 'markdown') {
      let md = `# Citations & Notes Export\n\n`;
      md += `*Exported on ${new Date().toLocaleDateString()} • Total: ${filteredCitations.length} entries*\n\n---\n\n`;

      for (const c of filteredCitations) {
        md += `### ${c.docTitle} (p. ${c.pageNumber})\n`;
        md += `**Citation (${citationStyle.toUpperCase()}):** ${formatFullCitation(c, citationStyle)}\n\n`;
        md += `> "${c.quoteText}"\n\n`;
        if (c.userNote) {
          md += `📌 **Note / Commentary:** *${c.userNote}*\n\n`;
        }
        if (c.tags && c.tags.length > 0) {
          md += `**Tags:** ${c.tags.map((t) => `\`#${t}\``).join(', ')}\n\n`;
        }
        md += `---\n\n`;
      }

      downloadFile(md, `${baseName}.md`, 'text/markdown');
      showToast(`Exported ${filteredCitations.length} citations to Markdown!`);
    } else if (format === 'csv') {
      const headers = [
        'Document Title',
        'Authors',
        'Year',
        'Page',
        'Quote',
        'User Notes',
        'Tags',
        'Formatted Citation',
      ];
      const rows = filteredCitations.map((c) => [
        `"${(c.docTitle || '').replace(/"/g, '""')}"`,
        `"${(c.authors || []).join('; ').replace(/"/g, '""')}"`,
        `"${c.publicationYear || ''}"`,
        `"${c.pageNumber || ''}"`,
        `"${(c.quoteText || '').replace(/"/g, '""')}"`,
        `"${(c.userNote || '').replace(/"/g, '""')}"`,
        `"${(c.tags || []).join(', ').replace(/"/g, '""')}"`,
        `"${formatFullCitation(c, citationStyle).replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(csvContent, `${baseName}.csv`, 'text/csv');
      showToast(`Exported ${filteredCitations.length} citations to CSV!`);
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(filteredCitations, null, 2);
      downloadFile(jsonContent, `${baseName}.json`, 'application/json');
      showToast(`Exported ${filteredCitations.length} citations to JSON!`);
    }

    setIsExportMenuOpen(false);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCitation = (c: CitationEntry) => {
    const text = formatFullCitation(c, citationStyle);
    navigator.clipboard.writeText(text);
    setCopiedId(c.id);
    showToast('Citation copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${currentTheme.rootBg} ${currentTheme.rootText} font-sans select-none overflow-hidden animate-in fade-in duration-150`}>
      {/* 1. Header Bar */}
      <header className={`h-14 shrink-0 px-4 md:px-6 flex items-center justify-between border-b ${currentTheme.headerBorder} ${currentTheme.headerBg} ${currentTheme.headerText}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border ${currentTheme.btnSecondary} ${currentTheme.btnSecondaryHover} text-xs font-mono font-semibold transition cursor-pointer`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Reader</span>
          </button>

          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" />
            <h1 className="text-sm font-bold tracking-tight font-mono">
              Citations Repository
            </h1>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder}`}>
              {citations.length} total
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 relative">
          {/* Citation Style Selector */}
          <div className="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-sm border border-white/10 text-xs font-mono">
            <span className="text-[10px] text-white/50 px-1 uppercase">Style:</span>
            {(['apa', 'mla', 'chicago-author-date', 'harvard', 'ieee', 'bibtex'] as CitationStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => onUpdateCitationStyle(style)}
                className={`px-2 py-0.5 rounded-xs text-[10px] uppercase transition cursor-pointer ${
                  citationStyle === style
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {style === 'chicago-author-date' ? 'Chicago' : style}
              </button>
            ))}
          </div>

          {/* Export Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Filtered ({filteredCitations.length})</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isExportMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-1.5 w-60 rounded-sm shadow-2xl border ${currentTheme.cardBorder} ${currentTheme.cardBg} ${currentTheme.cardText} py-1.5 z-50 font-mono text-xs animate-in fade-in duration-100`}
              >
                <div className={`px-3 py-1.5 text-[10px] ${currentTheme.headerMuted} border-b ${currentTheme.cardBorder} uppercase tracking-wider`}>
                  Export Options ({filteredCitations.length} entries)
                </div>
                <button
                  onClick={() => handleExportFiltered('sqlite')}
                  className={`w-full text-left px-3 py-2 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-400 flex items-center justify-between transition cursor-pointer`}
                >
                  <span className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" />
                    SQLite Database (.sqlite)
                  </span>
                  <span className="text-[10px] opacity-60">Binary</span>
                </button>
                <button
                  onClick={() => handleExportFiltered('bibtex')}
                  className={`w-full text-left px-3 py-2 hover:${currentTheme.btnSecondaryHover} flex items-center justify-between transition cursor-pointer`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    BibTeX (.bib)
                  </span>
                  <span className="text-[10px] opacity-60">LaTeX</span>
                </button>
                <button
                  onClick={() => handleExportFiltered('markdown')}
                  className={`w-full text-left px-3 py-2 hover:${currentTheme.btnSecondaryHover} flex items-center justify-between transition cursor-pointer`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Markdown with Notes (.md)
                  </span>
                  <span className="text-[10px] opacity-60">Obsidian</span>
                </button>
                <button
                  onClick={() => handleExportFiltered('csv')}
                  className={`w-full text-left px-3 py-2 hover:${currentTheme.btnSecondaryHover} flex items-center justify-between transition cursor-pointer`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    Spreadsheet CSV (.csv)
                  </span>
                  <span className="text-[10px] opacity-60">Excel</span>
                </button>
                <button
                  onClick={() => handleExportFiltered('json')}
                  className={`w-full text-left px-3 py-2 hover:${currentTheme.btnSecondaryHover} flex items-center justify-between transition cursor-pointer`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    Raw JSON (.json)
                  </span>
                  <span className="text-[10px] opacity-60">Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main 2-Column Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Filter & Facets Sidebar */}
        <aside className={`w-72 shrink-0 border-r ${currentTheme.sidebarBorder} ${currentTheme.sidebarBg} ${currentTheme.sidebarText} flex flex-col overflow-y-auto p-4 space-y-6 hidden lg:flex select-none`}>
          {/* Sources Filter Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold font-mono uppercase tracking-wider ${currentTheme.sidebarText} flex items-center gap-1.5`}>
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                Filter by Source
              </span>
              <span className={`text-[10px] font-mono ${currentTheme.sidebarMuted}`}>
                {sourceGroups.length} sources
              </span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedSourceFingerprint('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-sm text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                  selectedSourceFingerprint === 'all'
                    ? `${currentTheme.btnPrimary}`
                    : `${currentTheme.sidebarText} hover:${currentTheme.sidebarSubtleHeaderBg}`
                }`}
              >
                <span>All Documents / Sources</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
                  {citations.length}
                </span>
              </button>

              {sourceGroups.map((group) => (
                <button
                  key={group.fingerprint}
                  onClick={() => setSelectedSourceFingerprint(group.fingerprint)}
                  className={`w-full text-left px-2.5 py-2 rounded-sm text-xs font-mono flex items-start justify-between gap-2 transition cursor-pointer ${
                    selectedSourceFingerprint === group.fingerprint
                      ? `${currentTheme.btnPrimary}`
                      : `${currentTheme.sidebarText} hover:${currentTheme.sidebarSubtleHeaderBg}`
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate text-xs font-medium">{group.title}</p>
                    <p className={`text-[10px] ${currentTheme.sidebarMuted} truncate mt-0.5`}>
                      {group.authors.length > 0 ? group.authors[0] : 'Author'} {group.year ? `(${group.year})` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText} shrink-0`}>
                    {group.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter Section */}
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold font-mono uppercase tracking-wider ${currentTheme.sidebarText} flex items-center gap-1.5`}>
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  Filter by Tag
                </span>
                <span className={`text-[10px] font-mono ${currentTheme.sidebarMuted}`}>
                  {allTags.length} tags
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-sm text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                    selectedTag === 'all'
                      ? `${currentTheme.btnPrimary}`
                      : `${currentTheme.sidebarText} hover:${currentTheme.sidebarSubtleHeaderBg}`
                  }`}
                >
                  <span>All Tags</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
                    {citations.length}
                  </span>
                </button>

                {allTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-sm text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                      selectedTag === tag
                        ? `${currentTheme.btnPrimary}`
                        : `${currentTheme.sidebarText} hover:${currentTheme.sidebarSubtleHeaderBg}`
                    }`}
                  >
                    <span className="truncate">#{tag}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText} shrink-0`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 Common Tags from Repository (if any exist) */}
          {topCommonTags.length > 0 && (
            <div className={`p-3 rounded-sm ${currentTheme.cardBg} border ${currentTheme.cardBorder} space-y-1.5`}>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Top Repository Tags:
              </span>
              <p className={`text-[11px] ${currentTheme.sidebarMuted} leading-relaxed font-sans`}>
                Click to filter citations by your most frequent tags:
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {topCommonTags.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setSelectedTag(kw)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-xs ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} hover:${currentTheme.btnSecondaryHover} transition cursor-pointer`}
                  >
                    #{kw}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Content Area (Search Bar + Cards Grid/List) */}
        <main className={`flex-1 flex flex-col overflow-hidden ${currentTheme.rootBg}`}>
          {/* Top Search & Sorting Bar */}
          <div className={`p-4 border-b ${currentTheme.headerBorder} ${currentTheme.headerBg} flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0`}>
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${currentTheme.headerMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quotes, notes, tags, authors, titles, DOI, year, publisher, or keywords..."
                className={`w-full pl-9 pr-8 py-2 rounded-sm text-xs font-mono ${currentTheme.inputBg} border ${currentTheme.inputBorder} ${currentTheme.inputText} ${currentTheme.inputPlaceholder} focus:outline-hidden focus:ring-1 focus:ring-amber-500`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${currentTheme.headerMuted} hover:${currentTheme.headerText} text-xs cursor-pointer`}
                >
                  ×
                </button>
              )}
            </div>

            {/* Controls: Active filters count, Grid/List view switcher & Sorting */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs font-mono">
              <span className={`${currentTheme.headerMuted} text-[11px] hidden lg:inline`}>
                Showing <strong className={currentTheme.headerText}>{filteredCitations.length}</strong> of {citations.length}
              </span>

              {/* View Switcher: Grid vs List */}
              <div className={`flex items-center gap-0.5 border rounded-sm p-0.5 ${currentTheme.cardBorder} ${currentTheme.cardBg}`}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-xs transition cursor-pointer ${
                    viewMode === 'grid'
                      ? `${currentTheme.btnPrimary} shadow-2xs`
                      : `${currentTheme.headerMuted} hover:${currentTheme.headerText}`
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-xs transition cursor-pointer ${
                    viewMode === 'list'
                      ? `${currentTheme.btnPrimary} shadow-2xs`
                      : `${currentTheme.headerMuted} hover:${currentTheme.headerText}`
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`${currentTheme.headerMuted} text-[10px] uppercase`}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`${currentTheme.inputBg} border ${currentTheme.inputBorder} ${currentTheme.inputText} text-xs font-mono rounded-sm px-2 py-1.5 focus:outline-hidden cursor-pointer`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="page">Page Number</option>
                  <option value="source">Source Title</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Badges (Mobile & Desktop) */}
          {(selectedSourceFingerprint !== 'all' || selectedTag !== 'all' || searchQuery) && (
            <div className={`px-4 py-2 ${currentTheme.sidebarSubtleHeaderBg} border-b ${currentTheme.headerBorder} flex flex-wrap items-center gap-2 text-xs font-mono shrink-0`}>
              <span className="text-amber-500 text-[10px] uppercase font-bold">Active Filters:</span>
              {selectedSourceFingerprint !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} text-[11px]`}>
                  Source: {sourceGroups.find((s) => s.fingerprint === selectedSourceFingerprint)?.title}
                  <button onClick={() => setSelectedSourceFingerprint('all')} className="hover:text-amber-500 cursor-pointer ml-1">×</button>
                </span>
              )}
              {selectedTag !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} text-[11px]`}>
                  Tag: #{selectedTag}
                  <button onClick={() => setSelectedTag('all')} className="hover:text-amber-500 cursor-pointer ml-1">×</button>
                </span>
              )}
              {searchQuery && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} text-[11px]`}>
                  Query: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-amber-500 cursor-pointer ml-1">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedSourceFingerprint('all');
                  setSelectedTag('all');
                  setSearchQuery('');
                }}
                className={`text-[10px] ${currentTheme.headerMuted} hover:${currentTheme.headerText} underline cursor-pointer ml-auto`}
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Citations List / Grid with solid background */}
          <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 ${currentTheme.rootBg}`}>
            {filteredCitations.length === 0 ? (
              <div className={`h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed ${currentTheme.cardBorder} ${currentTheme.cardBg} rounded-sm space-y-2`}>
                <Database className={`w-8 h-8 ${currentTheme.headerMuted}`} />
                <p className={`text-sm font-mono ${currentTheme.headerMuted}`}>
                  No citations match the selected filters or keyword query.
                </p>
                <button
                  onClick={() => {
                    setSelectedSourceFingerprint('all');
                    setSelectedTag('all');
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 ${currentTheme.btnSecondary} ${currentTheme.btnSecondaryHover} border ${currentTheme.cardBorder} text-xs font-mono rounded-sm transition cursor-pointer`}
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW: Compact 2-line layout with title, meta, source, date & action buttons */
              <div className="space-y-2.5">
                {filteredCitations.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-sm border ${currentTheme.cardBorder} ${currentTheme.cardBg} ${currentTheme.cardText} p-3.5 shadow-2xs transition hover:${currentTheme.cardHoverBorder} flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}
                  >
                    {/* Left & Center: First two lines */}
                    <div className="space-y-1 min-w-0 flex-1">
                      {/* Line 1: Page/Chapter Badge • Document Title • Date */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} shrink-0`}>
                          p. {c.pageNumber} {c.chapterName ? `• ${c.chapterName}` : ''}
                        </span>
                        <h4 className={`text-xs font-bold font-sans ${currentTheme.rootText} truncate max-w-lg`}>
                          {c.docTitle}
                        </h4>
                        <span className={`text-[10px] font-mono ${currentTheme.headerMuted} shrink-0 ml-auto md:ml-0`}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Line 2: Authors, Year, Source / Publisher & Tags */}
                      <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap text-stone-500 dark:text-stone-400">
                        <span className="truncate max-w-md">
                          {c.authors && c.authors.length > 0 ? c.authors.join(', ') : 'Unknown Author'}
                          {c.publicationYear ? ` (${c.publicationYear})` : ''}
                          {(c.sourceOrPublisher || c.journalOrBookTitle) ? ` • ${c.sourceOrPublisher || c.journalOrBookTitle}` : ''}
                        </span>

                        {c.tags && c.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap shrink-0">
                            {c.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder}`}
                              >
                                #{t}
                              </span>
                            ))}
                            {c.tags.length > 4 && (
                              <span className="text-[9px] font-mono opacity-60">+{c.tags.length - 4}</span>
                            )}
                          </div>
                        )}

                        {c.userNote && (
                          <span className="text-[10px] font-sans italic text-amber-700 dark:text-amber-400 flex items-center gap-1 truncate max-w-xs">
                            <Pin className="w-2.5 h-2.5 shrink-0" />
                            {c.userNote}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                      {onOpenSourceInReader && (
                        <button
                          type="button"
                          onClick={() => onOpenSourceInReader(c.docFingerprint, c.pageNumber)}
                          className={`p-1.5 rounded-sm ${currentTheme.badgeBg} hover:${currentTheme.btnSecondaryHover} ${currentTheme.rootText} transition cursor-pointer border ${currentTheme.badgeBorder}`}
                          title="Open in Reader at this page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyCitation(c)}
                        className={`p-1.5 rounded-sm ${currentTheme.badgeBg} hover:${currentTheme.btnSecondaryHover} ${currentTheme.rootText} transition cursor-pointer border ${currentTheme.badgeBorder}`}
                        title="Copy Formatted Citation"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditCitation(c)}
                        className={`p-1.5 rounded-sm ${currentTheme.badgeBg} hover:${currentTheme.btnSecondaryHover} ${currentTheme.rootText} hover:text-amber-500 transition cursor-pointer border ${currentTheme.badgeBorder}`}
                        title="Edit citation & Post-It notes"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this citation from SQLite database?')) {
                            onDeleteCitation(c.docFingerprint, c.id);
                            showToast('Citation removed from database.');
                          }
                        }}
                        className={`p-1.5 rounded-sm ${currentTheme.badgeBg} hover:bg-red-500/20 text-stone-400 hover:text-red-500 transition cursor-pointer border ${currentTheme.badgeBorder}`}
                        title="Delete Citation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* GRID VIEW: Detailed cards */
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredCitations.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-sm border ${currentTheme.cardBorder} ${currentTheme.cardBg} ${currentTheme.cardText} p-5 space-y-3.5 shadow-sm transition hover:${currentTheme.cardHoverBorder} relative group`}
                  >
                    {/* Top Document & Page Metadata */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder}`}>
                            p. {c.pageNumber} {c.chapterName ? `• ${c.chapterName}` : ''}
                          </span>
                          <span className={`text-[10px] font-mono ${currentTheme.headerMuted}`}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold font-sans ${currentTheme.rootText} truncate max-w-sm`}>
                          {c.docTitle}
                        </h4>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onOpenSourceInReader && (
                          <button
                            type="button"
                            onClick={() => onOpenSourceInReader(c.docFingerprint, c.pageNumber)}
                            className={`p-1.5 rounded-sm ${currentTheme.badgeBg} hover:${currentTheme.btnSecondaryHover} ${currentTheme.rootText} transition cursor-pointer border ${currentTheme.badgeBorder}`}
                            title="Open in Reader at this page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyCitation(c)}
                          className={`p-1.5 rounded-sm ${currentTheme.badgeBg} hover:${currentTheme.btnSecondaryHover} ${currentTheme.rootText} transition cursor-pointer border ${currentTheme.badgeBorder}`}
                          title="Copy Formatted Citation"
                        >
                          {copiedId === c.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditCitation(c)}
                          className={`p-1.5 rounded-sm ${currentTheme.badgeBg} hover:${currentTheme.btnSecondaryHover} ${currentTheme.rootText} hover:text-amber-500 transition cursor-pointer border ${currentTheme.badgeBorder}`}
                          title="Edit citation & Post-It notes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this citation from SQLite database?')) {
                              onDeleteCitation(c.docFingerprint, c.id);
                              showToast('Citation removed from database.');
                            }
                          }}
                          className={`p-1.5 rounded-sm ${currentTheme.badgeBg} hover:bg-red-500/20 text-stone-400 hover:text-red-500 transition cursor-pointer border ${currentTheme.badgeBorder}`}
                          title="Delete Citation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Excerpt Quote Text */}
                    <div className={`pl-3 border-l-3 border-amber-500 font-serif italic text-xs leading-relaxed ${currentTheme.rootText} select-text`}>
                      “{c.quoteText}”
                    </div>

                    {/* Formatted Full Citation Line */}
                    <div className={`text-[11px] font-sans ${currentTheme.cardText} leading-snug ${currentTheme.codeBoxBg} ${currentTheme.codeBoxText} p-3 rounded-xs border ${currentTheme.codeBoxBorder} select-text`}>
                      <strong className="text-[9px] uppercase font-mono text-amber-500 block mb-0.5">
                        {citationStyle.toUpperCase()} Reference:
                      </strong>
                      {formatFullCitation(c, citationStyle)}
                    </div>

                    {/* Post-It Note embedded card (if note exists) */}
                    {c.userNote && (
                      <div className="bg-[#fcfaf4] text-[#1c1917] p-3 rounded-xs border border-stone-200 border-l-3 border-l-amber-500 shadow-xs space-y-1 select-text">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase font-mono text-stone-700">
                          <Pin className="w-3 h-3 text-amber-700" />
                          Note / Commentary:
                        </div>
                        <p className="text-xs font-sans leading-relaxed text-stone-900">
                          {c.userNote}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.tags.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedTag(t)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} hover:border-amber-500 text-[10px] font-mono transition cursor-pointer`}
                          >
                            <Tag className="w-2.5 h-2.5 opacity-60" />
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Toast */}
      {feedbackToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-emerald-700 text-white text-xs font-mono shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          {feedbackToast}
        </div>
      )}
    </div>
  );
};
