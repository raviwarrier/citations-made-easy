import { CitationEntry, ReaderSettings } from '../types';

const STORAGE_PREFIX = 'scholarread_citations_';
const SETTINGS_KEY = 'scholarread_settings';
const RECENT_DOCS_KEY = 'scholarread_recent_docs';
const BACKUP_FLAG_KEY = 'scholarread_last_backup_time';

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'paper',
  font: 'serif',
  fontSize: 18,
  lineHeight: 'relaxed',
  contentWidth: 'medium',
  focusMode: false,
  citationStyle: 'apa',
  autoScanContext: true,
};

export interface RecentDocMeta {
  fingerprint: string;
  title: string;
  authors: string[];
  year: string;
  fileType: string;
  citationCount: number;
  lastOpened: number;
}

/**
 * Load all citations saved locally for a specific document fingerprint
 */
export function loadDocCitations(fingerprint: string): CitationEntry[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${fingerprint}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load local citations for doc:', err);
    return [];
  }
}

/**
 * Save citations list for a document
 */
export function saveDocCitations(fingerprint: string, citations: CitationEntry[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${fingerprint}`, JSON.stringify(citations));
    updateRecentDocCitationCount(fingerprint, citations.length);
  } catch (err) {
    console.error('Failed to save citations locally:', err);
  }
}

/**
 * Append or update a single citation entry for a document
 */
export function appendDocCitation(citation: CitationEntry): CitationEntry[] {
  const existing = loadDocCitations(citation.docFingerprint);
  const index = existing.findIndex((c) => c.id === citation.id);

  let updated: CitationEntry[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = citation;
  } else {
    updated = [citation, ...existing];
  }

  saveDocCitations(citation.docFingerprint, updated);
  return updated;
}

/**
 * Delete a citation entry by ID
 */
export function deleteDocCitation(fingerprint: string, citationId: string): CitationEntry[] {
  const existing = loadDocCitations(fingerprint);
  const updated = existing.filter((c) => c.id !== citationId);
  saveDocCitations(fingerprint, updated);
  return updated;
}

/**
 * Save recent document entry
 */
export function recordRecentDoc(meta: Omit<RecentDocMeta, 'lastOpened' | 'citationCount'>, count?: number): void {
  try {
    const raw = localStorage.getItem(RECENT_DOCS_KEY);
    let recents: RecentDocMeta[] = raw ? JSON.parse(raw) : [];

    const existingIndex = recents.findIndex((d) => d.fingerprint === meta.fingerprint);
    const existingCitations = count !== undefined ? count : (loadDocCitations(meta.fingerprint).length);

    const newEntry: RecentDocMeta = {
      ...meta,
      citationCount: existingCitations,
      lastOpened: Date.now(),
    };

    if (existingIndex >= 0) {
      recents.splice(existingIndex, 1);
    }
    recents.unshift(newEntry);

    // Keep up to 20 recent records
    recents = recents.slice(0, 20);
    localStorage.setItem(RECENT_DOCS_KEY, JSON.stringify(recents));
  } catch (err) {
    console.error('Failed to record recent doc:', err);
  }
}

function updateRecentDocCitationCount(fingerprint: string, count: number): void {
  try {
    const raw = localStorage.getItem(RECENT_DOCS_KEY);
    if (!raw) return;
    const recents: RecentDocMeta[] = JSON.parse(raw);
    const target = recents.find((d) => d.fingerprint === fingerprint);
    if (target) {
      target.citationCount = count;
      localStorage.setItem(RECENT_DOCS_KEY, JSON.stringify(recents));
    }
  } catch (err) {
    // ignore
  }
}

/**
 * Get all recent documents
 */
export function getRecentDocs(): RecentDocMeta[] {
  try {
    const raw = localStorage.getItem(RECENT_DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Load reader user settings
 */
export function loadUserSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save reader user settings
 */
export function saveUserSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Export entire local database (all citations across all documents)
 */
export function exportEntireLocalDatabase(): string {
  const allData: Record<string, any> = {
    app: 'ScholarRead',
    exportedAt: new Date().toISOString(),
    documents: [],
  };

  const recents = getRecentDocs();
  for (const doc of recents) {
    const citations = loadDocCitations(doc.fingerprint);
    allData.documents.push({
      meta: doc,
      citations,
    });
  }

  return JSON.stringify(allData, null, 2);
}

/**
 * Get total citations stored locally across all documents
 */
export function getTotalLocalCitationCount(): number {
  const recents = getRecentDocs();
  return recents.reduce((acc, curr) => acc + (curr.citationCount || 0), 0);
}
