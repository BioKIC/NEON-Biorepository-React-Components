import { searchTerms } from './catalog.js';

export function taxonSearchTerms(query) {
  return searchTerms(query).filter((term) => Array.from(term).length >= 3);
}

// Cache only small query results, never the taxon list. Evict old entries and
// reject malformed responses rather than treating a failed lookup as no matches.
export function createTaxonSearch(fetcher, now = Date.now) {
  const cache = new Map();
  return async (root, terms, signal) => {
    const key = `${root}:${JSON.stringify(terms)}`;
    const cached = cache.get(key);
    if (cached && cached.expires > now()) return cached.ids;
    const params = new URLSearchParams();
    terms.forEach((term) => params.append('terms[]', term));
    const response = await fetcher(`${root}/neon-react/biorepo_lib/sample-taxon-search.php?${params}`, { signal });
    if (!response.ok) throw new Error('Taxon search is temporarily unavailable.');
    const data = await response.json();
    if (!Array.isArray(data.collectionIds)
      || !data.collectionIds.every((id) => Number.isInteger(id) && id > 0)) {
      throw new Error('Invalid taxon search response.');
    }
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    cache.delete(key);
    cache.set(key, { ids: data.collectionIds, expires: now() + 300000 });
    if (cache.size > 50) cache.delete(cache.keys().next().value);
    return data.collectionIds;
  };
}
