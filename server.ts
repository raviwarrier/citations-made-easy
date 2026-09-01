import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import initSqlJs, { Database } from 'sql.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json({ limit: '10mb' }));

// SQLite Database Setup (Persistent server file citations.db)
const DB_FILE_PATH = path.join(process.cwd(), 'citations.db');
let serverDb: Database | null = null;

async function initServerDatabase(): Promise<Database> {
  if (serverDb) return serverDb;
  const SQL = await initSqlJs();
  let db: Database;
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      db = new SQL.Database(fileBuffer);
    } catch {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

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

  serverDb = db;
  return db;
}

function saveServerDatabase(): void {
  if (!serverDb) return;
  try {
    const data = serverDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite DB file to disk:', err);
  }
}

/**
 * Basic robots.txt parser according to standard Robot Exclusion Protocol
 */
async function checkRobotsTxt(targetUrl: URL): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const robotsUrl = `${targetUrl.origin}/robots.txt`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CitationsMadeEasy/1.0 (Academic Reader; respectful bot)',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // If robots.txt doesn't exist (404, etc.), access is allowed by convention
      return { allowed: true };
    }

    const text = await res.text();
    const lines = text.split(/\r?\n/);

    let appliesToAll = false;
    let disallowRules: string[] = [];
    let allowRules: string[] = [];

    for (let rawLine of lines) {
      // Remove comments and trim
      const line = rawLine.split('#')[0].trim();
      if (!line) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const directive = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();

      if (directive === 'user-agent') {
        if (value === '*' || value.toLowerCase().includes('citationsmadeeasy')) {
          appliesToAll = true;
        } else {
          appliesToAll = false;
        }
      } else if (appliesToAll) {
        if (directive === 'disallow' && value) {
          disallowRules.push(value);
        } else if (directive === 'allow' && value) {
          allowRules.push(value);
        }
      }
    }

    const pathname = targetUrl.pathname + targetUrl.search;

    // Check allow rules first
    for (const rule of allowRules) {
      if (rule === '/' || pathname.startsWith(rule)) {
        return { allowed: true };
      }
    }

    // Check disallow rules
    for (const rule of disallowRules) {
      if (rule === '/') {
        return { allowed: false, reason: 'Root path is disallowed by robots.txt' };
      }
      if (rule.endsWith('*')) {
        const prefix = rule.slice(0, -1);
        if (pathname.startsWith(prefix)) {
          return { allowed: false, reason: `Path matches Disallow rule: ${rule}` };
        }
      } else if (pathname.startsWith(rule)) {
        return { allowed: false, reason: `Path matches Disallow rule: ${rule}` };
      }
    }

    return { allowed: true };
  } catch (err) {
    // If fetching robots.txt times out or network fails, permit respectful reader access
    return { allowed: true };
  }
}

/**
 * Clean reader extraction from raw HTML
 */
