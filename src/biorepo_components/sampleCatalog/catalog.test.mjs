import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardDescription, emptyFilters, filterCatalog, readFilters, writeFilters, validateCatalog } from './catalog.js';
const item = { id: 1, name: 'Small Mammal Tissues', description: 'Frozen liver', taxa: ['Small Mammals'], preservation: ['Frozen'], protocols: ['MAM'], totalSamples: 12,
  siteCodes: [{ siteCode: 'ABBY', availableMonths: ['2020-01'] }, { siteCode: 'BART', availableMonths: ['2023-01'] }] };
const reference = { ABBY: { stateCode: 'WA', domainCode: 'D16' }, BART: { stateCode: 'NH', domainCode: 'D01' } };
test('geographic and date conditions must match the same site', () => {
  assert.equal(filterCatalog([item], { ...emptyFilters(), sites: ['ABBY'], from: '2023-01' }, reference).length, 0);
  assert.equal(filterCatalog([item], { ...emptyFilters(), states: ['NH'], domains: ['D16'] }, reference).length, 0);
  assert.equal(filterCatalog([item], { ...emptyFilters(), states: ['NH'], from: '2023-01', to: '2023-01' }, reference).length, 1);
});
test('facets are AND between groups, OR within groups; quoted search and dates are inclusive', () => {
  assert.equal(filterCatalog([item], { ...emptyFilters(), taxa: ['Plants', 'Small Mammals'], preservation: ['Frozen'], q: '"small mammal" liver' }, reference).length, 1);
  assert.equal(filterCatalog([item], { ...emptyFilters(), preservation: ['Dry'] }, reference).length, 0);
  assert.equal(filterCatalog([item], { ...emptyFilters(), from: '2024-01', to: '2020-01' }, reference).length, 0);
});
test('unknown and undated sites remain browsable but cannot match date filters', () => {
  const unknown = { ...item, siteCodes: [{ siteCode: 'UNKNOWN', availableMonths: [] }] };
  assert.equal(filterCatalog([unknown], emptyFilters(), reference).length, 1);
  assert.equal(filterCatalog([unknown], { ...emptyFilters(), from: '2020-01' }, reference).length, 0);
});
test('URL round trip retains unrelated parameters and multiple selections', () => {
  const filters = { ...emptyFilters(), q: 'frozen & tissue', sites: ['ABBY', 'BART'] };
  const search = writeFilters('?keep=1', filters);
  assert.deepEqual(readFilters(search), filters);
  assert.equal(new URLSearchParams(search).get('keep'), '1');
  assert.equal(readFilters('?from=bad&sort=bad').from, '');
});
test('rejects duplicate collection identities and invalid months', () => {
  assert.throws(() => validateCatalog({ version: 1, items: [item, item] }));
  assert.throws(() => validateCatalog({ version: 1, items: [{ ...item, siteCodes: [{ siteCode: 'ABBY', availableMonths: ['2020-13'] }] }] }));
});

test('card descriptions stop before Sampling and keep the full introduction', () => {
  const intro = 'A long introduction. '.repeat(40).trim();
  assert.equal(cardDescription(`${intro}\n\nSampling\nThree visits per year`), intro);
  assert.equal(cardDescription('Intro text without a section.'), 'Intro text without a section.');
  assert.equal(cardDescription('Routine sampling produces tissue.\nSampling: Details'), 'Routine sampling produces tissue.');
  assert.equal(cardDescription('Sampling details'), '');
  assert.equal(cardDescription(), '');
});

test('text search matches any term, preserves quoted phrases, and allows empty queries', () => {
  const plants = { ...item, id: 2, name: 'Plant Leaves', description: 'Dried foliage', taxa: ['Plants'], preservation: ['Dry'], protocols: ['PLANT'] };
  const items = [item, plants];
  const search = (q, extra = {}) => filterCatalog(items, { ...emptyFilters(), q, ...extra }, reference).map((entry) => entry.id).sort();
  assert.deepEqual(search('liver leaves'), [1, 2]);
  assert.deepEqual(search('LIVER nonexistent'), [1]);
  assert.deepEqual(search('"small mammal" leaves'), [1, 2]);
  assert.deepEqual(search('"small liver"'), []);
  assert.deepEqual(search('nonexistent'), []);
  assert.deepEqual(search('   '), [1, 2]);
  assert.deepEqual(search('liver leaves', { preservation: ['Dry'] }), [2]);
});

