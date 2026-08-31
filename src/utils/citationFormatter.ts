import { CitationEntry, CitationStyle } from '../types';

/**
 * Format author names according to standard academic conventions.
 */
function formatAuthors(authors: string[], style: CitationStyle): string {
  if (!authors || authors.length === 0) return 'Anonymous';

  const cleanAuthors = authors.map((a) => a.trim()).filter(Boolean);
  if (cleanAuthors.length === 0) return 'Anonymous';

  const parseName = (name: string) => {
    // If name already formatted as "Last, First"
    if (name.includes(',')) {
      const [last, ...firsts] = name.split(',').map((s) => s.trim());
      const first = firsts.join(' ');
      const initials = first
        ? first
            .split(/\s+/)
            .map((n) => (n[0] ? `${n[0]}.` : ''))
            .join(' ')
        : '';
      return { last, first, initials };
    }
    // "First Middle Last"
    const parts = name.split(/\s+/);
    if (parts.length === 1) return { last: parts[0], first: '', initials: '' };
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(' ');
    const initials = parts
      .slice(0, -1)
      .map((n) => (n[0] ? `${n[0]}.` : ''))
      .join(' ');
    return { last, first, initials };
  };

  const parsed = cleanAuthors.map(parseName);

  switch (style) {
    case 'apa': {
      // APA 7th: Last, F. M., & Last, F. M. (up to 20 authors)
      if (parsed.length === 1) {
        return `${parsed[0].last}, ${parsed[0].initials || parsed[0].first}`;
      }
      if (parsed.length === 2) {
        return `${parsed[0].last}, ${parsed[0].initials} & ${parsed[1].last}, ${parsed[1].initials}`;
      }
      if (parsed.length <= 20) {
        const leading = parsed
          .slice(0, -1)
          .map((p) => `${p.last}, ${p.initials}`)
          .join(', ');
        return `${leading}, & ${parsed[parsed.length - 1].last}, ${parsed[parsed.length - 1].initials}`;
      }
      const leading = parsed
        .slice(0, 19)
        .map((p) => `${p.last}, ${p.initials}`)
        .join(', ');
      return `${leading}, ... ${parsed[parsed.length - 1].last}, ${parsed[parsed.length - 1].initials}`;
    }

    case 'mla': {
      // MLA 9th: Last, First, and First Last. / Last, First, et al.
      if (parsed.length === 1) {
        return `${parsed[0].last}, ${parsed[0].first || parsed[0].initials}`;
      }
      if (parsed.length === 2) {
        return `${parsed[0].last}, ${parsed[0].first || parsed[0].initials}, and ${parsed[1].first || parsed[1].initials} ${parsed[1].last}`;
      }
      return `${parsed[0].last}, ${parsed[0].first || parsed[0].initials}, et al.`;
    }

    case 'chicago-author-date':
    case 'chicago-notes': {
      // Chicago 17th: Last, First, and First Last. (for 3 or fewer) / Last, First, et al. (for 4+)
      if (parsed.length === 1) {
        return `${parsed[0].last}, ${parsed[0].first || parsed[0].initials}`;
      }
      if (parsed.length === 2) {
        return `${parsed[0].last}, ${parsed[0].first || parsed[0].initials}, and ${parsed[1].first || parsed[1].initials} ${parsed[1].last}`;
      }
      if (parsed.length === 3) {
        return `${parsed[0].last}, ${parsed[0].first}, ${parsed[1].first} ${parsed[1].last}, and ${parsed[2].first} ${parsed[2].last}`;
      }
      return `${parsed[0].last}, ${parsed[0].first || parsed[0].initials}, et al.`;
    }

    case 'harvard': {
      // Harvard: Last, Initials, and Last, Initials
      if (parsed.length === 1) {
        return `${parsed[0].last}, ${parsed[0].initials}`;
      }
      if (parsed.length === 2) {
        return `${parsed[0].last}, ${parsed[0].initials} and ${parsed[1].last}, ${parsed[1].initials}`;
      }
      return `${parsed[0].last}, ${parsed[0].initials} et al.`;
    }

    case 'ieee': {
      // IEEE: F. M. Last, F. M. Last, and F. M. Last
      if (parsed.length <= 3) {
        return parsed
          .map((p) => `${p.initials} ${p.last}`)
          .join(', ')
          .replace(/, ([^,]*)$/, ', and $1');
      }
      return `${parsed[0].initials} ${parsed[0].last} et al.`;
    }

    case 'bibtex': {
      return cleanAuthors.join(' and ');
    }

    default:
      return cleanAuthors.join(', ');
  }
}

