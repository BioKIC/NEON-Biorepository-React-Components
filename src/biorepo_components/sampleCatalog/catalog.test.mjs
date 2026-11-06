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
