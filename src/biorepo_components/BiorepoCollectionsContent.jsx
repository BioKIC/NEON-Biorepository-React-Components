import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import NeonContext from '../lib_components/components/NeonContext/NeonContext';
import DataProductAvailability from '../lib_components/components/DataProductAvailability/DataProductAvailability';
import MapSelectionButton from '../lib_components/components/MapSelectionButton/MapSelectionButton';
import {
  FACETS,
  emptyFilters,
  exportRows,
  filterCatalog,
  matchingSites,
  readFilters,
  toCsv,
  validateCatalog,
  writeFilters,
} from './sampleCatalog/catalog';

const labels = {
  taxa: 'Taxonomic Group',
  preservation: 'Preservation Method',
  protocols: 'Protocol',
  sites: 'Sites',
  states: 'States',
  domains: 'Domains',
};
const EMPTY_ITEMS = [];
const EMPTY_SITES = {};
const mapTypes = { sites: 'SITES', states: 'STATES', domains: 'DOMAINS' };

function Facet({
  name, options, selected, onChange, mapReady,
}) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const matches = options.filter((option) => (
    option.label.toLowerCase().includes(query.toLowerCase())
  ));
  const visible = expanded || query ? matches : matches.slice(0, 5);
  return (
    <Box component="section" sx={{ py: 2 }} aria-label={labels[name]}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
          {labels[name]}
        </Typography>
        {mapTypes[name] && mapReady && (
          <MapSelectionButton
            selection={mapTypes[name]}
            validItems={options.filter((option) => option.known).map((option) => option.value)}
            selectedItems={selected}
            onSave={(values) => onChange([...values])}
            buttonProps={{ size: 'small', variant: 'outlined' }}
            icon={false}
          />
        )}
      </Stack>
      <TextField
        fullWidth
        size="small"
        label={`Search ${labels[name].toLowerCase()}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Box sx={{ mt: 1, maxHeight: expanded || query ? 280 : 'none', overflowY: 'auto' }}>
        {visible.map((option) => (
          <FormControlLabel
            key={option.value}
            sx={{
              display: 'flex',
              m: 0,
              alignItems: 'flex-start',
              '& .MuiFormControlLabel-label': { pt: 1, fontSize: '0.75rem' },
            }}
            control={(
              <Checkbox
                size="small"
                checked={selected.includes(option.value)}
                onChange={(event) => onChange(
                  event.target.checked
                    ? [...selected, option.value]
                    : selected.filter((value) => value !== option.value),
                )}
              />
            )}
            label={`${option.label} (${option.count})`}
          />
        ))}
        {!visible.length && (
          <Typography variant="body2" sx={{ py: 1 }}>
            No matching options
          </Typography>
        )}
      </Box>
      {!query && matches.length > 5 && (
        <Button size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer' : `View all (${matches.length})`}
        </Button>
      )}
    </Box>
  );
}
Facet.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
      count: PropTypes.number,
      known: PropTypes.bool,
    }),
  ).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  mapReady: PropTypes.bool.isRequired,
};

function Catalog() {
  const root = (window.NEON_CLIENT_ROOT || '').replace(/\/$/, '');
  const [context] = NeonContext.useNeonContextState();
  const { data: geography, isFinal: geographyReady, hasError: geographyError } = context;
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState(() => readFilters(window.location.search));
  const [limit, setLimit] = useState(10);
  const loadMoreRef = useRef(null);
  const [datesOpen, setDatesOpen] = useState(false);
  const [sidebar, setSidebar] = useState(
    () => document.getElementById('biorepo-catalog-filters'),
  );
  const [exportError, setExportError] = useState('');
  const sites = geography.sites || EMPTY_SITES;
  const items = catalog?.items || EMPTY_ITEMS;

  useEffect(() => {
    const syncSidebar = () => setSidebar(document.getElementById('biorepo-catalog-filters'));
    // NeonPage mounts/unmounts the sidebar content when its mobile disclosure changes.
    const observer = new MutationObserver(syncSidebar);
    observer.observe(document.body, { childList: true, subtree: true });
    const onPop = () => {
      setFilters(readFilters(window.location.search));
      setLimit(10);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${root}/neon-react/biorepo_lib/sample-catalog.php`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load sample catalog.');
        return validateCatalog(data);
      })
      .then(setCatalog)
      .catch((reason) => {
        if (reason.name !== 'AbortError') setError(reason.message);
      });
    return () => controller.abort();
  }, [root, attempt]);

  const update = (change, replace = false) => {
    const next = { ...filters, ...change };
    setFilters(next);
    setLimit(10);
    const search = writeFilters(window.location.search, next);
    const url = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
    if (
      url !== `${window.location.pathname}${window.location.search}${window.location.hash}`
    ) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
    }
  };
  const results = useMemo(() => filterCatalog(items, filters, sites), [items, filters, sites]);
  const visibleLimit = window.IntersectionObserver ? limit : results.length;
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || limit >= results.length) return undefined;
    if (!window.IntersectionObserver) return undefined;
    let active = true;
    const observer = new IntersectionObserver((entries) => {
      if (active && entries.some((entry) => entry.isIntersecting)) {
        active = false;
        observer.disconnect();
        setLimit((current) => Math.min(current + 10, results.length));
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(target);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [limit, results]);
  const options = useMemo(
    () => Object.fromEntries(
      FACETS.map((key) => {
        const counts = new Map();
        const facetFilters = { ...filters, [key]: [] };
        const candidates = filterCatalog(items, facetFilters, sites);
        candidates.forEach((item) => {
          const values = mapTypes[key]
            ? matchingSites(item, facetFilters, sites)
              .filter((site) => !(filters.from || filters.to) || site.availableMonths.length)
              .map((site) => {
                const meta = sites[site.siteCode] || {};
                return key === 'sites'
                  ? site.siteCode
                  : meta[key === 'states' ? 'stateCode' : 'domainCode'];
              })
              .filter(Boolean)
            : item[key];
          [...new Set(values)].forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
        });
        return [
          key,
          [...new Map([
            ...filters[key].map((value) => [value, 0]),
            ...counts,
          ])]
            .map(([value, count]) => {
              const meta = (geography[key] || {})[value];
              const title = key === 'sites' ? meta?.description : meta?.name;
              return {
                value,
                count,
                known: Boolean(meta),
                label: title ? `${value} — ${title}` : value,
              };
            })
            .sort((a, b) => a.label.localeCompare(b.label)),
        ];
      }),
    ),
    [items, geography, sites, filters],
  );
  const siteCount = new Set(
    items.flatMap((item) => item.siteCodes.map((site) => site.siteCode)),
  ).size;
  const invalidDates = Boolean(filters.from && filters.to && filters.from > filters.to);
  const active = FACETS.flatMap((key) => filters[key].map((value) => ({
    key,
    value,
    label: options[key].find((option) => option.value === value)?.label || value,
  })));

  const download = (format) => {
    setExportError('');
    const rows = exportRows(items, `${window.location.origin}${root}`);
    if (format === 'pdf') {
      const preview = window.open('', '_blank');
      if (!preview) {
        setExportError(
          'Allow pop-ups to open the printable catalog, then choose Save as PDF.',
        );
        return;
      }
      preview.opener = null;
      preview.document.title = 'NEON Sample Type Catalog';
      const style = preview.document.createElement('style');
      style.textContent = [
        'body{font:12pt Arial,sans-serif;margin:30px}',
        'article{break-inside:avoid;border-bottom:1px solid #ccc;padding:16px 0}',
        'h1,h2{color:#0073cf}p{white-space:pre-wrap}button{padding:12px}',
        '@media print{button{display:none}}',
      ].join('');
      preview.document.head.append(style);
      const heading = preview.document.createElement('h1');
      heading.textContent = 'NEON Sample Type Catalog';
      preview.document.body.append(heading);
      const print = preview.document.createElement('button');
      print.textContent = 'Print / Save as PDF';
      print.onclick = () => preview.print();
      preview.document.body.append(print);
      rows.forEach((row) => {
        const article = preview.document.createElement('article');
        Object.entries(row).forEach(([key, value]) => {
          const element = preview.document.createElement(key === 'sample_type' ? 'h2' : 'p');
          element.textContent = key === 'sample_type'
            ? value : `${key.replaceAll('_', ' ')}: ${value ?? ''}`;
          article.append(element);
        });
        preview.document.body.append(article);
      });
      return;
    }
    const blob = new Blob(
      [
        format === 'csv'
          ? `\uFEFF${toCsv(rows)}`
          : JSON.stringify({ generatedAt: catalog.generatedAt, items: rows }, null, 2),
      ],
      { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NEON_Sample_Type_Catalog.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filterPanel = (
    <Box sx={{ p: 2, bgcolor: '#f5f6f7' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Filter
        </Typography>
        <Button size="small" onClick={() => update(emptyFilters())}>
          Reset all filters
        </Button>
      </Stack>
      <TextField
        sx={{ mt: 2 }}
        fullWidth
        size="small"
        label="Search sample types"
        type="search"
        value={filters.q}
        onChange={(event) => update({ q: event.target.value }, true)}
      />
      <Typography variant="caption">Match all terms; use quotes for phrases.</Typography>
      <Box component="section" sx={{ py: 2 }}>
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
          Available Dates
        </Typography>
        <Typography variant="body2" sx={{ my: 1 }}>
          Show sample types with records collected between two months.
        </Typography>
        <Button fullWidth variant="outlined" size="small" onClick={() => setDatesOpen(true)}>
          Filter on available dates…
        </Button>
        {(filters.from || filters.to) && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {filters.from || 'Any start'}
            {' '}
            –
            {filters.to || 'Any end'}
          </Typography>
        )}
      </Box>
      <Divider />
      {FACETS.map((key) => (
        <React.Fragment key={key}>
          <Facet
            name={key}
            options={options[key]}
            selected={filters[key]}
            onChange={(values) => update({ [key]: values })}
            mapReady={geographyReady && !geographyError}
          />
          <Divider />
        </React.Fragment>
      ))}
    </Box>
  );

  return (
    <Box>
      {sidebar ? createPortal(filterPanel, sidebar) : null}
      <Typography variant="h3" component="h1">
        Explore Sample Types
      </Typography>
      <Typography sx={{ mt: 2, mb: 3 }}>
        Discover samples and specimens held at the NEON Biorepository.
      </Typography>
      {error && (
        <Alert
          severity="error"
          action={<Button onClick={() => { setError(''); setAttempt(attempt + 1); }}>Retry</Button>}
        >
          {error}
        </Alert>
      )}
      {!catalog && !error && (
        <Stack direction="row" spacing={2} role="status">
          <CircularProgress size={24} />
          <Typography>Loading sample catalog…</Typography>
        </Stack>
      )}
      {geographyError && (
        <Alert severity="warning">
          Site reference information could not be loaded. Site codes and other filters remain
          usable; state/domain filters and charts may be unavailable. Reload to retry.
        </Alert>
      )}
      {catalog && (
        <>
          <Typography component="h2" variant="h5">
            All Sample Types
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {items.length}
            {' '}
            sample types from
            {siteCount}
            {' '}
            sites
          </Typography>
          <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <Typography color="text.secondary">Download Full Catalog:</Typography>
            {['csv', 'json', 'pdf'].map((format) => (
              <Button
                key={format}
                onClick={() => download(format)}
                aria-label={`Download full catalog ${format.toUpperCase()}`}
              >
                {format.toUpperCase()}
              </Button>
            ))}
          </Stack>
          {exportError && <Alert severity="warning">{exportError}</Alert>}
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {filters.q && (
              <Chip label={`Search: ${filters.q}`} onDelete={() => update({ q: '' })} />
            )}
            {active.map(({ key, value, label }) => (
              <Chip
                key={`${key}-${value}`}
                label={label}
                onDelete={() => update({ [key]: filters[key].filter((entry) => entry !== value) })}
              />
            ))}
            {(filters.from || filters.to) && (
              <Chip
                label={`${filters.from || 'Any start'} – ${filters.to || 'Any end'}`}
                onDelete={() => update({ from: '', to: '' })}
              />
            )}
          </Stack>
          {invalidDates && (
            <Alert severity="error">The start month must be on or before the end month.</Alert>
          )}
          {!results.length && (
            <Alert severity="info">
              No sample types match these filters. Try removing a filter or changing the date
              range.
            </Alert>
          )}
          {results.slice(0, visibleLimit).map((item) => {
            const coverage = matchingSites(item, filters, sites);
            const chartSites = coverage.filter(
              (site) => sites[site.siteCode] && site.availableMonths.length,
            );
            const months = [
              ...new Set(coverage.flatMap((site) => site.availableMonths)),
            ].sort();
            const details = `${root}/collections/misc/neoncollprofiles.php?collid=${item.id}`;
            return (
              <Card
                key={item.id}
                variant="outlined"
                component="article"
                sx={{ p: { xs: 2, md: 3 }, mb: 3, boxShadow: 'none' }}
              >
                <Stack
                  direction={{ xs: 'column', lg: 'row' }}
                  sx={{ gap: 3, justifyContent: 'space-between' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography component="h2" variant="h5">
                      <Link href={details}>{item.name}</Link>
                    </Typography>
                    {item.description && (
                      <Typography sx={{ mt: 2, whiteSpace: 'pre-line' }}>
                        {item.description.length > 420
                          ? `${item.description.slice(0, 420)}…`
                          : item.description}
                      </Typography>
                    )}
                  </Box>
                  <Stack sx={{ gap: 1, minWidth: 200, flexShrink: 0 }}>
                    <Button
                      variant="contained"
                      href={`${root}/collections/list.php?db=${item.id}`}
                    >
                      Explore samples
                    </Button>
                    <Button variant="outlined" href={details}>
                      Sample type details
                    </Button>
                  </Stack>
                </Stack>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 3, my: 3 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>Preservation</Typography>
                    <Typography>{item.preservation.join(', ') || 'Not specified'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>Protocol</Typography>
                    <Typography>{item.protocols.join('; ') || 'Not specified'}</Typography>
                  </Box>
                  {item.storageConditions && (
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>Storage</Typography>
                      <Typography>{item.storageConditions}</Typography>
                    </Box>
                  )}
                  {item.storageContainer && (
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>Container</Typography>
                      <Typography>{item.storageContainer}</Typography>
                    </Box>
                  )}
                </Stack>
                <Typography sx={{ fontWeight: 700 }}>Available Dates</Typography>
                <Typography sx={{ mb: 2 }}>
                  {months.length
                    ? `${months[0]} through ${months[months.length - 1]}`
                    : 'No dated site records'}
                </Typography>
                {chartSites.length && geographyReady && !geographyError ? (
                  <DataProductAvailability
                    key={item.id}
                    siteCodes={chartSites}
                    view="summary"
                    disableSelection
                    delineateRelease={false}
                  />
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    {!geographyReady
                      ? 'Loading site information…'
                      : 'Availability chart requires dated records at recognized NEON sites.'}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mt: 2 }}
                  color="text.secondary"
                >
                  {Number(item.totalSamples).toLocaleString()}
                  {' '}
                  public records in this
                  collection. Coverage reflects collection dates of cataloged records; it does
                  not guarantee material is available for loan.
                </Typography>
              </Card>
            );
          })}
          {results.length > visibleLimit && (
            <Box ref={loadMoreRef} aria-hidden="true" sx={{ height: 1 }} />
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 3 }}>
            Catalog updated
            {new Date(catalog.generatedAt).toLocaleString()}
          </Typography>
        </>
      )}
      <Dialog open={datesOpen} onClose={() => setDatesOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Filter by collection month</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Both endpoints are inclusive. Leave either blank for an open range.
          </Typography>
          <Stack sx={{ gap: 2, pt: 1 }}>
            <TextField
              label="Start month"
              type="month"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.from}
              onChange={(event) => update({ from: event.target.value })}
              error={invalidDates}
            />
            <TextField
              label="End month"
              type="month"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.to}
              onChange={(event) => update({ to: event.target.value })}
              error={invalidDates}
              helperText={invalidDates ? 'End month must not precede start month.' : ''}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => update({ from: '', to: '' })}>Clear dates</Button>
          <Button onClick={() => setDatesOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function BiorepoCollectionsContent() {
  const outerTheme = useTheme();
  const catalogTheme = useMemo(() => createTheme(outerTheme, {
    typography: {
      h1: { fontSize: '2rem' },
      h2: { fontSize: '1.75rem' },
      h3: { fontSize: '1.75rem' },
      h4: { fontSize: '1.375rem' },
      h5: { fontSize: '1.125rem' },
      h6: { fontSize: '1rem' },
      subtitle1: { fontSize: '0.875rem' },
      subtitle2: { fontSize: '0.8125rem' },
      body1: { fontSize: '0.875rem' },
      body2: { fontSize: '0.75rem' },
      button: { fontSize: '0.75rem' },
      caption: { fontSize: '0.6875rem' },
      overline: { fontSize: '0.6875rem' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          sizeSmall: { fontSize: '0.6875rem' },
          sizeMedium: { fontSize: '0.75rem' },
          sizeLarge: { fontSize: '0.8125rem' },
        },
      },
      MuiChip: { styleOverrides: { root: { fontSize: '0.75rem' } } },
    },
  }), [outerTheme]);
  return (
    <ThemeProvider theme={catalogTheme}>
      <NeonContext.Provider>
        <Catalog />
      </NeonContext.Provider>
    </ThemeProvider>
  );
}
