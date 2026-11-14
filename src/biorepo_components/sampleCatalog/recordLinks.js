import { matchingSites } from './catalog.js';
import { taxonSearchTerms } from './taxonSearch.js';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
function monthEnd(month) {
  const [year, number] = month.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return `${month}-${days[number - 1]}`;
}

/** Both actions share the same criteria; only the destination differs. */
export function recordLinks({ root, items, results, filters, sites, datasets, allCollections = false }) {
  const taxa = taxonSearchTerms(filters.q, items);
  const geographyFiltered = filters.sites.length || filters.states.length || filters.domains.length;
  // Collection-level facets choose sample types; these criteria narrow records
  // within each sample type and determine whether its actions say "filtered".
  const filtered = Boolean(geographyFiltered || filters.from || filters.to || taxa.length);
  const unavailable = { browse: '', search: '', error: '', filtered };
  if (!results.length) return unavailable;
  if ((filters.from && !monthPattern.test(filters.from))
    || (filters.to && !monthPattern.test(filters.to))
    || (filters.from && filters.to && filters.from > filters.to)) return unavailable;
  const ids = [...new Set(results.map((item) => item.id))].filter((id) => Number.isInteger(id) && id > 0).sort((a, b) => a - b);
  if (!ids.length) return unavailable;
  const params = new URLSearchParams({ db: allCollections ? 'all,all-others' : ids.join(',') });
  const coverage = results.flatMap((item) => matchingSites(item, filters, sites));
  if (geographyFiltered) {
    const codes = [...new Set(coverage
      .filter((site) => !(filters.from || filters.to) || site.availableMonths.length)
      .map((site) => site.siteCode))];
    const lookup = new Map(datasets.map((dataset) => [dataset.name, Number(dataset.datasetID)]));
    // Never silently drop a site and broaden or partially apply a record search.
    if (!codes.length || codes.some((code) => !Number.isInteger(lookup.get(code)) || lookup.get(code) <= 0)) {
      return { ...unavailable, error: 'Record links are unavailable for this site selection.' };
    }
    params.set('datasetid', [...new Set(codes.map((code) => lookup.get(code)))].sort((a, b) => a - b).join(','));
  }
  if (filters.from || filters.to) {
    const months = [...new Set(coverage.flatMap((site) => site.availableMonths))].sort();
    // The existing search treats a lone eventdate1 as an exact date and ignores
    // a lone eventdate2. Fill an open end with the matching catalog's coverage.
    const from = filters.from || months[0];
    const to = filters.to || months[months.length - 1];
    if (!from || !to) return unavailable;
    params.set('eventdate1', `${from}-01`);
    params.set('eventdate2', monthEnd(to));
  }
  // Catalog words narrow the selected collections. Only scientific-name fallback
  // terms become specimen-level taxonomy filters; do not send "soil" as a taxon.
  if (taxa.length) {
    params.set('taxa', taxa.join(','));
    params.set('usethes', '1');
  }
  const base = root.replace(/\/$/, '');
  return {
    browse: `${base}/collections/list.php?${params}`,
    search: `${base}/neon/search/index.php?${params}`,
    error: '',
    filtered,
  };
}

/** Restore site checkboxes when following a search link from the explorer. */
export function sitesFromRecordQuery(search, datasets) {
  const ids = new Set((new URLSearchParams(search).get('datasetid') || '').split(','));
  return new Set(datasets.filter((dataset) => ids.has(String(dataset.datasetID))
    && /^[A-Z]{4}$/.test(dataset.name)).map((dataset) => dataset.name));
}