/**
 * Format in-text parenthetical citation e.g. (Smith, 2023, p. 45)
 */
export function formatInTextCitation(entry: CitationEntry, style: CitationStyle = 'apa'): string {
  const authors = entry.authors || [];
  const year = entry.publicationYear || 'n.d.';
  const page = entry.pageNumberDisplay || `p. ${entry.pageNumber}`;

  let authorPart = 'Anonymous';
  if (authors.length === 1) {
    const lastName = authors[0].includes(',') ? authors[0].split(',')[0].trim() : authors[0].split(/\s+/).pop() || authors[0];
    authorPart = lastName;
  } else if (authors.length === 2) {
    const last1 = authors[0].includes(',') ? authors[0].split(',')[0].trim() : authors[0].split(/\s+/).pop() || authors[0];
    const last2 = authors[1].includes(',') ? authors[1].split(',')[0].trim() : authors[1].split(/\s+/).pop() || authors[1];
    authorPart = style === 'apa' || style === 'harvard' ? `${last1} & ${last2}` : `${last1} and ${last2}`;
  } else if (authors.length > 2) {
    const last1 = authors[0].includes(',') ? authors[0].split(',')[0].trim() : authors[0].split(/\s+/).pop() || authors[0];
    authorPart = `${last1} et al.`;
  }

  // Handle third-party secondary citations
  if (entry.thirdPartyAttribution?.isThirdPartyQuote && entry.thirdPartyAttribution.detectedAuthor) {
    const thirdAuthor = entry.thirdPartyAttribution.detectedAuthor;
    const thirdYear = entry.thirdPartyAttribution.detectedYear ? `, ${entry.thirdPartyAttribution.detectedYear}` : '';
    if (style === 'apa') {
      return `(${thirdAuthor}${thirdYear}, as cited in ${authorPart}, ${year}, ${page})`;
    }
    if (style === 'mla') {
      return `(qtd. in ${authorPart} ${page.replace(/^p\.\s*/, '')})`;
    }
  }

  switch (style) {
    case 'apa':
    case 'harvard':
    case 'chicago-author-date':
      return `(${authorPart}, ${year}, ${page})`;
    case 'mla':
      return `(${authorPart} ${page.replace(/^p\.\s*/, '')})`;
    case 'ieee':
      return `[${entry.pageNumber || 1}]`;
    case 'chicago-notes':
      return `1. ${authorPart}, ${entry.journalOrBookTitle || entry.docTitle}, ${page}.`;
    case 'bibtex':
      return `\\cite{${generateCiteKey(entry)}}`;
    default:
      return `(${authorPart}, ${year}, ${page})`;
  }
}

/**
 * Generate a standard BibTeX key e.g. smith2023quantum
 */
export function generateCiteKey(entry: CitationEntry): string {
  const firstAuthor = entry.authors?.[0]
    ? (entry.authors[0].includes(',') ? entry.authors[0].split(',')[0] : entry.authors[0].split(/\s+/).pop() || 'author')
    : 'anon';
  const cleanAuthor = firstAuthor.toLowerCase().replace(/[^a-z0-9]/g, '');
  const year = (entry.publicationYear || '2024').replace(/[^0-9]/g, '').slice(0, 4);
  const firstWord = (entry.docTitle || 'document')
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)[0] || 'doc';

  return `${cleanAuthor}${year}${firstWord}`;
}

/**
 * Generate full academic reference citation with comprehensive support for web pages and online sources
 */
