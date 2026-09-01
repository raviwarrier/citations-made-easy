import initSqlJs, { Database } from 'sql.js';
import { CitationEntry } from '../types';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

const SQLITE_STORAGE_KEY = 'scholarread_sqlite_db_binary';

/**
 * Initialize sql.js database (loads from client localStorage/IndexedDB or creates fresh)
 */
export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`,
    });

    let savedBinary: Uint8Array | null = null;
    try {
      const b64 = localStorage.getItem(SQLITE_STORAGE_KEY);
      if (b64) {
        const binStr = atob(b64);
        savedBinary = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          savedBinary[i] = binStr.charCodeAt(i);
        }
      }
    } catch (err) {
      console.warn('Could not restore SQLite db from local storage:', err);
    }

    const db = savedBinary ? new SQL.Database(savedBinary) : new SQL.Database();

    // Create schema
    db.run(`
      CREATE TABLE IF NOT EXISTS citations (
        id TEXT PRIMARY KEY,
        docFingerprint TEXT NOT NULL,
        docTitle TEXT NOT NULL,
        quoteText TEXT NOT NULL,
        pageNumber INTEGER NOT NULL,
        pageNumberDisplay TEXT,
        chapterName TEXT,
        sectionName TEXT,
        authors TEXT NOT NULL,
        publicationYear TEXT,
        publicationDate TEXT,
        sourceOrPublisher TEXT,
        journalOrBookTitle TEXT,
        volume TEXT,
        issue TEXT,
        edition TEXT,
        instituteOrOrg TEXT,
        doi TEXT,
        url TEXT,
        isbn TEXT,
        arxivId TEXT,
        contextBefore TEXT,
        contextAfter TEXT,
        thirdPartyAttribution TEXT,
        tags TEXT,
        userNote TEXT,
        createdAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_citations_doc ON citations(docFingerprint);
      CREATE INDEX IF NOT EXISTS idx_citations_created ON citations(createdAt);
    `);

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

/**
 * Persist the SQLite binary to client localStorage and optionally sync to server
 */
export async function persistSqliteDb(): Promise<void> {
  if (!dbInstance) return;
  try {
    const binary = dbInstance.export();
    let binaryString = '';
    const chunk = 8192;
    for (let i = 0; i < binary.length; i += chunk) {
      binaryString += String.fromCharCode.apply(
        null,
        binary.subarray(i, i + chunk) as unknown as number[]
      );
    }
    const b64 = btoa(binaryString);
    localStorage.setItem(SQLITE_STORAGE_KEY, b64);
  } catch (err) {
    console.warn('Failed to persist SQLite binary locally:', err);
  }
}

/**
 * Convert a DB row into a CitationEntry object
 */
function rowToCitation(row: any[]): CitationEntry {
  let authors: string[] = [];
  try {
    authors = JSON.parse(row[8] || '[]');
  } catch {
    authors = row[8] ? [String(row[8])] : [];
  }

  let thirdPartyAttribution: any = undefined;
  if (row[23]) {
    try {
      thirdPartyAttribution = JSON.parse(row[23]);
    } catch {
      // ignore
    }
  }

  let tags: string[] = [];
  if (row[24]) {
    try {
      tags = JSON.parse(row[24]);
    } catch {
      tags = [String(row[24])];
    }
  }

  return {
    id: row[0],
    docFingerprint: row[1],
    docTitle: row[2],
    quoteText: row[3],
    pageNumber: Number(row[4]),
    pageNumberDisplay: row[5] || undefined,
    chapterName: row[6] || undefined,
    sectionName: row[7] || undefined,
    authors,
    publicationYear: row[9] || '',
    publicationDate: row[10] || undefined,
    sourceOrPublisher: row[11] || '',
    journalOrBookTitle: row[12] || undefined,
    volume: row[13] || undefined,
    issue: row[14] || undefined,
    edition: row[15] || undefined,
    instituteOrOrg: row[16] || undefined,
    doi: row[17] || undefined,
    url: row[18] || undefined,
    isbn: row[19] || undefined,
    arxivId: row[20] || undefined,
    contextBefore: row[21] || undefined,
    contextAfter: row[22] || undefined,
    thirdPartyAttribution,
    tags,
    userNote: row[25] || undefined,
    createdAt: Number(row[26]),
  };
}

/**
 * Save / Upsert Citation in SQLite DB
 */
export async function saveCitationToSqlite(citation: CitationEntry): Promise<void> {
  const db = await getSqliteDb();
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO citations (
      id, docFingerprint, docTitle, quoteText, pageNumber, pageNumberDisplay,
      chapterName, sectionName, authors, publicationYear, publicationDate,
      sourceOrPublisher, journalOrBookTitle, volume, issue, edition,
      instituteOrOrg, doi, url, isbn, arxivId,
      contextBefore, contextAfter, thirdPartyAttribution, tags, userNote, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    citation.id,
    citation.docFingerprint,
    citation.docTitle,
    citation.quoteText,
    citation.pageNumber,
    citation.pageNumberDisplay || null,
    citation.chapterName || null,
    citation.sectionName || null,
    JSON.stringify(citation.authors || []),
    citation.publicationYear || '',
    citation.publicationDate || null,
    citation.sourceOrPublisher || '',
    citation.journalOrBookTitle || null,
    citation.volume || null,
    citation.issue || null,
    citation.edition || null,
    citation.instituteOrOrg || null,
    citation.doi || null,
    citation.url || null,
    citation.isbn || null,
    citation.arxivId || null,
    citation.contextBefore || null,
    citation.contextAfter || null,
    citation.thirdPartyAttribution ? JSON.stringify(citation.thirdPartyAttribution) : null,
    JSON.stringify(citation.tags || []),
    citation.userNote || null,
    citation.createdAt || Date.now(),
  ]);

  stmt.free();
  await persistSqliteDb();

  // Async sync to server API
  try {
    fetch('/api/citations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(citation),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

/**
 * Delete Citation from SQLite DB
 */
export async function deleteCitationFromSqlite(id: string): Promise<void> {
  const db = await getSqliteDb();
  db.run(`DELETE FROM citations WHERE id = ?`, [id]);
  await persistSqliteDb();

  // Async sync to server
  try {
    fetch(`/api/citations/${id}`, { method: 'DELETE' }).catch(() => {});
  } catch {
    // ignore
  }
}

/**
 * Retrieve All Citations from SQLite DB
 */
export async function getAllCitationsFromSqlite(): Promise<CitationEntry[]> {
  const db = await getSqliteDb();
  const res = db.exec(`SELECT * FROM citations ORDER BY createdAt DESC`);
  if (!res.length || !res[0].values) return [];
  return res[0].values.map((row) => rowToCitation(row));
}

export const querySqliteCitations = getAllCitationsFromSqlite;

/**
 * Retrieve Citations for a Specific Document Fingerprint
 */
export async function getCitationsByDocFromSqlite(docFingerprint: string): Promise<CitationEntry[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare(`SELECT * FROM citations WHERE docFingerprint = ? ORDER BY pageNumber ASC, createdAt DESC`);
  stmt.bind([docFingerprint]);
  const rows: CitationEntry[] = [];
  while (stmt.step()) {
    rows.push(rowToCitation(stmt.get()));
  }
  stmt.free();
  return rows;
}

/**
 * Query Distinct Sources with Citation Counts
 * e.g. [{ fingerprint: '...', title: 'Paper 1', count: 4 }, { title: 'Article 2', count: 5 }]
 */
export async function getSourceSummaryFromSqlite(): Promise<
  Array<{
    fingerprint: string;
    title: string;
    authors: string[];
    year: string;
    sourceOrPublisher: string;
    citationCount: number;
  }>
> {
  const db = await getSqliteDb();
  const res = db.exec(`
    SELECT docFingerprint, docTitle, authors, publicationYear, sourceOrPublisher, COUNT(*) as citationCount
    FROM citations
    GROUP BY docFingerprint
    ORDER BY MAX(createdAt) DESC
  `);

  if (!res.length || !res[0].values) return [];

  return res[0].values.map((row) => {
    let authors: string[] = [];
    try {
      authors = JSON.parse(String(row[2] || '[]'));
    } catch {
      authors = row[2] ? [String(row[2])] : [];
    }

    return {
      fingerprint: String(row[0]),
      title: String(row[1]),
      authors,
      year: String(row[3] || ''),
      sourceOrPublisher: String(row[4] || ''),
      citationCount: Number(row[5]),
    };
  });
}

/**
 * Query Distinct Tags with Counts
 */
export async function getAllTagsFromSqlite(): Promise<Array<{ tag: string; count: number }>> {
  const all = await getAllCitationsFromSqlite();
  const map = new Map<string, number>();
  for (const c of all) {
    if (c.tags && Array.isArray(c.tags)) {
      for (const t of c.tags) {
        const trimmed = t.trim();
        if (trimmed) {
          map.set(trimmed, (map.get(trimmed) || 0) + 1);
        }
      }
    }
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Export the current SQLite database as a downloadable `.sqlite` binary file
 */
export async function exportSqliteDatabaseBinary(
  subsetCitations?: CitationEntry[],
  filename: string = 'citations-database.sqlite'
): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`,
  });

  let binary: Uint8Array;

  if (subsetCitations && subsetCitations.length > 0) {
    // Create a new dedicated SQLite database containing only the requested subset (e.g. single source or tag)
    const exportDb = new SQL.Database();
    exportDb.run(`
      CREATE TABLE citations (
        id TEXT PRIMARY KEY,
        docFingerprint TEXT NOT NULL,
        docTitle TEXT NOT NULL,
        quoteText TEXT NOT NULL,
        pageNumber INTEGER NOT NULL,
        pageNumberDisplay TEXT,
        chapterName TEXT,
        sectionName TEXT,
        authors TEXT NOT NULL,
        publicationYear TEXT,
        publicationDate TEXT,
        sourceOrPublisher TEXT,
        journalOrBookTitle TEXT,
        volume TEXT,
        issue TEXT,
        edition TEXT,
        instituteOrOrg TEXT,
        doi TEXT,
        url TEXT,
        isbn TEXT,
        arxivId TEXT,
        contextBefore TEXT,
        contextAfter TEXT,
        thirdPartyAttribution TEXT,
        tags TEXT,
        userNote TEXT,
        createdAt INTEGER NOT NULL
      );
    `);

    const stmt = exportDb.prepare(`
      INSERT INTO citations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of subsetCitations) {
      stmt.run([
        c.id,
        c.docFingerprint,
        c.docTitle,
        c.quoteText,
        c.pageNumber,
        c.pageNumberDisplay || null,
        c.chapterName || null,
        c.sectionName || null,
        JSON.stringify(c.authors || []),
        c.publicationYear || '',
        c.publicationDate || null,
        c.sourceOrPublisher || '',
        c.journalOrBookTitle || null,
        c.volume || null,
        c.issue || null,
        c.edition || null,
        c.instituteOrOrg || null,
        c.doi || null,
        c.url || null,
        c.isbn || null,
        c.arxivId || null,
        c.contextBefore || null,
        c.contextAfter || null,
        c.thirdPartyAttribution ? JSON.stringify(c.thirdPartyAttribution) : null,
        JSON.stringify(c.tags || []),
        c.userNote || null,
        c.createdAt || Date.now(),
      ]);
    }
    stmt.free();
    binary = exportDb.export();
    exportDb.close();
  } else {
    const db = await getSqliteDb();
    binary = db.export();
  }

  // Trigger file download in browser
  const blob = new Blob([binary], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.sqlite') ? filename : `${filename}.sqlite`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
