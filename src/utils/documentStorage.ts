import { ResearchDocument } from '../types';

const DB_NAME = 'ScholarReadDocumentDB';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';
const STORE_STATE = 'state';

const ACTIVE_DOC_KEY = 'active_document';
const ACTIVE_PAGE_KEY = 'scholarread_last_active_page';

/**
 * Open or upgrade IndexedDB database instance
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'fingerprint' });
      }
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save the active document and current reading page to IndexedDB and localStorage
 */
export async function saveActiveDocumentSession(
  doc: ResearchDocument,
  pageNumber: number
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_DOCUMENTS, STORE_STATE], 'readwrite');

    const docStore = tx.objectStore(STORE_DOCUMENTS);
    const stateStore = tx.objectStore(STORE_STATE);

    // Save document to library store by fingerprint
    docStore.put(doc);

    // Save current active state
    stateStore.put(doc, ACTIVE_DOC_KEY);
    stateStore.put(pageNumber, 'active_page');

    // Also persist page number in localStorage for instant sync
    localStorage.setItem(ACTIVE_PAGE_KEY, String(pageNumber));
    localStorage.setItem('scholarread_last_active_fingerprint', doc.fingerprint);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to persist active document to IndexedDB:', err);
    // Fallback lightweight metadata save to localStorage
    try {
      localStorage.setItem(ACTIVE_PAGE_KEY, String(pageNumber));
      localStorage.setItem('scholarread_last_active_fingerprint', doc.fingerprint);
    } catch {
      // ignore
    }
  }
}

/**
 * Update only the active reading page position
 */
export async function saveActivePagePosition(pageNumber: number): Promise<void> {
  try {
    localStorage.setItem(ACTIVE_PAGE_KEY, String(pageNumber));
    const db = await openDB();
    const tx = db.transaction(STORE_STATE, 'readwrite');
    const store = tx.objectStore(STORE_STATE);
    store.put(pageNumber, 'active_page');
  } catch {
    // ignore
  }
}

/**
 * Load the last active document and page on app startup
 */
export async function loadActiveDocumentSession(): Promise<{
  document: ResearchDocument;
  pageNumber: number;
} | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_STATE, 'readonly');
    const stateStore = tx.objectStore(STORE_STATE);

    const docRequest = stateStore.get(ACTIVE_DOC_KEY);
    const pageRequest = stateStore.get('active_page');

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        const doc: ResearchDocument | undefined = docRequest.result;
        let pageNum = typeof pageRequest.result === 'number' ? pageRequest.result : 1;

        const storedPageStr = localStorage.getItem(ACTIVE_PAGE_KEY);
        if (storedPageStr) {
          const parsed = parseInt(storedPageStr, 10);
          if (!isNaN(parsed) && parsed > 0) {
            pageNum = parsed;
          }
        }

        if (doc && doc.title) {
          resolve({ document: doc, pageNumber: pageNum });
        } else {
          resolve(null);
        }
      };

      tx.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Could not load session from IndexedDB:', err);
    return null;
  }
}

/**
 * Retrieve a specific document by fingerprint from IndexedDB
 */
export async function getDocumentFromDB(
  fingerprint: string
): Promise<ResearchDocument | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.get(fingerprint);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(req.result || null);
      tx.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
