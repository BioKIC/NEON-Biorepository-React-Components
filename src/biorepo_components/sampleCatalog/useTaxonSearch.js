import { useEffect, useMemo, useRef, useState } from 'react';
import { createTaxonSearch, taxonSearchTerms } from './taxonSearch';

const EMPTY_IDS = new Set();

export default function useTaxonSearch(root, query) {
  const key = JSON.stringify(taxonSearchTerms(query));
  const enabled = key !== '[]';
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: '', root: '', ids: [], error: '', loading: false });
  const search = useRef(null);
  if (!search.current) search.current = createTaxonSearch((...args) => fetch(...args));
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    let disposed = false;
    setResult({ key, root, ids: [], error: '', loading: true });
    // Abort in-flight requests and cancel the debounce on every query change.
    const timer = setTimeout(async () => {
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const ids = await search.current(root, JSON.parse(key), controller.signal);
        if (!controller.signal.aborted) setResult({ key, root, ids, error: '', loading: false });
      } catch {
        if (!disposed) setResult({ key, root, ids: [], error: 'Scientific-name search could not be completed. Showing text matches only.', loading: false });
      } finally {
        clearTimeout(timeout);
      }
    }, 350);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [root, key, enabled, attempt]);
  // Never apply results from an earlier query, even for a single render.
  const current = enabled && result.key === key && result.root === root;
  const ids = useMemo(() => (current ? new Set(result.ids) : EMPTY_IDS), [current, result.ids]);
  return {
    ids,
    loading: enabled && (!current || result.loading),
    error: current ? result.error : '',
    retry: () => setAttempt((value) => value + 1),
  };
}
