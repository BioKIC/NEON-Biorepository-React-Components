export const FACETS = ['taxa', 'preservation', 'protocols', 'sites', 'states', 'domains'];
export const emptyFilters = () => ({
  q: '',
  from: '',
  to: '',
  sort: 'name',
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
  result.sort = ['name', 'name-desc', 'count'].includes(params.get('sort'))
    ? params.get('sort')
    : 'name';
  FACETS.forEach((key) => {
    result[key] = [...new Set(params.getAll(key))];
  });
  return result;
}
export function writeFilters(search, filters) {
  const params = new URLSearchParams(search);
  Object.keys(emptyFilters()).forEach((key) => {
    params.delete(key);
    const value = filters[key];
    if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
    else if (value && !(key === 'sort' && value === 'name')) params.set(key, value);
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
      if (!terms.every((term) => text.includes(term))) return false;
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
    .sort(
      (a, b) => (filters.sort === 'count' ? b.totalSamples - a.totalSamples : 0)
        || a.name.localeCompare(b.name) * (filters.sort === 'name-desc' ? -1 : 1),
    );
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
export function exportRows(items, root) {
  return items.map((item) => ({
    sample_type: item.name,
    collection_id: item.id,
    description: item.description,
    taxonomic_groups: item.taxa.join('; '),
    protocols: item.protocols.join('; '),
    preservation: item.preservation.join('; '),
    storage_conditions: item.storageConditions,
    storage_container: item.storageContainer,
    data_product_ids: item.dataProducts,
    sites: item.siteCodes.map((site) => site.siteCode).join('; '),
    collection_months: [...new Set(item.siteCodes.flatMap((site) => site.availableMonths))]
      .sort()
      .join('; '),
    total_public_records: item.totalSamples,
    description_url: `${root}/collections/misc/neoncollprofiles.php?collid=${item.id}`,
  }));
}
export function toCsv(rows) {
  if (!rows.length) return '';
  const escape = (value) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const keys = Object.keys(rows[0]);
  return [keys, ...rows.map((row) => keys.map((key) => row[key]))]
    .map((row) => row.map(escape).join(','))
    .join('\r\n');
}