test('search ranks names, card descriptions, other fields, then the rest of the description', () => {
  const base = { ...item, taxa: [], protocols: [], preservation: [], description: '', dataProducts: '' };
  const records = [
    { ...base, id: 1, name: 'A remainder match', description: 'Introduction. Sampling frozen material.' },
    { ...base, id: 2, name: 'B metadata match', preservation: ['Frozen'] },
    { ...base, id: 3, name: 'C introduction match', description: 'Frozen material. Sampling details.' },
    { ...base, id: 4, name: 'Z frozen samples' },
  ];
  const ranked = filterCatalog(records, { ...emptyFilters(), q: 'frozen' }, reference);
  assert.deepEqual(ranked.map(({ id }) => id), [4, 3, 2, 1]);
  assert.equal(ranked[0], records[3]);
  assert.deepEqual(filterCatalog(records, emptyFilters(), reference).map(({ id }) => id), [1, 2, 3, 4]);
});

test('ranking rewards additional distinct terms without inflating repeated terms or occurrences', () => {
  const records = [
    { ...item, id: 1, name: 'Alpha liver', description: 'liver '.repeat(100), taxa: [], protocols: [], preservation: [] },
    { ...item, id: 2, name: 'Zeta liver tissue', description: '', taxa: [], protocols: [], preservation: [] },
    { ...item, id: 3, name: 'Beta liver', description: '', taxa: [], protocols: [], preservation: [] },
  ];
  const rank = (q) => filterCatalog(records, { ...emptyFilters(), q }, reference).map(({ id }) => id);
  assert.deepEqual(rank('liver tissue'), [2, 1, 3]);
  assert.deepEqual(rank('LIVER liver tissue tissue'), [2, 1, 3]);
  assert.deepEqual(rank('liver'), [1, 3, 2]);
  assert.deepEqual(rank('"liver tissue"'), [2]);
});

test('sample type and collection names outrank the first five description words', () => {
  const base = { ...item, taxa: [], protocols: [], preservation: [], description: '' };
  const records = [
    { ...base, id: 1, name: 'A later introduction', description: 'One two three four five frozen tissue.' },
    { ...base, id: 2, name: 'B opening description', description: 'One two three four frozen tissue.' },
    { ...base, id: 3, name: 'C collection match', collectionName: 'Frozen collection' },
    { ...base, id: 4, name: 'D sample type match', sampleTypeName: 'Frozen samples' },
    { ...base, id: 5, name: 'Frozen public name' },
  ];
  const rank = (q) => filterCatalog(records, { ...emptyFilters(), q }, reference).map(({ id }) => id);
  assert.deepEqual(rank('frozen'), [3, 4, 5, 2, 1]);
  assert.deepEqual(rank('"frozen tissue"'), [1, 2]);
});


test('mammal titles precede bycatch and live does not rank livers first', () => {
  const base = { ...item, taxa: [], protocols: [], preservation: [], description: '' };
  const records = [
    { ...base, id: 70, name: 'Reptile and Amphibian Bycatch - Fish and Mammal Sampling' },
    { ...base, id: 28, name: 'Small Mammals - Live Trapping' },
    { ...base, id: 123, name: 'Small Mammal Livers' },
  ];
  const rank = (q) => filterCatalog(records, { ...emptyFilters(), q }, reference).map(({ id }) => id);
  assert.deepEqual(rank('mammal'), [28, 123, 70]);
  assert.deepEqual(rank('mammals'), [28, 123, 70]);
  assert.deepEqual(rank('mammal livers'), [28, 123, 70]);
  assert.deepEqual(rank('mammal live'), [28, 123, 70]);
  assert.deepEqual(rank('mammals live'), [28, 123, 70]);
});


test('preferred collections are boosted only for matching searches, with live trapping first', () => {
  const base = { ...item, name: 'Matching samples', description: '', taxa: [], protocols: [], preservation: [] };
  const ids = [57, 39, 29, 28, 19, 54, 20, 116];
  const records = [
    { ...base, id: 999 },
    ...ids.map((id) => ({ ...base, id })),
    { ...base, id: '57', name: 'Unrelated collection' },
  ];
  const rank = (q) => filterCatalog(records, { ...emptyFilters(), q }, reference).map(({ id }) => id);
  assert.deepEqual(rank('matching'), [28, ...ids.filter((id) => id !== 28), 999]);
  assert.deepEqual(rank('nonexistent'), []);
  assert.deepEqual(rank(''), [999, ...ids, '57']);
  assert.deepEqual(rank('unrelated'), ['57']);
});


