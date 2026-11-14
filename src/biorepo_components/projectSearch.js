const FILTER_KEYS = ['db', 'collid', 'datasetid', 'site', 'sitename', 'q', 'search', 'page', 'pagesize'];

export const emptyProjectFilters = () => ({
  db: [], datasetid: [], site: [], q: '', page: 1, pageSize: 25,
});

export function readProjectFilters(search) {
  const params = new Map();
  new URLSearchParams(search).forEach((value, name) => {
    const key = name.toLowerCase().replace(/\[\]$/, '');
    params.set(key, [...(params.get(key) || []), value]);
  });
  const values = (...names) => names.map(name => params.get(name)).find(Boolean) || [];
  const tokens = (...names) => [...new Set(values(...names).flatMap(value => value.split(',')).map(value => value.trim()).filter(Boolean))];
  const pageSize = Number(values('pagesize')[0]);
  return {
    db: tokens('db', 'collid'), datasetid: tokens('datasetid'), site: tokens('site', 'sitename'),
    q: values('q', 'search')[0] || '',
    page: Math.max(1, Math.min(1000000, Number.parseInt(values('page')[0], 10) || 1)),
    pageSize: [10, 25, 50, 100].includes(pageSize) ? pageSize : 25,
  };
}

export function projectSearchUrl(url, filters) {
  const next = new URL(url);
  [...next.searchParams.keys()].forEach(key => {
    if (FILTER_KEYS.includes(key.toLowerCase().replace(/\[\]$/, ''))) next.searchParams.delete(key);
  });
  ['db', 'datasetid', 'site'].forEach(key => {
    if (filters[key].length) next.searchParams.set(key, filters[key].join(','));
  });
  if (filters.q.trim()) next.searchParams.set('q', filters.q.trim());
  if (filters.page > 1) next.searchParams.set('page', String(filters.page));
  if (filters.pageSize !== 25) next.searchParams.set('pageSize', String(filters.pageSize));
  return next;
}

export function writeProjectHistory(filters, replace = false) {
  const url = projectSearchUrl(window.location.href, filters);
  if (url.href !== window.location.href) {
    window.history[replace ? 'replaceState' : 'pushState'](window.history.state, '', url);
  }
}
