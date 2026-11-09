import { hasCatalogTextMatch, searchTerms } from './catalog.js';

export function taxonSearchTerms(query, items = null) {
  // Wait for the searchable catalog and optional keywords to finish loading.
  if (!items) return [];
  return searchTerms(query).filter((term) => (
    Array.from(term).length >= 3 && !hasCatalogTextMatch(items, term)
  ));
}

/** Taxon-only matches use specimen coverage; local text matches retain OR semantics. */
export function applyTaxonAvailability(items, query, siteCodesByCollection = {}) {
  const terms = searchTerms(query);
  if (!terms.length) return items;
  return items.map((item) => {
    const siteCodes = siteCodesByCollection[item.id];
    if (!siteCodes || terms.some((term) => hasCatalogTextMatch([item], term))) return item;
    return { ...item, siteCodes };
  });
}

function validMatches(data) {
  if (!Array.isArray(data?.collectionIds)
    || !data.collectionIds.every((id) => Number.isInteger(id) && id > 0)) return false;
  const coverage = data.siteCodesByCollection;
  if (!coverage || typeof coverage !== 'object' || Array.isArray(coverage)) return false;
  return data.collectionIds.every((id) => Array.isArray(coverage[id])
    && coverage[id].every((site) => typeof site?.siteCode === 'string' && site.siteCode.length > 0
      && Array.isArray(site.availableMonths)
      && site.availableMonths.every((month) => typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month))))
    && Object.keys(coverage).every((id) => data.collectionIds.includes(Number(id)));
}

// Cache only small query results, never the taxon list. Evict old entries and
// reject malformed responses rather than treating a failed lookup as no matches.
export function createTaxonSearch(fetcher, now = Date.now) {
  const cache = new Map();
  return async (root, terms, signal) => {
    const key = `${root}:${JSON.stringify(terms)}`;
    const cached = cache.get(key);
    if (cached && cached.expires > now()) return cached.matches;
    // Version the request so browsers cannot reuse results without descendant taxa.
    const params = new URLSearchParams({ v: '3' });
    terms.forEach((term) => params.append('terms[]', term));
    const response = await fetcher(`${root}/collections/misc/rpc/sample-taxon-search.php?${params}`, { signal });
    if (!response.ok) throw new Error('Taxon search is temporarily unavailable.');
    const data = await response.json();
    if (!validMatches(data)) {
      throw new Error('Invalid taxon search response.');
    }
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    cache.delete(key);
    cache.set(key, { matches: data, expires: now() + 300000 });
    if (cache.size > 50) cache.delete(cache.keys().next().value);
    return data;
  };
}