test('live trapping ranks above incidental mammals when both match', () => {
  const base = { ...item, description: '', taxa: [], protocols: [], preservation: [] };
  const records = [
    { ...base, id: 19, name: 'Small Mammals - Incidental' },
    { ...base, id: 28, name: 'Small Mammals - Live Trapping' },
  ];
  for (const q of ['mammal', 'mammals', 'small mammals', 'mammal live']) {
    assert.deepEqual(filterCatalog(records, { ...emptyFilters(), q }, reference).map(({ id }) => id), [28, 19]);
  }
  assert.deepEqual(filterCatalog(records, { ...emptyFilters(), q: 'incidental' }, reference).map(({ id }) => id), [19]);
});


test('preferred carabids are not boosted for incidental mammal mentions', () => {
  const base = { ...item, description: '', taxa: [], protocols: [], preservation: [] };
  const records = [
    { ...base, id: 39, name: 'Pinned Carabids', taxa: ['Invertebrates', 'Beetles (Carabids)'], description: 'Collected during mammal sampling.' },
    { ...base, id: 123, name: 'Small Mammal Livers' },
    { ...base, id: 28, name: 'Small Mammals - Live Trapping' },
  ];
  assert.deepEqual(filterCatalog(records, { ...emptyFilters(), q: 'mammal' }, reference).map(({ id }) => id), [28, 123, 39]);
});


test('taxonomic groups boost pinned carabids for beetle searches without aliases', () => {
  const base = { ...item, description: '', taxa: ['Invertebrates', 'Beetles (Carabids)'], protocols: [], preservation: [] };
  const records = [
    { ...base, id: 63, name: 'Carabid DNA Extracts' },
    { ...base, id: 39, name: 'Pinned Carabids' },
  ];
  for (const q of ['carabid', 'carabids', 'beetle', 'beetles']) {
    assert.deepEqual(filterCatalog(records, { ...emptyFilters(), q }, reference).map(({ id }) => id), [39, 63]);
  }
});

test('individual repositories support combined selections and shared domain-office collections', () => {
  const records = [item, ...[44, 74, 95, 115, 97].map((id) => ({ ...item, id, outsideRepository: true }))];
  const selected = (repository) => filterCatalog(records, { ...emptyFilters(), repository }).map(({ id }) => id).sort((a, b) => a - b);
  assert.deepEqual(selected(['emec']), [44]);
  assert.deepEqual(selected(['neon-domains']), [95, 115]);
  assert.deepEqual(selected(['asu', 'bpbm']), [1, 97]);
  assert.deepEqual(selected(['outside', 'emec']), [44, 74, 95, 97, 115]);
  assert.deepEqual(readFilters(writeFilters('', { ...emptyFilters(), repository: ['msb', 'neon-domains'] })).repository, ['msb', 'neon-domains']);
});

test('additional keywords find and rank samples without repeating title or description text', () => {
  const base = { ...item, taxa: [], protocols: [], preservation: [], description: '', dataProducts: '' };
  const records = [
    { ...base, id: 1, name: 'A incidental match', description: 'Overview. Sampling involves cardiac material.' },
    { ...base, id: 2, name: 'B hearts', keywords: ['cardiac', 'cardiovascular'] },
    { ...base, id: 3, name: 'C cardiac material' },
    { ...base, id: 4, name: 'D other samples' },
  ];
  const rank = (q) => filterCatalog(records, { ...emptyFilters(), q }, reference).map(({ id }) => id);
  assert.deepEqual(rank('cardiac'), [3, 2, 1]);
  assert.deepEqual(rank('CARDIOVASCULAR'), [2]);
  assert.deepEqual(rank('cardiac cardiac'), [3, 2, 1]);
  assert.deepEqual(rank(''), [1, 2, 3, 4]);
});

test('keyword phrases respect existing quoted search and facet filters', () => {
  const records = [
    { ...item, id: 1, name: 'Hearts', keywords: ['circulatory system'], preservation: ['Frozen'] },
    { ...item, id: 2, name: 'Blood', keywords: ['circulatory system'], preservation: ['Dry'] },
  ];
  const filters = { ...emptyFilters(), q: '"circulatory system"', preservation: ['Frozen'] };
  assert.deepEqual(filterCatalog(records, filters, reference).map(({ id }) => id), [1]);
  assert.deepEqual(filterCatalog(records, { ...filters, q: '"system circulatory"' }, reference), []);
});
