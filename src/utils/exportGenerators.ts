import { jsPDF } from 'jspdf';
import { CitationEntry, CitationStyle, ExportFormat, ResearchDocument } from '../types';
import { formatFullCitation, formatInTextCitation, generateCiteKey } from './citationFormatter';

/**
 * Generate BibTeX file content
 */
export function generateBibtexExport(entries: CitationEntry[]): string {
  if (entries.length === 0) return '% No citations recorded yet.\n';

  const header = `% ScholarRead BibTeX Export\n% Generated: ${new Date().toISOString()}\n% Total Entries: ${entries.length}\n\n`;
  const bibs = entries.map((entry) => formatFullCitation(entry, 'bibtex')).join('\n\n');
  return header + bibs;
}

/**
 * Generate Markdown formatted citation export
 */
export function generateMarkdownExport(
  entries: CitationEntry[],
  doc?: ResearchDocument,
  preferredStyle: CitationStyle = 'apa'
): string {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let md = `# Research Notes & Citations\n`;
  if (doc) {
    md += `**Document**: *${doc.title}*\n`;
    md += `**Authors**: ${doc.authors.join(', ')}\n`;
    if (doc.publicationYear) md += `**Year**: ${doc.publicationYear}\n`;
    if (doc.journalOrBookTitle || doc.sourceOrPublisher) {
      md += `**Source**: ${doc.journalOrBookTitle || doc.sourceOrPublisher}\n`;
    }
    if (doc.doi) md += `**DOI**: [${doc.doi}](https://doi.org/${doc.doi})\n`;
  }
  md += `**Export Date**: ${dateStr}\n`;
  md += `**Citation Style**: ${preferredStyle.toUpperCase()}\n\n---\n\n`;

  md += `## Extracted Citations & Quotations (${entries.length})\n\n`;

  entries.forEach((entry, idx) => {
    const inText = formatInTextCitation(entry, preferredStyle);
    const full = formatFullCitation(entry, preferredStyle);

    md += `### ${idx + 1}. Page ${entry.pageNumber}${entry.chapterName ? ` • ${entry.chapterName}` : ''}\n\n`;
    md += `> "${entry.quoteText}"\n\n`;
    md += `- **In-Text Citation**: \`${inText}\`\n`;
    md += `- **Full Reference**: ${full}\n`;

    if (entry.thirdPartyAttribution?.isThirdPartyQuote && entry.thirdPartyAttribution.detectedAuthor) {
      md += `- **Secondary Attribution**: Quoting *${entry.thirdPartyAttribution.detectedAuthor}* (${entry.thirdPartyAttribution.detectedYear || 'n.d.'})\n`;
    }

    if (entry.userNote) {
      md += `- **Researcher Note**: *${entry.userNote}*\n`;
    }

    if (entry.tags && entry.tags.length > 0) {
      md += `- **Tags**: ${entry.tags.map((t) => `\`#${t}\``).join(' ')}\n`;
    }

    md += `\n`;
  });

  md += `---\n\n## Complete Bibliography (${preferredStyle.toUpperCase()})\n\n`;
  const uniqueReferences = Array.from(
    new Set(entries.map((e) => formatFullCitation(e, preferredStyle)))
  );
  uniqueReferences.forEach((ref) => {
    md += `- ${ref}\n`;
  });

  return md;
}

/**
 * Generate Plain Text Export
 */
export function generatePlainTextExport(
  entries: CitationEntry[],
  preferredStyle: CitationStyle = 'apa'
): string {
  let txt = `SCHOLARREAD CITATION DOSSIER\n`;
  txt += `Generated: ${new Date().toLocaleString()}\n`;
  txt += `Format: ${preferredStyle.toUpperCase()}\n`;
  txt += `==========================================================\n\n`;

  entries.forEach((entry, i) => {
    txt += `[${i + 1}] PAGE ${entry.pageNumber}${entry.chapterName ? ` (${entry.chapterName})` : ''}\n`;
    txt += `"${entry.quoteText}"\n\n`;
    txt += `IN-TEXT: ${formatInTextCitation(entry, preferredStyle)}\n`;
    txt += `FULL: ${formatFullCitation(entry, preferredStyle)}\n`;
    if (entry.userNote) txt += `NOTE: ${entry.userNote}\n`;
    txt += `----------------------------------------------------------\n\n`;
  });

  txt += `\nBIBLIOGRAPHY:\n`;
  const uniqueRefs = Array.from(new Set(entries.map((e) => formatFullCitation(e, preferredStyle))));
  uniqueRefs.forEach((ref, idx) => {
    txt += `${idx + 1}. ${ref}\n`;
  });

  return txt;
}

/**
 * Generate CSV Spreadsheet Export
 */
export function generateCsvExport(entries: CitationEntry[]): string {
  const headers = [
    'ID',
    'CiteKey',
    'Page',
    'Chapter',
    'Quotation',
    'InText_APA',
    'Full_APA',
    'Full_MLA',
    'Full_Chicago',
    'Document_Title',
    'Authors',
    'Year',
    'Source_Publisher',
    'DOI',
    'ThirdParty_Attribution',
    'User_Notes',
    'Tags',
    'Created_Date',
  ];

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = entries.map((e) => [
    escapeCsv(e.id),
    escapeCsv(generateCiteKey(e)),
    escapeCsv(e.pageNumber),
    escapeCsv(e.chapterName || ''),
    escapeCsv(e.quoteText),
    escapeCsv(formatInTextCitation(e, 'apa')),
    escapeCsv(formatFullCitation(e, 'apa')),
    escapeCsv(formatFullCitation(e, 'mla')),
    escapeCsv(formatFullCitation(e, 'chicago-author-date')),
    escapeCsv(e.docTitle),
    escapeCsv(e.authors.join('; ')),
    escapeCsv(e.publicationYear),
    escapeCsv(e.journalOrBookTitle || e.sourceOrPublisher),
    escapeCsv(e.doi || ''),
    escapeCsv(e.thirdPartyAttribution?.detectedAuthor ? `${e.thirdPartyAttribution.detectedAuthor} (${e.thirdPartyAttribution.detectedYear || ''})` : ''),
    escapeCsv(e.userNote || ''),
    escapeCsv(e.tags.join(', ')),
    escapeCsv(new Date(e.createdAt).toISOString()),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate JSON Export for library backup
 */
export function generateJsonExport(entries: CitationEntry[], doc?: ResearchDocument): string {
  return JSON.stringify(
    {
      app: 'ScholarRead',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      document: doc
        ? {
            title: doc.title,
            authors: doc.authors,
            year: doc.publicationYear,
            fingerprint: doc.fingerprint,
          }
        : null,
      citationCount: entries.length,
      citations: entries,
    },
    null,
    2
  );
}

/**
 * Generate PDF Reference Dossier using jsPDF
 */
export function generatePdfExport(
  entries: CitationEntry[],
  doc?: ResearchDocument,
  preferredStyle: CitationStyle = 'apa'
): void {
  const docPdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = docPdf.internal.pageSize.getWidth();
  const pageHeight = docPdf.internal.pageSize.getHeight();
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Title
  docPdf.setFont('times', 'bold');
  docPdf.setFontSize(18);
  docPdf.text('ScholarRead • Research Citation Dossier', margin, y);
  y += 24;

  docPdf.setFont('times', 'normal');
  docPdf.setFontSize(10);
  docPdf.setTextColor(100, 100, 100);
  docPdf.text(`Generated: ${new Date().toLocaleDateString()} | Citation Style: ${preferredStyle.toUpperCase()} | Total Citations: ${entries.length}`, margin, y);
  y += 18;

  // Divider
  docPdf.setDrawColor(200, 200, 200);
  docPdf.setLineWidth(0.75);
  docPdf.line(margin, y, pageWidth - margin, y);
  y += 20;

  if (doc) {
    docPdf.setFont('times', 'bold');
    docPdf.setFontSize(12);
    docPdf.setTextColor(30, 30, 30);
    docPdf.text(`Source Document: ${doc.title}`, margin, y);
    y += 16;

    docPdf.setFont('times', 'italic');
    docPdf.setFontSize(10);
    docPdf.setTextColor(70, 70, 70);
    docPdf.text(`Authors: ${doc.authors.join(', ')} (${doc.publicationYear}) • ${doc.journalOrBookTitle || doc.sourceOrPublisher}`, margin, y);
    y += 22;
  }

  // Citations loop
  entries.forEach((entry, idx) => {
    // Check if new page needed
    if (y > pageHeight - 120) {
      docPdf.addPage();
      y = margin;
    }

    docPdf.setFont('times', 'bold');
    docPdf.setFontSize(11);
    docPdf.setTextColor(20, 20, 20);
    docPdf.text(`[${idx + 1}] Page ${entry.pageNumber}${entry.chapterName ? ` — ${entry.chapterName}` : ''}`, margin, y);
    y += 14;

    // Quote box background
    docPdf.setFont('times', 'italic');
    docPdf.setFontSize(10);
    docPdf.setTextColor(40, 40, 40);

    const quoteLines = docPdf.splitTextToSize(`“${entry.quoteText}”`, contentWidth - 16);
    const boxHeight = quoteLines.length * 13 + 10;

    if (y + boxHeight > pageHeight - 60) {
      docPdf.addPage();
      y = margin;
    }

    docPdf.setFillColor(245, 245, 243);
    docPdf.roundedRect(margin, y - 2, contentWidth, boxHeight, 3, 3, 'F');
    docPdf.text(quoteLines, margin + 8, y + 10);
    y += boxHeight + 10;

    // In-Text & Full Reference
    docPdf.setFont('times', 'normal');
    docPdf.setFontSize(9);
    docPdf.setTextColor(80, 80, 80);

    const inText = formatInTextCitation(entry, preferredStyle);
    docPdf.text(`In-Text: ${inText}`, margin, y);
    y += 13;

    const fullRef = formatFullCitation(entry, preferredStyle);
    const fullLines = docPdf.splitTextToSize(`Full Reference: ${fullRef}`, contentWidth);
    docPdf.text(fullLines, margin, y);
    y += fullLines.length * 12 + 16;
  });

  // Save PDF
  const filename = doc
    ? `citations-${doc.title.slice(0, 24).toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`
    : `scholarread-citations-${Date.now()}.pdf`;

  docPdf.save(filename);
}

/**
 * Trigger browser file download
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
