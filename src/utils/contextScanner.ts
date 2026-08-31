import { ThirdPartyAttribution } from '../types';

interface ScanResult {
  contextBefore: string;
  contextAfter: string;
  attribution: ThirdPartyAttribution;
  surroundingParagraph: string;
}

/**
 * Common patterns for author citations and attributions in academic texts:
 * 1. "As [Author] ([Year]) argues..."
 * 2. "According to [Author] ([Year], p. [Page])..."
 * 3. "[Quote text]" ([Author], [Year], p. [Page])
 * 4. "— [Author], [Work] ([Year])"
 * 5. "In [Author]'s ([Year]) seminal work..."
 * 6. "quoted in [Author] ([Year])"
 */

const LEAD_IN_PATTERNS = [
  /(?:as\s+(?:noted|argued|pointed\s+out|stated|claimed|observed|written|described)\s+by|according\s+to|in\s+the\s+words\s+of|following)\s+([A-Z][a-zA-Z\s.-]+?)(?:\s*\(([12][0-9]{3}[a-z]?(?:,\s*p\.?\s*\d+)?)\))?[\s,:]*$/i,
  /([A-Z][a-zA-Z\s.-]+?)\s*\(([12][0-9]{3}[a-z]?)\)\s*(?:argues|notes|observes|states|claims|writes|contends|proposes|suggests|famously\s+stated)[\s,:]*$/i,
  /in\s+([A-Z][a-zA-Z\s.-]+?)'s\s*(?:\(([12][0-9]{3})\))?\s*(?:seminal|classic|influential|recent|groundbreaking)?\s*(?:work|paper|book|essay|treatise|study)/i,
];

const TRAILING_PATTERNS = [
  /^[^\w\n]*\((?:see\s+|cf\.\s+|also\s+)?([A-Z][a-zA-Z\s.-]+?),\s*([12][0-9]{3}[a-z]?)(?:,\s*p\.?\s*(\d+(?:-\d+)?))?\)/,
  /^[^\w\n]*\((?:qtd\.\s+in|quoted\s+in|cited\s+in)\s+([A-Z][a-zA-Z\s.-]+?),\s*([12][0-9]{3}[a-z]?)(?:,\s*p\.?\s*(\d+))?\)/i,
  /^[^\w\n]*[—–-]\s*([A-Z][a-zA-Z\s.-]+?)(?:,\s*(?:[“"']?([^"'”\n]+)[”"']?)?)?(?:,\s*\(([12][0-9]{3})\))?/,
  /^[^\w\n]*\[(\d+)\]/, // IEEE reference numbers
];

const QUOTE_DETECTION_PATTERNS = [
  /^["“'«](.*)["”'»]$/s,
  /["“]([^"”]+)["”]/g,
];

/**
 * Scan prior and succeeding text around selected text to extract context,
 * detecting third-party citations and parent attributions.
 */
export function scanSelectionContext(
  fullDocumentText: string,
  selectedText: string,
  selectionOffset?: number
): ScanResult {
  const cleanSelected = selectedText.trim();
  const CONTEXT_RADIUS = 450; // characters before & after

  let startIndex = -1;
  let endIndex = -1;

  if (typeof selectionOffset === 'number' && selectionOffset >= 0) {
    startIndex = selectionOffset;
    endIndex = startIndex + selectedText.length;
  } else {
    startIndex = fullDocumentText.indexOf(cleanSelected);
    if (startIndex !== -1) {
      endIndex = startIndex + cleanSelected.length;
    }
  }

  let contextBefore = '';
  let contextAfter = '';
  let surroundingParagraph = '';

  if (startIndex !== -1) {
    const rawBefore = fullDocumentText.slice(Math.max(0, startIndex - CONTEXT_RADIUS), startIndex);
    const rawAfter = fullDocumentText.slice(endIndex, Math.min(fullDocumentText.length, endIndex + CONTEXT_RADIUS));
    contextBefore = rawBefore;
    contextAfter = rawAfter;

    // Find whole paragraph bounds
    const pStart = fullDocumentText.lastIndexOf('\n\n', startIndex);
    const pEnd = fullDocumentText.indexOf('\n\n', endIndex);
    surroundingParagraph = fullDocumentText.slice(
      pStart === -1 ? Math.max(0, startIndex - 150) : pStart + 2,
      pEnd === -1 ? Math.min(fullDocumentText.length, endIndex + 150) : pEnd
    ).trim();
  }

  // Analyze for third-party quotation and external author
  const attribution: ThirdPartyAttribution = {
    isThirdPartyQuote: false,
  };

  // Check if text is enclosed in quotation marks or has quote signals
  const isEnclosedQuote = /^["“'«](.*)["”'»]$/s.test(cleanSelected);
  const containsQuotes = /["“][^"”]{10,}["”]/.test(cleanSelected);

  // Check LEAD-IN in contextBefore (prior 150 chars)
  const immediateBefore = contextBefore.slice(-180).trim();
  for (const pattern of LEAD_IN_PATTERNS) {
    const match = immediateBefore.match(pattern);
    if (match) {
      attribution.isThirdPartyQuote = true;
      attribution.detectedAuthor = match[1]?.trim();
      if (match[2]) {
        attribution.detectedYear = match[2].split(',')[0].trim();
      }
      attribution.citingPhrase = match[0].trim();
      break;
    }
  }

  // Check TRAILING in contextAfter (first 150 chars)
  const immediateAfter = contextAfter.slice(0, 180).trim();
  if (!attribution.detectedAuthor) {
    for (const pattern of TRAILING_PATTERNS) {
      const match = immediateAfter.match(pattern);
      if (match) {
        attribution.isThirdPartyQuote = true;
        attribution.detectedAuthor = match[1]?.trim();
        if (match[2]) {
          attribution.detectedYear = match[2].trim();
        }
        attribution.citingPhrase = match[0].trim();
        break;
      }
    }
  }

  // If internal text has embedded citation like "(Bacon 1620)" or "(Arendt, 1958)"
  if (!attribution.detectedAuthor) {
    const internalMatch = cleanSelected.match(/\(([A-Z][a-zA-Z\s.-]+?),\s*([12][0-9]{3}[a-z]?)(?:,\s*p\.?\s*\d+)?\)/);
    if (internalMatch) {
      attribution.isThirdPartyQuote = true;
      attribution.detectedAuthor = internalMatch[1].trim();
      attribution.detectedYear = internalMatch[2].trim();
      attribution.citingPhrase = `Cited directly in excerpt: (${internalMatch[1]}, ${internalMatch[2]})`;
    }
  }

  // If text is in quotes and no author found nearby, mark as quote block needing attribution
  if ((isEnclosedQuote || containsQuotes) && !attribution.detectedAuthor) {
    attribution.isThirdPartyQuote = true;
    attribution.citingPhrase = 'Block or embedded quotation detected';
  }

  return {
    contextBefore: contextBefore.trim(),
    contextAfter: contextAfter.trim(),
    attribution,
    surroundingParagraph,
  };
}
