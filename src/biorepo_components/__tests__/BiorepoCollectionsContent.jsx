import React from 'react';
import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
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
  default: ({ siteCodes }) => <div data-testid="availability">{JSON.stringify(siteCodes)}</div>,
}));
jest.mock('../../lib_components/components/MapSelectionButton/MapSelectionButton', () => ({
  __esModule: true,
  default: ({ selection, onSave }) => <button type="button" onClick={() => onSave(new Set(['ABBY']))}>{`Map ${selection}`}</button>,
}));
const makeItem = (id, name, code, month) => ({
  id, name, description: 'Sample description', taxa: ['Small Mammals'],
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
  fireEvent.change(screen.getByLabelText('Start month'), { target: { value: '2023-01' } });
  expect(screen.queryByRole('link', { name: 'Ear Punches' })).toBeNull();
  expect(screen.getByTestId('availability').textContent).toContain('2023-01');
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
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
