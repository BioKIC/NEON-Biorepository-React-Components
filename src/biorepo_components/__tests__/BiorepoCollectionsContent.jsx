import React from 'react';
import { act, fireEvent, render, screen, waitFor, cleanup, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BiorepoCollectionsContent from '../BiorepoCollectionsContent';

jest.mock('../../lib_components/components/NeonContext/NeonContext', () => ({
  __esModule: true,
  default: {
    Provider: ({ children }) => children,
    useNeonContextState: () => [{ isFinal: true, hasError: false, data: {
      sites: { ABBY: { description: 'Abby Road', stateCode: 'WA', domainCode: 'D16' },
        BART: { description: 'Bartlett', stateCode: 'NH', domainCode: 'D01' } },
      states: { WA: { name: 'Washington' }, NH: { name: 'New Hampshire' } },
      domains: { D16: { name: 'Pacific Northwest' }, D01: { name: 'Northeast' } },
    } }],
  },
}));
jest.mock('../../lib_components/components/DataProductAvailability/DataProductAvailability', () => ({
  __esModule: true,
  default: ({ siteCodes, view, hideViewControls }) => <div data-testid="availability" data-view={view} data-hide-controls={hideViewControls}>{JSON.stringify(siteCodes)}</div>,
}));
jest.mock('../../lib_components/components/MapSelectionButton/MapSelectionButton', () => ({
  __esModule: true,
  default: ({ selection, onSave }) => <button type="button" onClick={() => onSave(new Set(['ABBY']))}>{`Map ${selection}`}</button>,
}));
const makeItem = (id, name, code, month) => ({
  id, name, collectionCode: `COLL-${id}`, description: 'Sample description', taxa: ['Small Mammals'],
  preservation: ['Frozen'], protocols: ['MAM'], totalSamples: 3,
  storageConditions: '', storageContainer: '', dataProducts: '',
  siteCodes: [{ siteCode: code, availableMonths: [month] }],
});
const data = { version: 1, generatedAt: '2026-11-06T00:00:00Z', items: [
  makeItem(1, 'Ear Punches', 'ABBY', '2020-01'), makeItem(2, 'Hearts', 'BART', '2023-01'),
] };
const mount = () => render(<ThemeProvider theme={createTheme()}><BiorepoCollectionsContent /></ThemeProvider>);
beforeEach(() => {
  window.history.replaceState(null, '', '/collections/misc/browsecollprofiles.php');
  document.body.innerHTML = '<div id="biorepo-catalog-filters"></div>';
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data });
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });
test('reactive text and map filters update cards without refetching', async () => {
  mount();
  await screen.findByRole('link', { name: 'Ear Punches' });
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Hearts' } });
  expect(screen.queryByRole('link', { name: 'Ear Punches' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Hearts' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reset all filters' }));
  fireEvent.click(screen.getByRole('button', { name: 'Map SITES' }));
  expect(screen.queryByRole('link', { name: 'Hearts' })).toBeNull();
  expect(window.location.search).toContain('sites=ABBY');
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
test('month filters restrict cards and chart data; browser history restores state', async () => {
  mount();
  await screen.findByRole('link', { name: 'Ear Punches' });
  fireEvent.click(screen.getByRole('button', { name: /Filter on available dates/ }));
  fireEvent.change(screen.getByRole('slider', { name: 'From month' }), { target: { value: 2023 * 12 } });
  expect(screen.queryByRole('link', { name: 'Ear Punches' })).toBeNull();
  expect(screen.getByTestId('availability').textContent).toContain('2023-01');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('slider', { name: 'Through month' })).toBeTruthy();
  act(() => { window.history.replaceState(null, '', '?sites=ABBY'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await screen.findByRole('link', { name: 'Ear Punches' });
  expect(screen.queryByRole('link', { name: 'Hearts' })).toBeNull();
});
test('retry recovers a failed catalog response', async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Not ready' }) });
  mount();
  await screen.findByText('Not ready');
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByRole('link', { name: 'Ear Punches' });
  expect(screen.queryByText('Not ready')).toBeNull();
});
test('sidebar portal follows mobile disclosure remount', async () => {
  mount();
  await screen.findByRole('link', { name: 'Ear Punches' });
  act(() => document.getElementById('biorepo-catalog-filters').remove());
  await waitFor(() => expect(screen.queryByRole('searchbox')).toBeNull());
  act(() => { const target = document.createElement('div'); target.id = 'biorepo-catalog-filters'; document.body.append(target); });
  await screen.findByRole('searchbox');
});
test('scrolling reveals every batch and filtering resets progressive rendering', async () => {
  const observers = [];
  window.IntersectionObserver = jest.fn().mockImplementation((callback) => {
    const observer = { callback, observe: jest.fn(), disconnect: jest.fn() };
    observers.push(observer);
    return observer;
  });
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...data,
    items: Array.from({ length: 23 }, (_, i) => makeItem(i + 1, `Sample ${String(i + 1).padStart(2, '0')}`, 'ABBY', '2020-01')),
  }) });
  try {
    const view = mount();
    await screen.findByRole('link', { name: 'Sample 01' });
    expect(screen.getAllByTestId('availability')).toHaveLength(10);
    expect(screen.queryByLabelText('Sort by')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show more sample types' })).toBeNull();
    await act(async () => observers[0].callback([{ isIntersecting: false }]));
    expect(screen.getAllByTestId('availability')).toHaveLength(10);
    await act(async () => observers[0].callback([{ isIntersecting: true }]));
    expect(screen.getAllByTestId('availability')).toHaveLength(20);
    await act(async () => observers[observers.length - 1].callback([{ isIntersecting: true }]));
    expect(screen.getAllByTestId('availability')).toHaveLength(23);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Sample' } });
    expect(screen.getAllByTestId('availability')).toHaveLength(10);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(observers.every((observer) => observer.disconnect.mock.calls.length)).toBe(true);
  } finally {
    delete window.IntersectionObserver;
  }
});