export function formatFullCitation(entry: CitationEntry, style: CitationStyle = 'apa'): string {
  const authorStr = formatAuthors(entry.authors, style);
  const title = entry.docTitle || 'Untitled Document';
  const year = entry.publicationYear || 'n.d.';
  const source = entry.journalOrBookTitle || entry.sourceOrPublisher || 'Website';
  const chapter = entry.chapterName ? `"${entry.chapterName}." ` : '';
  const page = entry.pageNumberDisplay || `p. ${entry.pageNumber}`;
  const vol = entry.volume ? `vol. ${entry.volume}` : '';
  const issue = entry.issue ? `no. ${entry.issue}` : '';
  const volIssue = [vol, issue].filter(Boolean).join(', ');
  const doi = entry.doi ? (entry.doi.startsWith('http') ? entry.doi : `https://doi.org/${entry.doi}`) : '';
  const institute = entry.instituteOrOrg ? ` (${entry.instituteOrOrg})` : '';
  const isWebPage = Boolean(entry.url || entry.docFingerprint?.startsWith('web_'));
  const currentFormattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  switch (style) {
    case 'apa': {
      // APA 7: Web page: Author, A. A. (Year, Month Day). Title of page. Site Name. URL
      if (isWebPage && entry.url) {
        const dateStr = entry.publicationDate || year;
        return `${authorStr} (${dateStr}). *${title}*. ${source}. ${entry.url}`;
      }
      // APA 7 Journal/Book
      const volIssueStr = entry.volume ? `${entry.volume}${entry.issue ? `(${entry.issue})` : ''}` : '';
      let res = `${authorStr} (${year}). `;
      if (entry.journalOrBookTitle) {
        res += `${chapter ? chapter : ''}${title}. *${entry.journalOrBookTitle}*`;
        if (volIssueStr) res += `, ${volIssueStr}`;
        if (entry.pageNumber) res += `, ${page}`;
        res += '.';
      } else {
        res += `*${title}*`;
        if (entry.edition) res += ` (${entry.edition} ed.)`;
        res += `. ${source}.`;
      }
      if (institute) res += institute;
      if (doi) res += ` ${doi}`;
      return res;
    }

    case 'mla': {
      // MLA 9: Web page: Author. "Title of Article." Site Name, Day Month Year, URL. Accessed Day Month Year.
      if (isWebPage && entry.url) {
        return `${authorStr}. "${title}." *${source}*, ${entry.publicationDate || year}, ${entry.url}. Accessed ${currentFormattedDate}.`;
      }
      // MLA 9 Journal/Book
      let res = `${authorStr}. `;
      if (entry.chapterName) {
        res += `"${entry.chapterName}." *${title}*, `;
      } else {
        res += `*${title}*. `;
      }
      if (entry.journalOrBookTitle && entry.journalOrBookTitle !== title) {
        res += `*${entry.journalOrBookTitle}*, `;
      }
      if (volIssue) res += `${volIssue}, `;
      res += `${source}, ${year}`;
      if (entry.pageNumber) res += `, ${page.replace('p.', 'pp.')}`;
      res += '.';
      if (doi) res += ` ${doi}`;
      return res;
    }

    case 'chicago-author-date': {
      // Chicago Author-Date: Web page: Author. Year. "Title of Page." Site Name. URL.
      if (isWebPage && entry.url) {
        return `${authorStr}. ${year}. "${title}." ${source}. Accessed ${currentFormattedDate}. ${entry.url}.`;
      }
      // Chicago Author-Date Book/Article
      let res = `${authorStr}. ${year}. `;
      if (entry.chapterName) {
        res += `"${entry.chapterName}." In *${title}*`;
      } else {
        res += `*${title}*`;
      }
      if (entry.journalOrBookTitle && entry.journalOrBookTitle !== title) {
        res += `. *${entry.journalOrBookTitle}*`;
        if (volIssue) res += ` ${volIssue}`;
      }
      res += `. ${source}`;
      if (entry.pageNumber) res += `, ${page}`;
      res += '.';
      if (doi) res += ` ${doi}`;
      return res;
    }

    case 'chicago-notes': {
      // Chicago Notes & Bibliography: Web page: Author, "Title of Page," Site Name, accessed Date, URL.
      if (isWebPage && entry.url) {
        return `${authorStr}, "${title}," ${source}, accessed ${currentFormattedDate}, ${entry.url}.`;
      }
      let res = `${authorStr}, *${title}* (${source}, ${year})`;
      if (entry.pageNumber) res += `, ${entry.pageNumber}`;
      res += '.';
      if (doi) res += ` ${doi}`;
      return res;
    }

    case 'harvard': {
      // Harvard: Web page: Author (Year) 'Title of page', Site Name. Available at: URL (Accessed: Date).
      if (isWebPage && entry.url) {
        return `${authorStr} (${year}) '${title}', *${source}*. Available at: ${entry.url} (Accessed: ${currentFormattedDate}).`;
      }
      let res = `${authorStr}, ${year}. *${title}*. ${source}`;
      if (entry.pageNumber) res += `, ${page}`;
      res += '.';
      if (doi) res += ` Available at: ${doi}`;
      return res;
    }

    case 'ieee': {
      // IEEE: Web page: Author, "Title of page," Site Name, Date. [Online]. Available: URL. [Accessed: Date].
      if (isWebPage && entry.url) {
        return `${authorStr}, "${title}," *${source}*, ${year}. [Online]. Available: ${entry.url}. [Accessed: ${currentFormattedDate}].`;
      }
      let res = `${authorStr}, "${entry.chapterName || title}," *${entry.journalOrBookTitle || source}*`;
      if (volIssue) res += `, ${volIssue}`;
      if (entry.pageNumber) res += `, ${page.replace('p.', 'pp.')}`;
      res += `, ${year}.`;
      if (doi) res += ` doi: ${entry.doi || doi}`;
      return res;
    }

    case 'bibtex': {
      const citeKey = generateCiteKey(entry);
      if (isWebPage && entry.url) {
        const fields: Record<string, string | undefined> = {
          author: formatAuthors(entry.authors, 'bibtex'),
          title: title,
          year: entry.publicationYear || undefined,
          url: entry.url,
          urldate: new Date().toISOString().split('T')[0],
          note: `[Online; accessed ${currentFormattedDate}]`,
        };
        const lines = Object.entries(fields)
          .filter(([_, val]) => Boolean(val))
          .map(([k, val]) => `  ${k} = {${val}}`);
        return `@online{${citeKey},\n${lines.join(',\n')}\n}`;
      }

      const isArticle = Boolean(entry.journalOrBookTitle && entry.journalOrBookTitle !== entry.docTitle);
      const entryType = isArticle ? 'article' : 'book';

      const fields: Record<string, string | undefined> = {
        author: formatAuthors(entry.authors, 'bibtex'),
        title: entry.chapterName ? `${entry.chapterName} (in ${title})` : title,
        year: entry.publicationYear || undefined,
        journal: isArticle ? entry.journalOrBookTitle : undefined,
        publisher: !isArticle ? source : undefined,
        volume: entry.volume || undefined,
        number: entry.issue || undefined,
        pages: entry.pageNumber ? String(entry.pageNumber) : undefined,
        doi: entry.doi || undefined,
        url: entry.url || undefined,
        institution: entry.instituteOrOrg || undefined,
        note: entry.thirdPartyAttribution?.isThirdPartyQuote
          ? `Contains quotation attributed to ${entry.thirdPartyAttribution.detectedAuthor || 'third party'}`
          : undefined,
      };

      const lines = Object.entries(fields)
        .filter(([_, val]) => Boolean(val))
        .map(([k, val]) => `  ${k} = {${val}}`);

      return `@${entryType}{${citeKey},\n${lines.join(',\n')}\n}`;
    }

    default:
      return `${authorStr} (${year}). ${title}. ${source}. ${page}.`;
  }
}
