export const FACETS = ['taxa', 'preservation', 'protocols', 'sites', 'states', 'domains'];
export const emptyFilters = () => ({
  q: '',
  repository: '',
  from: '',
  to: '',
  ...Object.fromEntries(FACETS.map((key) => [key, []])),
});
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
export function readFilters(search) {
  const params = new URLSearchParams(search);
  const result = emptyFilters();
  result.q = params.get('q') || '';
  result.repository = ['asu', 'outside'].includes(params.get('repository')) ? params.get('repository') : '';
  ['from', 'to'].forEach((key) => {
    const value = params.get(key);
    result[key] = monthPattern.test(value || '') ? value : '';
  });
  FACETS.forEach((key) => {
    result[key] = [...new Set(params.getAll(key))];
  });
  return result;
}
export function writeFilters(search, filters) {
  const params = new URLSearchParams(search);
  params.delete('sort');
  Object.keys(emptyFilters()).forEach((key) => {
    params.delete(key);
    const value = filters[key];
    if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
    else if (value) params.set(key, value);
  });
  return params.toString();
}
export function matchingSites(item, filters, reference) {
  return item.siteCodes
    .filter((site) => {
      const meta = reference[site.siteCode] || {};
      return (
        (!filters.sites.length || filters.sites.includes(site.siteCode))
        && (!filters.states.length || filters.states.includes(meta.stateCode))
        && (!filters.domains.length || filters.domains.includes(meta.domainCode))
      );
    })
    .map((site) => ({
      ...site,
      availableMonths: site.availableMonths.filter(
        (month) => (!filters.from || month >= filters.from) && (!filters.to || month <= filters.to),
      ),
    }));
}
const PRIORITY_COLLECTION_IDS = new Set([57, 39, 29, 28, 19, 54, 20, 116]);

// Count each distinct term once, using the highest-priority field it matches.
function searchScore(item, terms) {
  const description = item.description || '';
  const samplingIndex = description.search(/\bSampling\b/);
  const fields = [
    { weight: 100, priority: true, values: [item.name, item.sampleTypeName, item.collectionName] },
    { weight: 60, values: [(item.shortDescription ?? cardDescription(description)).split(/\s+/).slice(0, 5).join(' ')] },
    { weight: 30, values: [item.shortDescription ?? cardDescription(description)] },
    { weight: 10, priority: true, values: item.taxa },
    { weight: 10, values: [...item.protocols, ...item.preservation, item.dataProducts] },
    { weight: 1, values: [item.shortDescription != null ? description : (samplingIndex < 0 ? '' : description.slice(samplingIndex))] },
  ].map(({ weight, values, priority = false }) => ({
    weight, priority,
    values: values.map((value) => (value || '').replace(/\s+/g, ' ').toLowerCase()),
  }));
  let priorityMatches = false;
  const relevance = terms.reduce((score, term) => {
    let best = 0;
    for (const { weight, values, priority } of fields) {
      for (const value of values) {
        const tokens = value.match(/[\p{L}\p{N}]+/gu) || [];
        const singular = (word) => word.length > 3 && word.endsWith('s') && !word.endsWith('ss')
          ? word.slice(0, -1) : word;
        const wordIndex = tokens.findIndex((word) => singular(word) === singular(term));
        const wholeWord = !term.includes(' ') && wordIndex >= 0;
        if (!wholeWord && !value.includes(term)) continue;
        if (priority) priorityMatches = true;
        // Keep field priority, but prefer complete title words and early title matches.
        const bonus = weight === 100 && wholeWord ? 20 + 10 / (wordIndex + 1) : 0;
        best = Math.max(best, weight + bonus);
      }
    }
    return score + best;
  }, 0);
  // Boost topical name or taxonomic matches, not incidental description or protocol mentions.
  return priorityMatches && PRIORITY_COLLECTION_IDS.has(Number(item.id))
    ? relevance + (Number(item.id) === 28 ? 2000 : 1000) : relevance;
}
export function filterCatalog(items, filters, reference = {}) {
  if (filters.from && filters.to && filters.from > filters.to) return [];
  const words = filters.q.toLowerCase().match(/"[^"]+"|\S+/g) || [];
  const terms = [...new Set(words.map((term) => term.replaceAll('"', '').replace(/\s+/g, ' ').trim()).filter(Boolean))];
  return items
    .map((item) => ({ item, score: terms.length ? searchScore(item, terms) : 0 }))
    .filter(({ item, score }) => {
      if (terms.length && score === 0) return false;
      if (filters.repository === 'asu' && item.outsideRepository) return false;
      if (filters.repository === 'outside' && !item.outsideRepository) return false;
      if (
        ['taxa', 'preservation', 'protocols'].some(
          (key) => filters[key].length && !filters[key].some((value) => item[key].includes(value)),
        )
      ) return false;
      const dateFilter = filters.from || filters.to;
      const geoFilter = filters.sites.length || filters.states.length || filters.domains.length;
      return (
        !(dateFilter || geoFilter)
        || matchingSites(item, filters, reference).some(
          (site) => !dateFilter || site.availableMonths.length,
        )
      );
    })
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .map(({ item }) => item);
}
export function validateCatalog(data) {
  if (data?.version !== 1 || !Array.isArray(data.items)) {
    throw new Error('Unsupported sample catalog response.');
  }
  const ids = new Set();
  data.items.forEach((item) => {
    if (
      !Number.isInteger(item.id)
      || item.id <= 0
      || ids.has(item.id)
      || typeof item.name !== 'string'
      || !['taxa', 'preservation', 'protocols', 'siteCodes']
        .every((key) => Array.isArray(item[key]))
    ) throw new Error('Invalid sample catalog record.');
    ids.add(item.id);
    if (
      !item.siteCodes.every(
        (site) => typeof site.siteCode === 'string'
          && Array.isArray(site.availableMonths)
          && site.availableMonths.every((month) => monthPattern.test(month)),
      )
    ) throw new Error('Invalid sample availability.');
  });
  return data;
}
export function cardDescription(description = '') {
  return description.split(/\bSampling\b/, 1)[0].replace(/\s+/g, ' ').trim();
}
