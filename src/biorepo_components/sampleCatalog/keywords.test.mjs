import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionKeywords, hasKeyword, keywordGroups, toggleKeyword } from './keywords.js';

test('collection labels are metadata while keywords support named entries and legacy arrays', () => {
  const values = [' soil ', 'microbial ecology', 'soil', '', null, 123];
  const expected = ['soil', 'microbial ecology'];
  assert.deepEqual(collectionKeywords({ name: 'Air-Dried Soil', keywords: values }), expected);
  assert.deepEqual(collectionKeywords(values), expected);
  for (const entry of [undefined, null, {}, { name: 'Air-Dried Soil' }, { keywords: 'soil' }]) {
    assert.deepEqual(collectionKeywords(entry), []);
  }
});

test('keyword browsing groups only valid catalog terms alphabetically, without case duplicates', () => {
  assert.deepEqual(keywordGroups([
    { keywords: ['rRNA', 'Bacteria', 'carbon cycle', '16S', ' bacteria ', 'Archaea', null, '', 4] },
    { keywords: ['CARBON CYCLE', 'soil'] }, {}, { keywords: 'not an array' },
  ]), [['#', ['16S']], ['A', ['Archaea']], ['B', ['Bacteria']], ['C', ['carbon cycle']], ['R', ['rRNA']], ['S', ['soil']]]);
  assert.deepEqual(keywordGroups([]), []);
});

test('adding keywords preserves the search and quotes multiword phrases', () => {
  assert.equal(toggleKeyword('soil', 'carbon cycle'), 'soil "carbon cycle"');
  assert.equal(toggleKeyword('"carbon cycle"', 'bacteria'), '"carbon cycle" bacteria');
  assert.equal(toggleKeyword('', 'cytochrome oxidase I (COI)'), '"cytochrome oxidase I (COI)"');
});

test('removing a selected keyword is case-insensitive and leaves other terms and phrases intact', () => {
  assert.equal(hasKeyword('SOIL "Carbon Cycle"', 'carbon cycle'), true);
  assert.equal(toggleKeyword('soil "Carbon Cycle" "nitrogen cycle"', 'carbon cycle'), 'soil "nitrogen cycle"');
  assert.equal(toggleKeyword('soil SOIL "soil carbon"', 'soil'), '"soil carbon"');
  assert.equal(hasKeyword('"soil carbon"', 'soil'), false);
  assert.equal(hasKeyword('carbon cycle', 'carbon cycle'), false);
  assert.equal(toggleKeyword('"carbon cycle"', 'carbon cycle'), '');
});