test('cards show collection codes and request summary-only availability', async () => {
  mount();
  await screen.findByRole('link', { name: 'Ear Punches' });
  expect(screen.getByText('COLL-1')).toBeTruthy();
  expect(screen.getByText('COLL-2')).toBeTruthy();
  screen.getAllByTestId('availability').forEach((chart) => {
    expect(chart.getAttribute('data-view')).toBe('summary');
    expect(chart.getAttribute('data-hide-controls')).toBe('true');
  });
});

test.each(['csv', 'json', 'pdf'])('downloads the PR summary as a %s attachment', async (format) => {
  const blob = new Blob(['file contents'], { type: format === 'pdf' ? 'application/pdf' : 'text/plain' });
  const filename = `NEON_Sample_Type_Summary20261106.${format}`;
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data })
    .mockResolvedValueOnce({ ok: true, blob: async () => blob,
      headers: { get: () => `attachment; filename="${filename}"` } });
  const createUrl = jest.fn(() => 'blob:summary');
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createUrl;
  URL.revokeObjectURL = jest.fn();
  const clicked = [];
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordDownload() {
    clicked.push({ href: this.href, filename: this.download });
  });
  const open = jest.spyOn(window, 'open');
  try {
    mount();
    await screen.findByRole('link', { name: 'Ear Punches' });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Hearts' } });
    jest.useFakeTimers();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: `Download full catalog ${format.toUpperCase()}` })));
    expect(global.fetch).toHaveBeenLastCalledWith(`/collections/download/downloadsampletypes.php?format=${format}`);
    expect(createUrl).toHaveBeenCalledWith(blob);
    expect(clicked).toEqual([{ href: 'blob:summary', filename }]);
    expect(open).not.toHaveBeenCalled();
  } finally {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
  }
});
test('failed downloads show the server error without saving a file', async () => {
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Summary unavailable' }) });
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  mount();
  await screen.findByRole('link', { name: 'Ear Punches' });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Download full catalog PDF' })));
  expect(screen.getByText('Summary unavailable')).toBeTruthy();
  expect(click).not.toHaveBeenCalled();
});

