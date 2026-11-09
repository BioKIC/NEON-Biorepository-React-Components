import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTaxonSearch, taxonSearchTerms } from './taxonSearch.js';
import { emptyFilters, filterCatalog } from './catalog.js';

const item = (id, name) => ({ id, name, taxa: ['Mammals'], protocols: ['MAM'], preservation: ['Frozen'], siteCodes: [] });
test('scientific-name matches combine with text matches and retain facet filters', () => {
  const items = [item(1, 'Frozen tissues'), item(2, 'DNA extracts'), item(3, 'Dry samples')];
  const filters = { ...emptyFilters(), q: 'Peromyscus "DNA extracts"' };
  assert.deepEqual(new Set(filterCatalog(items, filters, {}, new Set([1])).map((value) => value.id)), new Set([1, 2]));
  assert.deepEqual(filterCatalog(items, { ...filters, preservation: ['Dry'] }, {}, new Set([1])), []);
  assert.equal(filterCatalog(items, { ...filters, q: '' }, {}, new Set([1])).length, 3);
});
test('quoted names remain phrases; short terms stay local', () => {
  assert.deepEqual(taxonSearchTerms('"Peromyscus maniculatus" soil SOIL ab'), ['peromyscus maniculatus', 'soil']);
  assert.deepEqual(taxonSearchTerms('a ab ""'), []);
});
test('small result cache expires and respects endpoint root and query', async () => {
  let calls = 0; let clock = 0;
  const search = createTaxonSearch(async (url) => {
    calls += 1;
    assert(url.includes('terms%5B%5D=peromyscus+maniculatus'));
    return { ok: true, json: async () => ({ collectionIds: [19, 118] }) };
  }, () => clock);
  const signal = new AbortController().signal;
  const terms = ['peromyscus maniculatus'];
  assert.deepEqual(await search('/portal', terms, signal), [19, 118]);
  await search('/portal', terms, signal);
  assert.equal(calls, 1);
  clock = 300001;
  await search('/portal', terms, signal);
  await search('/other', terms, signal);
  assert.equal(calls, 3);
});
test('failed, malformed and aborted results are not cached as successful empty matches', async () => {
  const signal = new AbortController().signal;
  for (const response of [{ ok: false }, { ok: true, json: async () => ({ collectionIds: ['19'] }) }]) {
    let calls = 0;
    const search = createTaxonSearch(async () => { calls += 1; return response; });
    await assert.rejects(search('', ['taxon'], signal));
    await assert.rejects(search('', ['taxon'], signal));
    assert.equal(calls, 2);
  }
  const controller = new AbortController();
  const search = createTaxonSearch(async () => {
    controller.abort();
    return { ok: true, json: async () => ({ collectionIds: [19] }) };
  });
  await assert.rejects(search('', ['taxon'], controller.signal), { name: 'AbortError' });
});
