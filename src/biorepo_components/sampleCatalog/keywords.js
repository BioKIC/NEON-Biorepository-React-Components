const normalize = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const queryParts = (query) => query.match(/"[^"]+"|\S+/g) || [];
const unquote = (value) => value.replace(/^"|"$/g, '');

export function keywordGroups(items) {
  const unique = new Map();
  items.forEach((item) => {
    if (!Array.isArray(item.keywords)) return;
    item.keywords.forEach((value) => {
      if (typeof value !== 'string' || !value.trim()) return;
      const keyword = value.trim().replace(/\s+/g, ' ');
      if (!unique.has(normalize(keyword))) unique.set(normalize(keyword), keyword);
    });
  });
  const groups = new Map();
  [...unique.values()].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true }))
    .forEach((keyword) => {
      const letter = /^[a-z]/i.test(keyword) ? keyword[0].toUpperCase() : '#';
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter).push(keyword);
    });
  return [...groups].sort(([a], [b]) => a === '#' ? -1 : b === '#' ? 1 : a.localeCompare(b));
}

export function hasKeyword(query, keyword) {
  return queryParts(query).some((part) => normalize(unquote(part)) === normalize(keyword));
}

export function toggleKeyword(query, keyword) {
  if (hasKeyword(query, keyword)) {
    return queryParts(query)
      .filter((part) => normalize(unquote(part)) !== normalize(keyword)).join(' ');
  }
  const value = keyword.trim().replace(/\s+/g, ' ');
  const term = /\s/.test(value) ? `"${value}"` : value;
  return [query.trim(), term].filter(Boolean).join(' ');
}
