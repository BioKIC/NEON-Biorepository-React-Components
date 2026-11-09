import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { emptyFilters } from './catalog.js';
import { recordLinks, sitesFromRecordQuery } from './recordLinks.js';

const datasets = JSON.parse(fs.readFileSync(new URL('../../lib_components/staticJSON/biorepoDatasets.json', import.meta.url))).datasets;
const sites = { ABBY: { stateCode: 'WA', domainCode: 'D16' }, BART: { stateCode: 'NH', domainCode: 'D01' } };
const items = [{
  id: 19, name: 'Frozen tissues', taxa: ['Mammals'], protocols: ['MAM'], preservation: ['Frozen'],
  siteCodes: [{ siteCode: 'ABBY', availableMonths: ['2020-01', '2024-02'] }, { siteCode: 'BART', availableMonths: ['2023-11'] }],
}, { id: 118, name: 'Gastrointestinal tracts', taxa: [], protocols: [], preservation: [], siteCodes: [] }];
const links = (filters = {}, results = items) => recordLinks({ root: '/portal', items, results, filters: { ...emptyFilters(), ...filters }, sites, datasets });
const params = (result) => new URL(result.browse, 'https://example.test').searchParams;

test('both actions carry the full result selection including virtual tissues', () => {
  const result = links();
  assert.equal(params(result).get('db'), '19,118');
  assert.equal(params(result).has('datasetid'), false);
  assert.equal(params(result).has('taxa'), false);
  assert.equal(new URL(result.browse, 'https://example.test').search, new URL(result.search, 'https://example.test').search);
  assert(result.search.startsWith('/portal/neon/search/index.php?'));
  const many = Array.from({ length: 20 }, (_, i) => ({ ...items[0], id: i + 1 }));
  assert.equal(params(links({}, many)).get('db').split(',').length, 20);
});
test('site, state and domain filters resolve to site dataset IDs with intersection semantics', () => {
  assert.equal(params(links({ sites: ['ABBY'] })).get('datasetid'), '34');
  assert.equal(params(links({ states: ['NH'] })).get('datasetid'), '33');
  assert.equal(params(links({ domains: ['D16'] })).get('datasetid'), '34');
  assert.equal(params(links({ sites: ['ABBY', 'BART'], states: ['WA'], domains: ['D16', 'D01'] })).get('datasetid'), '34');
  assert.equal(params(links({ states: ['WA', 'NH'] })).get('datasetid'), '33,34');
  assert.equal(links({ states: ['WA'], domains: ['D01'] }).browse, '');
});
test('selected months become inclusive dates, including leap years and open bounds', () => {
  assert.equal(params(links({ from: '2024-02', to: '2024-02' })).get('eventdate2'), '2024-02-29');
  assert.equal(params(links({ from: '2023-02', to: '2023-02' })).get('eventdate2'), '2023-02-28');
  assert.equal(params(links({ from: '2023-11', to: '2023-11' })).get('eventdate1'), '2023-11-01');
  assert.equal(params(links({ from: '2023-11', to: '2023-11' })).get('eventdate2'), '2023-11-30');
  assert.equal(params(links({ from: '2020-01' })).get('eventdate2'), '2024-02-29');
  assert.equal(params(links({ to: '2023-11' })).get('eventdate1'), '2020-01-01');
  assert.equal(params(links({ domains: ['D16', 'D01'], from: '2023-11', to: '2023-11' })).get('datasetid'), '33');
});
test('scientific-name terms use taxa; catalog keywords do not become scientific names', () => {
  assert.equal(params(links({ q: '"Peromyscus maniculatus" Harpalus' })).get('taxa'), 'peromyscus maniculatus,harpalus');
  assert.equal(params(links({ q: 'tissues Peromyscus' })).get('taxa'), 'peromyscus');
  assert.equal(params(links({ q: 'frozen tissues' })).has('taxa'), false);
});
test('empty, invalid, and unmapped selections never produce an unfiltered record link', () => {
  assert.equal(links({}, []).browse, '');
  assert.equal(links({ from: '2025-01', to: '2020-01' }).browse, '');
  assert.equal(links({ from: '2026-13' }).browse, '');
  const unknown = [{ ...items[0], siteCodes: [{ siteCode: 'TEST', availableMonths: [] }] }];
  const result = links({ sites: ['TEST'] }, unknown);
  assert.equal(result.browse, '');
  assert(result.error);
});
test('search form restores selected sites from the same dataset mapping', () => {
  assert.deepEqual(sitesFromRecordQuery('?datasetid=34,33', datasets), new Set(['ABBY', 'BART']));
  assert.deepEqual(sitesFromRecordQuery('', datasets), new Set());
  assert.deepEqual(sitesFromRecordQuery('?datasetid=999999', datasets), new Set());
});
