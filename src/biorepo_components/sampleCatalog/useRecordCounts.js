import { useEffect, useRef, useState } from 'react';

const EMPTY_COUNTS = {};

export function countQueries(cardLinks) {
  return [...cardLinks.values()].filter((links) => links.filtered && links.browse).map((links) => (
    Object.fromEntries(new URLSearchParams(links.browse.slice(links.browse.indexOf('?') + 1)))
  ));
}

export default function useRecordCounts(root, cardLinks, disabled) {
  const key = JSON.stringify(countQueries(cardLinks));
  const enabled = !disabled && key !== '[]';
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: '', root: '', counts: EMPTY_COUNTS, loading: false, error: false });
  const cache = useRef(new Map());
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    let active = true;
    setResult({ key, root, counts: EMPTY_COUNTS, loading: true, error: false });
    const timer = setTimeout(async () => {
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const cacheKey = `${root}:${key}`;
        const cached = cache.current.get(cacheKey);
        let counts;
        if (cached && cached.expires > Date.now()) counts = cached.counts;
        else {
          const queries = JSON.parse(key);
          const response = await fetch(`${root}/collections/misc/rpc/sample-record-counts.php`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queries }), signal: controller.signal,
          });
          if (!response.ok) throw new Error('Unable to count matching records');
          counts = (await response.json()).counts;
          if (!counts || typeof counts !== 'object' || Array.isArray(counts)
            || !queries.every(({ db }) => Number.isSafeInteger(counts[db]) && counts[db] >= 0)) {
            throw new Error('Invalid record counts');
          }
          if (controller.signal.aborted) return;
          cache.current.delete(cacheKey);
          cache.current.set(cacheKey, { counts, expires: Date.now() + 300000 });
          if (cache.current.size > 50) cache.current.delete(cache.current.keys().next().value);
        }
        if (active && !controller.signal.aborted) setResult({ key, root, counts, loading: false, error: false });
      } catch {
        if (active) setResult({ key, root, counts: EMPTY_COUNTS, loading: false, error: true });
      } finally {
        clearTimeout(timeout);
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [root, key, enabled, attempt]);
  const current = enabled && result.key === key && result.root === root;
  return {
    counts: current ? result.counts : EMPTY_COUNTS,
    loading: enabled && (!current || result.loading),
    error: current && result.error,
    retry: () => setAttempt((value) => value + 1),
  };
}
