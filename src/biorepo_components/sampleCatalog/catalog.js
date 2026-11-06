export const FACETS = ['taxa', 'preservation', 'protocols', 'sites', 'states', 'domains'];
export const emptyFilters = () => ({
  q: '',
  from: '',
  to: '',
  ...Object.fromEntries(FACETS.map((key) => [key, []])),
});
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
export function readFilters(search) {
  const params = new URLSearchParams(search);
  const result = emptyFilters();
  result.q = params.get('q') || '';
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
export function filterCatalog(items, filters, reference = {}) {
  if (filters.from && filters.to && filters.from > filters.to) return [];
  const words = filters.q.toLowerCase().match(/"[^"]+"|\S+/g) || [];
  const terms = words.map((term) => term.replaceAll('"', ''));
  return items
    .filter((item) => {
      const text = [
        item.name,
        item.description,
        ...item.taxa,
        ...item.protocols,
        ...item.preservation,
        item.dataProducts,
      ]
        .join(' ')
        .toLowerCase();
      if (terms.length && !terms.some((term) => text.includes(term))) return false;
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
    .sort((a, b) => a.name.localeCompare(b.name));
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
