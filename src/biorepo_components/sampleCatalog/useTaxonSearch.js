import { useEffect, useMemo, useRef, useState } from 'react';
import { createTaxonSearch, taxonSearchTerms } from './taxonSearch';

const EMPTY_IDS = new Set();
const EMPTY_COVERAGE = {};

export default function useTaxonSearch(root, query, items) {
  const terms = useMemo(() => taxonSearchTerms(query, items), [query, items]);
  const key = JSON.stringify(terms);
  const enabled = key !== '[]';
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: '', root: '', matches: null, error: '', loading: false });
  const search = useRef(null);
  if (!search.current) search.current = createTaxonSearch((...args) => fetch(...args));
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    let disposed = false;
    setResult({ key, root, matches: null, error: '', loading: true });
    // Abort in-flight requests and cancel the debounce on every query change.
    const timer = setTimeout(async () => {
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const matches = await search.current(root, JSON.parse(key), controller.signal);
        if (!controller.signal.aborted) setResult({ key, root, matches, error: '', loading: false });
      } catch {
        if (!disposed) setResult({ key, root, matches: null, error: 'Scientific-name search could not be completed. Showing text matches only.', loading: false });
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
  const ids = useMemo(() => (current && result.matches ? new Set(result.matches.collectionIds) : EMPTY_IDS), [current, result.matches]);
  return {
    ids,
    siteCodesByCollection: current && result.matches ? result.matches.siteCodesByCollection : EMPTY_COVERAGE,
    loading: enabled && (!current || result.loading),
    error: current ? result.error : '',
    retry: () => setAttempt((value) => value + 1),
  };
}
