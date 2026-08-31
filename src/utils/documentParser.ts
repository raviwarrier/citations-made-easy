import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentPage, ResearchDocument } from '../types';

// Set up PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Use compatible CDN worker or bundled
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * Generate a consistent deterministic fingerprint for a document
 */
export function generateDocFingerprint(name: string, size: number, firstSnippet: string): string {
  const str = `${name}_${size}_${firstSnippet.slice(0, 100).replace(/\s+/g, '')}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `doc_${Math.abs(hash).toString(36)}`;
}

/**
 * Extract structured metadata (Authors, DOI, Year, Journal, Institute) from text
 */
export function extractMetadataFromText(fullText: string, fileName: string): Partial<ResearchDocument> {
  const meta: Partial<ResearchDocument> = {};
  const first1500 = fullText.slice(0, 2000);

  // Extract DOI (e.g. 10.1000/182, 10.1103/PhysRev.47.777)
  const doiMatch = first1500.match(/\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i);
  if (doiMatch) {
    meta.doi = doiMatch[1].replace(/[,;.\s]+$/, '');
  }

  // Extract arXiv ID (e.g. arXiv:2401.12345)
  const arxivMatch = first1500.match(/arXiv:\s*(\d{4}\.\d{4,5}(?:v\d+)?)/i);
  if (arxivMatch) {
    meta.arxivId = arxivMatch[1];
  }

  // Extract Year (4 digits like 19xx or 20xx)
  const yearMatch = first1500.match(/\b(20[0-2][0-9]|19[5-9][0-9])\b/);
  if (yearMatch) {
    meta.publicationYear = yearMatch[1];
  } else {
    meta.publicationYear = new Date().getFullYear().toString();
  }

  // Look for Institute / University
  const instituteMatch = first1500.match(/(?:Department of [^,\n]+|Institute [^,\n]+|University of [^,\n]+|[^,\n]+ University|[^,\n]+ Laboratory|Max Planck [^,\n]+|MIT [^,\n]+|Stanford [^,\n]+|Harvard [^,\n]+|Oxford [^,\n]+|Cambridge [^,\n]+)/i);
  if (instituteMatch) {
    meta.instituteOrOrg = instituteMatch[0].trim();
  }

  // Look for Journal / Conference / Publisher
  const journalMatch = first1500.match(/(?:Journal of [^,\n]+|Proceedings of [^,\n]+|Physical Review [^,\n]+|Nature [^,\n]+|Science [^,\n]+|IEEE Transactions on [^,\n]+|Communications of the ACM|Oxford University Press|Cambridge University Press|Springer|Elsevier|MIT Press)/i);
  if (journalMatch) {
    meta.journalOrBookTitle = journalMatch[0].trim();
  }

  return meta;
}

/**
 * Helper to extract formatted, structured text from PDF page items with lines & paragraphs
 */
function extractStructuredTextFromPdfPage(textContent: any): string {
  const items = textContent?.items as Array<any>;
  if (!items || items.length === 0) return '';

  let result = '';
  let lastY: number | null = null;
  let lastX: number | null = null;
  let lastHeight = 12;

  for (const item of items) {
    if (!('str' in item) || !item.str) continue;
    const str = item.str;
    const tx = item.transform ? item.transform[4] : 0;
    const ty = item.transform ? item.transform[5] : 0;
    const height = item.height || (item.transform ? Math.abs(item.transform[3]) : 12);

    if (lastY !== null) {
      const deltaY = Math.abs(ty - lastY);
      if (deltaY > height * 1.5) {
        // New paragraph or section gap
        result += '\n\n';
      } else if (deltaY > height * 0.4) {
        // Standard line break
        result += '\n';
      } else if (lastX !== null && tx > lastX + 2 && !result.endsWith(' ') && !str.startsWith(' ')) {
        // Space between words on the same horizontal line
        result += ' ';
      }
    }

    result += str;
    lastY = ty;
    lastX = tx + (item.width || 0);
    lastHeight = height;
  }

  return result.trim();
}

/**
 * Parse a PDF file
 */
export async function parsePdfFile(file: File): Promise<ResearchDocument> {
  const arrayBuffer = await file.arrayBuffer();
  // Clone buffer so PDF.js doesn't detach the only reference
  const bufferCopy = arrayBuffer.slice(0);
  const loadingTask = pdfjsLib.getDocument({ 
    data: bufferCopy,
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/',
    cMapPacked: true,
  });
  const pdfDoc = await loadingTask.promise;

  const numPages = pdfDoc.numPages;
  const pages: DocumentPage[] = [];
  let fullTextAccumulator = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = extractStructuredTextFromPdfPage(textContent);

    pages.push({
      pageNumber: i,
      text: pageText || `[Page ${i} - Graphical/Scanned content]`,
    });
    fullTextAccumulator += pageText + '\n\n';
  }

  // Read metadata from PDF dictionary
  let title = file.name.replace(/\.[^/.]+$/, '');
  let authors: string[] = [];
  let publisher = 'Academic Publication';

  try {
    const pdfMeta = await pdfDoc.getMetadata();
    const info = pdfMeta.info as any;
    if (info?.Title && info.Title.trim().length > 3) {
      title = info.Title.trim();
    }
    if (info?.Author) {
      authors = info.Author.split(/[,;&]/).map((a: string) => a.trim()).filter(Boolean);
    }
    if (info?.Producer || info?.Creator) {
      publisher = info.Producer || info.Creator;
    }
  } catch (err) {
    // ignore
  }

  // If no author found from PDF info, heuristically check first page
  if (authors.length === 0 && pages[0]?.text) {
    const firstPageLines = pages[0].text.split('\n').slice(0, 8);
    const authorLine = firstPageLines.find((l) => /(?:by|author[s]?:|department|university|institute)/i.test(l));
    if (authorLine) {
      const clean = authorLine.replace(/^(?:by|author[s]?:)\s*/i, '');
      authors = clean.split(/,|and/).map((a) => a.trim()).filter((a) => a.length > 2 && a.length < 40);
    }
  }
  if (authors.length === 0) {
    authors = ['Lead Author et al.'];
  }

  const detectedMeta = extractMetadataFromText(fullTextAccumulator, file.name);
  const fingerprint = generateDocFingerprint(file.name, file.size, pages[0]?.text || '');

  return {
    id: `pdf_${Date.now()}`,
    fingerprint,
    title,
    authors,
    publicationYear: detectedMeta.publicationYear || '2024',
    sourceOrPublisher: publisher,
    journalOrBookTitle: detectedMeta.journalOrBookTitle || 'Research Repository',
    instituteOrOrg: detectedMeta.instituteOrOrg,
    doi: detectedMeta.doi,
    arxivId: detectedMeta.arxivId,
    fileType: 'pdf',
    fileName: file.name,
    fileSize: file.size,
    pages,
    rawArrayBuffer: arrayBuffer.slice(0),
  };
}

/**
 * Parse an EPUB file using JSZip
 */
export async function parseEpubFile(file: File): Promise<ResearchDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate container.xml to find root OPF file
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  let opfPath = 'OEBPS/content.opf';
  if (containerXml) {
    const match = containerXml.match(/full-path="([^"]+)"/);
    if (match) opfPath = match[1];
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfXml = await zip.file(opfPath)?.async('string') || '';

  // Parse metadata
  let title = file.name.replace(/\.[^/.]+$/, '');
  let authors: string[] = [];
  let publisher = 'Book Publisher';
  let year = '2024';

  if (opfXml) {
    const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    if (titleMatch) title = titleMatch[1].trim();

    const creatorMatches = opfXml.matchAll(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/gi);
    for (const m of creatorMatches) {
      if (m[1]) authors.push(m[1].trim());
    }

    const pubMatch = opfXml.match(/<dc:publisher[^>]*>([^<]+)<\/dc:publisher>/i);
    if (pubMatch) publisher = pubMatch[1].trim();

    const dateMatch = opfXml.match(/<dc:date[^>]*>([12][0-9]{3})/i);
    if (dateMatch) year = dateMatch[1].trim();
  }

  if (authors.length === 0) authors = ['Author'];

  // Parse spine & manifest items
  const manifestItems: Record<string, string> = {};
  const manifestMatches = opfXml.matchAll(/<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*media-type="([^"]+)"/gi);
  for (const m of manifestMatches) {
    manifestItems[m[1]] = m[2];
  }

  // Also reverse match if attributes are in different order
  const altMatches = opfXml.matchAll(/<item\s+[^>]*href="([^"]+)"[^>]*id="([^"]+)"/gi);
  for (const m of altMatches) {
    manifestItems[m[2]] = m[1];
  }

  const spineMatches = opfXml.matchAll(/<itemref\s+[^>]*idref="([^"]+)"/gi);
  const spineIds: string[] = [];
  for (const m of spineMatches) {
    spineIds.push(m[1]);
  }

  const pages: DocumentPage[] = [];
  let pageIdx = 1;

  for (const id of spineIds) {
    const href = manifestItems[id];
    if (!href) continue;
    const fullHref = opfDir ? `${opfDir}${href}` : href;
    // Normalize path
    const cleanPath = fullHref.replace(/^\//, '');
    const chapterContent = await zip.file(cleanPath)?.async('string');
    if (!chapterContent) continue;

    // Strip HTML tags for clean text, extract chapter title
    const parser = new DOMParser();
    const doc = parser.parseFromString(chapterContent, 'text/html');

    // Extract heading
    const headingEl = doc.querySelector('h1, h2, h3, title');
    const chapterTitle = headingEl?.textContent?.trim() || `Chapter ${pageIdx}`;

    // Extract body text
    const bodyText = (doc.body.innerText || doc.body.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();

    if (bodyText.length > 50) {
      pages.push({
        pageNumber: pageIdx++,
        chapterTitle,
        text: bodyText,
        htmlContent: doc.body.innerHTML,
      });
    }
  }

  // Fallback if no pages found
  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      chapterTitle: 'Full Text',
      text: 'Could not extract chapters from EPUB container.',
    });
  }

  const fingerprint = generateDocFingerprint(file.name, file.size, pages[0]?.text || '');

  return {
    id: `epub_${Date.now()}`,
    fingerprint,
    title,
    authors,
    publicationYear: year,
    sourceOrPublisher: publisher,
    journalOrBookTitle: title,
    fileType: 'epub',
    fileName: file.name,
    fileSize: file.size,
    pages,
  };
}

/**
 * Parse plain text or Markdown file
 */
export async function parseTextFile(file: File): Promise<ResearchDocument> {
  const content = await file.text();
  const isMarkdown = file.name.endsWith('.md');
  const lines = content.split('\n');

  let title = file.name.replace(/\.[^/.]+$/, '');
  let authors: string[] = ['Author'];
  let year = '2024';
  let journal = '';
  let doi = '';

  // Check YAML frontmatter in Markdown
  if (content.startsWith('---')) {
    const fmEnd = content.indexOf('---', 3);
    if (fmEnd !== -1) {
      const frontmatter = content.slice(3, fmEnd);
      const fmTitle = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/i);
      if (fmTitle) title = fmTitle[1].trim();

      const fmAuthor = frontmatter.match(/author[s]?:\s*["']?([^"'\n]+)["']?/i);
      if (fmAuthor) authors = fmAuthor[1].split(/[,;]/).map((a) => a.trim());

      const fmYear = frontmatter.match(/date|year:\s*["']?([12][0-9]{3})/i);
      if (fmYear) year = fmYear[1];

      const fmDoi = frontmatter.match(/doi:\s*["']?([^"'\n]+)["']?/i);
      if (fmDoi) doi = fmDoi[1].trim();
    }
  }

  // If no title found, check first header
  if (title === file.name.replace(/\.[^/.]+$/, '')) {
    const firstHeader = lines.find((l) => /^#\s+/.test(l));
    if (firstHeader) {
      title = firstHeader.replace(/^#\s+/, '').trim();
    }
  }

  // Chunk content into academic "pages" (~400-500 words or per section)
  const sections = content.split(/\n(?=#+\s+)/);
  const pages: DocumentPage[] = [];

  let pageNum = 1;
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Detect section heading
    const headMatch = trimmed.match(/^#+\s+(.+)$/m);
    const chapterTitle = headMatch ? headMatch[1].trim() : `Section ${pageNum}`;

    // If section is long, chunk it into subpages
    const words = trimmed.split(/\s+/);
    if (words.length > 550) {
      const chunkSize = 450;
      for (let i = 0; i < words.length; i += chunkSize) {
        const subWords = words.slice(i, i + chunkSize);
        pages.push({
          pageNumber: pageNum++,
          chapterTitle: i === 0 ? chapterTitle : `${chapterTitle} (cont.)`,
          text: subWords.join(' '),
        });
      }
    } else {
      pages.push({
        pageNumber: pageNum++,
        chapterTitle,
        text: trimmed,
      });
    }
  }

  if (pages.length === 0) {
    pages.push({ pageNumber: 1, chapterTitle: 'Overview', text: content });
  }

  const detectedMeta = extractMetadataFromText(content, file.name);
  const fingerprint = generateDocFingerprint(file.name, file.size, content);

  return {
    id: `txt_${Date.now()}`,
    fingerprint,
    title,
    authors: authors.length > 0 && authors[0] !== 'Author' ? authors : (detectedMeta.authors || ['Research Author']),
    publicationYear: year || detectedMeta.publicationYear || '2024',
    sourceOrPublisher: journal || detectedMeta.journalOrBookTitle || 'Manuscript / Working Paper',
    journalOrBookTitle: journal || detectedMeta.journalOrBookTitle,
    doi: doi || detectedMeta.doi,
    instituteOrOrg: detectedMeta.instituteOrOrg,
    fileType: isMarkdown ? 'md' : 'txt',
    fileName: file.name,
    fileSize: file.size,
    pages,
  };
}

/**
 * Parse an HTML document / saved web article
 */
export async function parseHtmlFile(file: File): Promise<ResearchDocument> {
  const content = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  // Extract meta tags common in academic articles
  const title = doc.querySelector('meta[name="citation_title"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.title || file.name.replace(/\.[^/.]+$/, '');

  const authorMeta = doc.querySelectorAll('meta[name="citation_author"], meta[name="author"]');
  const authors: string[] = [];
  authorMeta.forEach((el) => {
    const val = el.getAttribute('content');
    if (val) authors.push(val.trim());
  });

  const journal = doc.querySelector('meta[name="citation_journal_title"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="citation_publisher"]')?.getAttribute('content') ||
    'Web Journal & Research Archive';

  const doi = doc.querySelector('meta[name="citation_doi"]')?.getAttribute('content') || '';
  const dateStr = doc.querySelector('meta[name="citation_publication_date"]')?.getAttribute('content') || '';
  const yearMatch = dateStr.match(/[12][0-9]{3}/);
  const year = yearMatch ? yearMatch[0] : '2024';

  // Extract readable sections preserving rich HTML formatting (tables, images, figures, headings)
  const articleEl = doc.querySelector('article, main, .content, #content') || doc.body;
  const headingsAndBlocks = articleEl.querySelectorAll('h1, h2, h3, h4, p, blockquote, table, figure, ul, ol, pre');

  const pages: DocumentPage[] = [];
  let curChapter = 'Introduction';
  let curTextBuffer: string[] = [];
  let curHtmlBuffer: string[] = [];
  let pageNum = 1;

  headingsAndBlocks.forEach((el) => {
    if (/^H[1-3]$/i.test(el.tagName)) {
      if (curTextBuffer.length > 0 || curHtmlBuffer.length > 0) {
        pages.push({
          pageNumber: pageNum++,
          chapterTitle: curChapter,
          text: curTextBuffer.join('\n\n'),
          htmlContent: curHtmlBuffer.join('\n'),
        });
        curTextBuffer = [];
        curHtmlBuffer = [];
      }
      curChapter = el.textContent?.trim() || curChapter;
      curHtmlBuffer.push(el.outerHTML);
    } else {
      const text = el.textContent?.trim();
      if (text && text.length > 5) {
        curTextBuffer.push(text);
      }
      curHtmlBuffer.push(el.outerHTML);
    }
  });

  if (curTextBuffer.length > 0 || curHtmlBuffer.length > 0) {
    pages.push({
      pageNumber: pageNum++,
      chapterTitle: curChapter,
      text: curTextBuffer.join('\n\n'),
      htmlContent: curHtmlBuffer.join('\n'),
    });
  }

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      chapterTitle: 'Body',
      text: doc.body.textContent || 'No readable text content.',
      htmlContent: articleEl.innerHTML || doc.body.innerHTML,
    });
  }

  const fingerprint = generateDocFingerprint(file.name, file.size, pages[0]?.text || '');

  return {
    id: `html_${Date.now()}`,
    fingerprint,
    title,
    authors: authors.length > 0 ? authors : ['Scholar Contributor'],
    publicationYear: year,
    sourceOrPublisher: journal,
    journalOrBookTitle: journal,
    doi: doi || undefined,
    fileType: 'html',
    fileName: file.name,
    fileSize: file.size,
    pages,
  };
}

/**
 * Fetch and parse a web article or page via clean reader proxy
 */
export async function fetchWebArticleByUrl(url: string): Promise<ResearchDocument> {
  const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
  
  const response = await fetch('/api/fetch-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: cleanUrl }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || `Failed to fetch webpage (Status: ${response.status})`);
  }

  return data.document;
}