function extractReaderContent(html: string, pageUrl: string) {
  // Extract Title
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
  }
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    title = ogTitleMatch[1].trim();
  }
  const citationTitleMatch = html.match(/<meta[^>]+name=["']citation_title["'][^>]+content=["']([^"']+)["']/i);
  if (citationTitleMatch && citationTitleMatch[1]) {
    title = citationTitleMatch[1].trim();
  }
  if (!title) {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) title = h1Match[1].replace(/<[^>]+>/g, '').trim();
  }
  if (!title) title = 'Web Article';

  // Extract Authors
  const authors: string[] = [];
  const citationAuthorMatches = html.matchAll(/<meta[^>]+name=["']citation_author["'][^>]+content=["']([^"']+)["']/gi);
  for (const m of citationAuthorMatches) {
    if (m[1] && !authors.includes(m[1].trim())) authors.push(m[1].trim());
  }
  if (authors.length === 0) {
    const metaAuthorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
    if (metaAuthorMatch && metaAuthorMatch[1]) {
      authors.push(...metaAuthorMatch[1].split(/,|;|\band\b/).map((s) => s.trim()).filter(Boolean));
    }
  }
  if (authors.length === 0) {
    const ogAuthorMatch = html.match(/<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i);
    if (ogAuthorMatch && ogAuthorMatch[1]) {
      authors.push(ogAuthorMatch[1].trim());
    }
  }

  // Extract Site Name / Publisher
  let siteName = '';
  const ogSiteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  if (ogSiteMatch && ogSiteMatch[1]) {
    siteName = ogSiteMatch[1].trim();
  }
  if (!siteName) {
    try {
      const u = new URL(pageUrl);
      siteName = u.hostname.replace(/^www\./, '');
    } catch {
      siteName = 'Website';
    }
  }

  // Extract Publication Date / Year
  let publicationYear = '';
  let publicationDate = '';
  const dateMatch =
    html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+name=["']citation_publication_date["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<time[^>]+datetime=["']([^"']+)["']/i);

  if (dateMatch && dateMatch[1]) {
    publicationDate = dateMatch[1].split('T')[0];
    const y = publicationDate.match(/\b(19\d\d|20\d\d)\b/);
    if (y) publicationYear = y[1];
  }

  if (!publicationYear) {
    publicationYear = new Date().getFullYear().toString();
  }

  // Strip scripts, styles, noscripts, iframes, svgs, forms, navs, footers, headers, asides
  let cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Extract article or main tag if present
  let mainBody = cleanHtml;
  const articleMatch = cleanHtml.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleanHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const roleMainMatch = cleanHtml.match(/<div\b[^>]+role=["']main["'][^>]*>([\s\S]*?)<\/div>/i);

  if (articleMatch && articleMatch[1].length > 400) {
    mainBody = articleMatch[1];
  } else if (mainMatch && mainMatch[1].length > 400) {
    mainBody = mainMatch[1];
  } else if (roleMainMatch && roleMainMatch[1].length > 400) {
    mainBody = roleMainMatch[1];
  }

  // Extract paragraphs, headings, lists
  const blocks: Array<{ title?: string; text: string }> = [];
  let currentSectionTitle = title;
  let currentTextBuffer: string[] = [];

  // Match headings and paragraphs
  const elementRegex = /<(h[1-4]|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = elementRegex.exec(mainBody)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    if (!content || content.length < 5) continue;

    if (tag.startsWith('h')) {
      if (currentTextBuffer.length > 0) {
        blocks.push({
          title: currentSectionTitle,
          text: currentTextBuffer.join('\n\n'),
        });
        currentTextBuffer = [];
      }
      currentSectionTitle = content;
    } else {
      currentTextBuffer.push(content);
    }
  }

  if (currentTextBuffer.length > 0) {
    blocks.push({
      title: currentSectionTitle,
      text: currentTextBuffer.join('\n\n'),
    });
  }

  // If no structured blocks were found, fallback to stripping all tags
  if (blocks.length === 0) {
    const rawCleanText = mainBody
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    if (rawCleanText) {
      blocks.push({
        title: title,
        text: rawCleanText,
      });
    }
  }

  // Paginate blocks into natural reading pages (~350 words per page)
  const pages: Array<{ pageNumber: number; chapterTitle: string; text: string }> = [];
  let currentPageWords: string[] = [];
  let currentPageChapter = title;
  let pageNumber = 1;

  for (const block of blocks) {
    const paragraphs = block.text.split('\n\n');
    for (const p of paragraphs) {
      const words = p.split(/\s+/).filter(Boolean);
      if (currentPageWords.length + words.length > 380 && currentPageWords.length > 100) {
        pages.push({
          pageNumber,
          chapterTitle: currentPageChapter,
          text: currentPageWords.join(' '),
        });
        pageNumber++;
        currentPageWords = [];
        currentPageChapter = block.title || title;
      }
      currentPageWords.push(p);
    }
  }

  if (currentPageWords.length > 0 || pages.length === 0) {
    pages.push({
      pageNumber,
      chapterTitle: currentPageChapter,
      text: currentPageWords.join('\n\n') || 'Content extracted from ' + pageUrl,
    });
  }

  return {
    title,
    authors: authors.length > 0 ? authors : [siteName || 'Staff'],
    publicationYear,
    publicationDate,
    sourceOrPublisher: siteName,
    journalOrBookTitle: siteName,
    url: pageUrl,
    pages,
  };
}

// API Route: Fetch and Clean URL Article
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid URL is required.' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format. Please include https://' });
    }

    // Step 1: Check robots.txt
    const robotsCheck = await checkRobotsTxt(parsedUrl);
    if (!robotsCheck.allowed) {
      return res.status(403).json({
        success: false,
        isRobotsDisallowed: true,
        error: `Access to this page is restricted by the website's robots.txt policy (${robotsCheck.reason}).`,
      });
    }

    // Step 2: Fetch the page HTML with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (CitationsMadeEasy Reader)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Website responded with HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const html = await response.text();
    const extracted = extractReaderContent(html, parsedUrl.href);

    const document = {
      id: `web_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fingerprint: `web_${parsedUrl.hostname}_${parsedUrl.pathname.replace(/[^a-z0-9]/gi, '_')}`.slice(0, 64),
      title: extracted.title,
      authors: extracted.authors,
      publicationYear: extracted.publicationYear,
      publicationDate: extracted.publicationDate,
      sourceOrPublisher: extracted.sourceOrPublisher,
      journalOrBookTitle: extracted.journalOrBookTitle,
      url: parsedUrl.href,
      fileType: 'html' as const,
      fileName: `${parsedUrl.hostname}.html`,
      pages: extracted.pages,
    };

    return res.json({
      success: true,
      document,
    });
  } catch (err: any) {
    console.error('URL extraction error:', err);
    if (err.name === 'AbortError') {
      return res.status(504).json({ success: false, error: 'Request timed out while contacting website.' });
    }
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch and extract web page.' });
  }
});

// SQLite Citations API Routes
app.get('/api/citations', async (req, res) => {
  try {
    const db = await initServerDatabase();
    const { docFingerprint, tag, keyword } = req.query;

    let query = 'SELECT * FROM citations WHERE 1=1';
    const params: any[] = [];

    if (docFingerprint && typeof docFingerprint === 'string') {
      query += ' AND docFingerprint = ?';
      params.push(docFingerprint);
    }
    if (tag && typeof tag === 'string') {
      query += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }
    if (keyword && typeof keyword === 'string') {
      query += ' AND (quoteText LIKE ? OR userNote LIKE ? OR docTitle LIKE ? OR authors LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }

    query += ' ORDER BY createdAt DESC';

    const stmt = db.prepare(query);
    stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      let authors = [];
      let tags = [];
      let thirdPartyAttribution = undefined;
      try { authors = JSON.parse(String(row.authors || '[]')); } catch {}
      try { tags = JSON.parse(String(row.tags || '[]')); } catch {}
      try { if (row.thirdPartyAttribution) thirdPartyAttribution = JSON.parse(String(row.thirdPartyAttribution)); } catch {}

      results.push({
        ...row,
        authors,
        tags,
        thirdPartyAttribution,
      });
    }
    stmt.free();

    return res.json({ success: true, citations: results });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Database query failed.' });
  }
});

app.post('/api/citations', async (req, res) => {
  try {
    const db = await initServerDatabase();
    const c = req.body;
    if (!c || !c.id || !c.docFingerprint) {
      return res.status(400).json({ success: false, error: 'Invalid citation object' });
    }

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

    stmt.free();
    saveServerDatabase();

    return res.json({ success: true, id: c.id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save citation' });
  }
});

app.delete('/api/citations/:id', async (req, res) => {
  try {
    const db = await initServerDatabase();
    const { id } = req.params;
    db.run('DELETE FROM citations WHERE id = ?', [id]);
    saveServerDatabase();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Sources summary route (Grouped by paper/article/website/book)
app.get('/api/sources', async (req, res) => {
  try {
    const db = await initServerDatabase();
    const resSummary = db.exec(`
      SELECT docFingerprint, docTitle, authors, publicationYear, sourceOrPublisher, COUNT(*) as count
      FROM citations
      GROUP BY docFingerprint
      ORDER BY MAX(createdAt) DESC
    `);

    const sources = (resSummary[0]?.values || []).map((row) => {
      let authors: string[] = [];
      try { authors = JSON.parse(String(row[2] || '[]')); } catch { authors = [String(row[2])]; }
      return {
        fingerprint: String(row[0]),
        title: String(row[1]),
        authors,
        year: String(row[3] || ''),
        sourceOrPublisher: String(row[4] || ''),
        citationCount: Number(row[5]),
      };
    });

    return res.json({ success: true, sources });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Download full SQLite binary database file
app.get('/api/export/sqlite', async (req, res) => {
  try {
    const db = await initServerDatabase();
    const data = db.export();
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', 'attachment; filename="citations-repository.sqlite"');
    return res.send(Buffer.from(data));
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  await initServerDatabase();
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Citations Made Easy server running on http://${HOST}:${PORT}`);
  });
}

startServer();
