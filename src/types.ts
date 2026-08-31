export type CitationStyle = 
  | 'apa' 
  | 'mla' 
  | 'chicago-author-date' 
  | 'chicago-notes' 
  | 'harvard' 
  | 'ieee' 
  | 'bibtex';

export type ReadingTheme = 'paper' | 'sepia' | 'slate' | 'onyx';
export type FontChoice = 'serif' | 'sans' | 'mono';
export type ExportFormat = 'bibtex' | 'pdf' | 'markdown' | 'txt' | 'csv' | 'json';

export interface ThirdPartyAttribution {
  isThirdPartyQuote: boolean;
  detectedAuthor?: string;
  detectedYear?: string;
  originalWorkTitle?: string;
  citingPhrase?: string; // e.g. "As noted by", "According to", "quoted in"
  sourceText?: string;
}

export interface CitationEntry {
  id: string;
  docFingerprint: string;
  docTitle: string;
  quoteText: string;
  pageNumber: number;
  pageNumberDisplay?: string; // e.g. "pp. 14-15" or "p. 14"
  chapterName?: string;
  sectionName?: string;
  authors: string[];
  publicationYear: string;
  publicationDate?: string;
  sourceOrPublisher: string;
  journalOrBookTitle?: string;
  volume?: string;
  issue?: string;
  edition?: string;
  instituteOrOrg?: string;
  doi?: string;
  url?: string;
  isbn?: string;
  arxivId?: string;
  contextBefore?: string;
  contextAfter?: string;
  thirdPartyAttribution?: ThirdPartyAttribution;
  tags: string[];
  userNote?: string;
  createdAt: number;
}

export interface DocumentPage {
  pageNumber: number;
  chapterTitle?: string;
  text: string;
  htmlContent?: string;
}

export interface ResearchDocument {
  id: string;
  fingerprint: string;
  title: string;
  authors: string[];
  publicationYear: string;
  publicationDate?: string;
  sourceOrPublisher: string;
  journalOrBookTitle?: string;
  volume?: string;
  issue?: string;
  edition?: string;
  chapterName?: string;
  instituteOrOrg?: string;
  doi?: string;
  url?: string;
  isbn?: string;
  arxivId?: string;
  abstract?: string;
  fileType: 'pdf' | 'epub' | 'txt' | 'md' | 'html';
  fileName: string;
  fileSize?: number;
  pages: DocumentPage[];
  tableOfContents?: Array<{ title: string; pageNumber: number }>;
  pdfDataUri?: string; // for rendering PDF canvas if needed
  rawArrayBuffer?: ArrayBuffer;
}

export interface ReaderSettings {
  theme: ReadingTheme;
  font: FontChoice;
  fontSize: number; // in px, default 18
  lineHeight: 'relaxed' | 'normal' | 'compact';
  contentWidth: 'narrow' | 'medium' | 'wide';
  focusMode: boolean;
  citationStyle: CitationStyle;
  autoScanContext: boolean;
}