test('inline date reset clears the range without clearing other filters', async () => {
  mount();
  await screen.findByRole('link', { name: 'Hearts' });
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Hearts' } });
  fireEvent.click(screen.getByRole('button', { name: /Filter on available dates/ }));
  fireEvent.change(screen.getByRole('slider', { name: 'Through month' }), { target: { value: 2021 * 12 } });
  expect(screen.queryByRole('link', { name: 'Hearts' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByRole('link', { name: 'Hearts' })).toBeTruthy();
  expect(screen.getByRole('searchbox').value).toBe('Hearts');
  expect(window.location.search).not.toContain('from=');
  expect(window.location.search).not.toContain('to=');
  expect(screen.queryByRole('slider')).toBeNull();
});

test('manual facet selections keep the list visible and support selected view and per-facet reset', async () => {
  mount();
  await screen.findByRole('link', { name: 'Ear Punches' });
  const sites = within(screen.getByRole('region', { name: 'Sites' }));
  expect(sites.getByText('(none selected)')).toBeTruthy();
  fireEvent.click(sites.getByRole('checkbox', { name: /ABBY/ }));
  expect(sites.getByText('(1 selected)')).toBeTruthy();
  expect(sites.getByRole('checkbox', { name: /BART/ })).toBeTruthy();
  fireEvent.click(sites.getByRole('button', { name: 'View selected (1)' }));
  expect(sites.queryByRole('checkbox', { name: /BART/ })).toBeNull();
  fireEvent.click(sites.getByRole('button', { name: 'View all (2)' }));
  expect(sites.getByRole('checkbox', { name: /BART/ })).toBeTruthy();
  expect(sites.getByRole('checkbox', { name: /ABBY/ }).checked).toBe(true);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ear' } });
  fireEvent.click(sites.getByRole('button', { name: 'Reset' }));
  expect(sites.getByText('(none selected)')).toBeTruthy();
  expect(screen.getByRole('searchbox').value).toBe('Ear');
  expect(window.location.search).not.toContain('sites=');
});

test('saving a map selection shows only selected entries and reset all restores the list', async () => {
  mount();
  await screen.findByRole('link', { name: 'Ear Punches' });
  const sites = within(screen.getByRole('region', { name: 'Sites' }));
  fireEvent.change(sites.getByRole('textbox'), { target: { value: 'Bart' } });
  fireEvent.click(sites.getByRole('button', { name: 'Map SITES' }));
  expect(sites.getByRole('textbox').value).toBe('');
  expect(sites.getByRole('checkbox', { name: /ABBY/ }).checked).toBe(true);
  expect(sites.queryByRole('checkbox', { name: /BART/ })).toBeNull();
  expect(sites.getByText('(1 selected)')).toBeTruthy();
  expect(sites.getByRole('button', { name: 'View all (2)' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reset all filters' }));
  expect(sites.getByText('(none selected)')).toBeTruthy();
  expect(sites.getByRole('checkbox', { name: /BART/ })).toBeTruthy();
});


test('search analytics waits for typing to stop and ignores facet changes and empty searches', async () => {
  mount();
  await screen.findByRole('link', { name: 'Ear Punches' });
  jest.useFakeTimers();
  window.gtag = jest.fn();
  try {
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Hea' } });
    act(() => jest.advanceTimersByTime(500));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Hearts' } });
    act(() => jest.advanceTimersByTime(999));
    expect(window.gtag).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(window.gtag).toHaveBeenCalledWith('event', 'sample_type_search', {
      search_term: 'Hearts', search_source: 'sample_type_explorer', results_count: 1,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Map SITES' }));
    act(() => jest.advanceTimersByTime(1000));
    expect(window.gtag).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    act(() => jest.advanceTimersByTime(1000));
    expect(window.gtag).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nonexistent' } });
    act(() => jest.advanceTimersByTime(1000));
    expect(window.gtag).toHaveBeenLastCalledWith('event', 'sample_type_search', {
      search_term: 'nonexistent', search_source: 'sample_type_explorer', results_count: 0,
    });
  } finally {
    cleanup();
    delete window.gtag;
    jest.useRealTimers();
  }
});


test('identification cards show an Identification Records chip beside the collection code', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({
    ...data, items: [
      { ...data.items[0], name: 'Diatom Slide Identifications', sampleTypeName: 'Slide Sample Identifications' },
      data.items[1],
    ],
  }) });
  mount();
  const title = await screen.findByRole('link', { name: 'Diatom Slide Identifications' });
  const card = title.closest('.catalog-card');
  const chip = within(card).getByText('Identification Records').closest('.MuiChip-root');
  expect(chip.previousElementSibling.textContent).toBe('COLL-1');
  expect(screen.getAllByText('Identification Records')).toHaveLength(1);
});


test('description links remain clickable without rendering unsafe stored HTML', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({
    ...data, items: [{
      ...data.items[0],
      shortDescription: 'Read the protocol and other details.',
      shortDescriptionHtml: '<p>Read <a href="/protocol" onclick="alert(1)">the protocol</a> and <a href="javascript:alert(1)">other details</a>.</p><script>alert(1)</script>',
    }],
  }) });
  mount();
  const link = await screen.findByRole('link', { name: 'the protocol' });
  expect(link.getAttribute('href')).toBe(new URL('/protocol', window.location.href).href);
  expect(link.hasAttribute('onclick')).toBe(false);
  expect(screen.queryByRole('link', { name: 'other details' })).toBeNull();
  expect(link.closest('.catalog-card').querySelector('script')).toBeNull();
});


test('Search Samples opens the search form with the card collection selected', async () => {
  window.NEON_CLIENT_ROOT = '/neon';
  try {
    mount();
    const title = await screen.findByRole('link', { name: 'Ear Punches' });
    const card = title.closest('.catalog-card');
    const filter = within(card).getByRole('link', { name: 'Search Samples' });
    expect(filter.getAttribute('href')).toBe('/neon/neon/search/index.php?db=1');
    expect(filter.previousElementSibling).toBeNull();
    expect(filter.nextElementSibling.textContent).toContain('Browse all samples');
    const other = screen.getByRole('link', { name: 'Hearts' }).closest('.catalog-card');
    expect(within(other).getByRole('link', { name: 'Search Samples' }).getAttribute('href')).toBe('/neon/neon/search/index.php?db=2');
  } finally {
    delete window.NEON_CLIENT_ROOT;
  }
});
