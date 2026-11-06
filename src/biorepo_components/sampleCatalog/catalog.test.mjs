import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardDescription, emptyFilters, filterCatalog, readFilters, writeFilters, toCsv, validateCatalog } from './catalog.js';
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
test('CSV quotes text and neutralizes spreadsheet formulas', () => {
  assert.equal(toCsv([{ name: '=CMD()', description: 'a,"b"\nc' }]), '"name","description"\r\n"\'=CMD()","a,""b""\nc"');
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
