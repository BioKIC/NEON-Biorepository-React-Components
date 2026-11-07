import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CatalogDateFilter from './sampleCatalog/CatalogDateFilter';
import CatalogDescription from './sampleCatalog/CatalogDescription';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  GlobalStyles,
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
  cardDescription,
  emptyFilters,
  filterCatalog,
  matchingSites,
  readFilters,
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
// Override legacy portal CSS and the shared theme's responsive font rules only here.
const catalogTextSelector = [
  '&', '& p', '& span', '& a', '& label', '& button', '& input', '& textarea',
  '& legend', '& li', '& .MuiTypography-root', '& .MuiInputBase-root',
].join(', ');
const compactCatalogStyles = {
  '#biorepo-collections-content, #biorepo-catalog-filters, .biorepo-catalog-dialog': {
    [catalogTextSelector]: {
      fontSize: '0.875rem !important',
    },
    '& h1.MuiTypography-root, & h1 a': { fontSize: '2rem !important' },
    '& h2.MuiTypography-root, & h2 a, & .MuiDialogTitle-root': { fontSize: '1.125rem !important' },
    [['h3', 'h4', 'h5', 'h6'].map((tag) => `& ${tag}.MuiTypography-root`).join(', ')]: {
      fontSize: '0.875rem !important',
    },
  },
  '#biorepo-catalog-filters': {
    [catalogTextSelector]: { fontSize: '0.75rem !important' },
    '& h2.MuiTypography-root': { fontSize: '1rem !important' },
    '& h3.MuiTypography-root': { fontSize: '0.8125rem !important' },
    '& .catalog-reset-button.MuiButton-root': {
      fontSize: '0.625rem !important', fontWeight: '600 !important',
      padding: '0.45rem 0.375rem !important',
      letterSpacing: '0.04em', lineHeight: 1.25, minHeight: '2rem',
      whiteSpace: 'nowrap', backgroundColor: '#0073cf', color: '#fff',
      '&:hover': { backgroundColor: '#005da8' },
      '& .MuiSvgIcon-root': { fontSize: '1rem' },
    },
    '& .catalog-date-heading.MuiTypography-root': {
      fontSize: '1.125rem !important', fontWeight: 500, whiteSpace: 'nowrap',
    },
    '& .catalog-date-help.MuiTypography-root': {
      fontSize: '0.625rem !important', color: '#808080', lineHeight: 1.5,
    },
    '& .catalog-date-button.MuiButton-root': {
      fontSize: '0.625rem !important', fontWeight: 500, letterSpacing: '0.04em',
      lineHeight: 1.25, minHeight: '2rem', whiteSpace: 'nowrap',
      padding: '0.375rem 0.5rem', color: '#0073cf', borderColor: '#0073cf',
      '& .MuiSvgIcon-root': { fontSize: '1rem' },
    },
    '& .catalog-date-button.MuiButton-root:not(.catalog-date-reset)': {
      fontWeight: '600 !important',
    },
    '& .catalog-date-reset.MuiButton-root': {
      minHeight: '1.5rem', padding: '0.3rem 0.375rem !important', flexShrink: 0,
    },
    '& .catalog-reset-button.MuiButton-root, & .catalog-date-reset.MuiButton-root': {
      fontSize: '0.5625rem !important', lineHeight: '1.2 !important',
      minHeight: '1.25rem', minWidth: 0,
      '& .MuiButton-startIcon': { marginLeft: 0, marginRight: '0.25rem' },
      '& .MuiSvgIcon-root': { fontSize: '0.75rem !important' },
    },
    '& .catalog-date-filter .MuiPickersInputBase-root': {
      fontSize: '0.75rem !important', borderRadius: 0,
    },
    '& .catalog-date-filter .MuiIconButton-root': { color: '#0073cf' },
    '& .catalog-date-slider': {
      color: '#0073cf', height: 6,
      '& .MuiSlider-thumb': { width: 10, height: 26, borderRadius: 1, backgroundColor: '#f5f6f7', border: '2px solid currentColor' },
      '& .MuiSlider-mark': { height: 12, width: 3, borderRadius: 1 },
      '& .MuiSlider-markLabel': { fontSize: '0.75rem !important' },
    },
    '& .catalog-search-heading.MuiTypography-root': {
      fontSize: '1.125rem !important', fontWeight: 500,
    },
    '& .catalog-search-help.MuiTypography-root': {
      fontSize: '0.625rem !important', color: '#808080', lineHeight: 1.5,
    },
    '& .catalog-selection-count.MuiTypography-root': {
      fontSize: '0.625rem !important', color: '#808080',
    },
    '& .catalog-facet-subtitle': {
      display: 'block', fontSize: '0.625rem !important', color: '#9b9b9b',
      lineHeight: 1.4, marginTop: '0.125rem',
    },
    '& .catalog-facet-count': {
      fontSize: '0.625rem !important', lineHeight: 1.4, color: '#565a5c',
      border: '1px solid #bdbdbd', borderRadius: '1rem',
      padding: '0.125rem 0.375rem', minWidth: '1.75rem',
      textAlign: 'center', flexShrink: 0, boxSizing: 'border-box',
    },
    '& .MuiCheckbox-root .MuiSvgIcon-root': { fontSize: '0.875rem !important' },
    '& .catalog-view-all.MuiButton-root, & .catalog-map-button.MuiButton-root': {
      fontSize: '0.5625rem !important', fontWeight: '500 !important',
      lineHeight: 1.2, letterSpacing: '0.04em', minWidth: 0,
      padding: '0.3rem 0.5rem !important', marginTop: '0.5rem',
      color: '#0073cf', borderColor: '#0073cf',
      '& .MuiButton-startIcon': { marginLeft: 0, marginRight: '0.25rem' },
      '& .MuiSvgIcon-root': { fontSize: '0.875rem !important' },
    },
    '& .catalog-view-all.MuiButton-root': {
      fontSize: '0.5rem !important', fontWeight: '600 !important',
    },
    '& .catalog-map-button.MuiButton-root': {
      marginTop: 0, fontSize: '0.5rem !important', fontWeight: '600 !important',
    },
    '& .catalog-search-field .MuiOutlinedInput-root': {
      backgroundColor: '#fff', borderRadius: 0,
    },
  },
  '#biorepo-collections-content': {
    '& .catalog-active-filters .MuiChip-root': {
      height: '1.5rem', maxWidth: '100%', borderRadius: '0.75rem',
    },
    '& .catalog-active-filters .MuiChip-label': {
      fontSize: '0.625rem !important', fontWeight: '500 !important',
      paddingLeft: '0.375rem', paddingRight: '0.375rem',
    },
    '& .catalog-active-filters .MuiChip-deleteIcon': {
      fontSize: '0.875rem !important', width: '0.875rem', height: '0.875rem',
      marginLeft: 0, marginRight: '0.25rem',
    },
    '& .catalog-summary-title.MuiTypography-root': {
      fontSize: '1rem !important', color: '#202020', fontWeight: 500,
    },
    '& .catalog-summary-count.MuiTypography-root': {
      fontSize: '0.75rem !important', color: '#595d60',
    },
    '& .catalog-download-note.MuiTypography-root': {
      fontSize: '0.625rem !important', color: '#808080', lineHeight: 1.5,
    },
    '& .catalog-download-label.MuiTypography-root': {
      fontSize: '0.625rem !important', color: '#808080',
    },
    '& .catalog-download-button.MuiButton-root': {
      fontSize: '0.625rem !important',
      color: '#0073cf',
      fontWeight: 600,
      minWidth: 0,
      borderRadius: 0,
      padding: '0.5rem 0.625rem',
      '& + .catalog-download-button': { borderLeft: '1px solid #0073cf' },
    },
    '& .catalog-card .MuiTypography-root': {
      fontSize: '0.75rem !important', lineHeight: 1.5,
    },
    '& .catalog-card .MuiButton-root': {
      fontSize: '0.625rem !important',
      fontWeight: 500,
      letterSpacing: '0.04em',
      lineHeight: 1.25,
      minHeight: '2rem',
      padding: '0.375rem 0.75rem',
      width: '100%',
      '& .MuiButton-endIcon': { marginLeft: '0.375rem', marginRight: 0 },
      '& .MuiButton-endIcon svg': { fontSize: '1rem', width: '1em', height: '1em' },
    },
    '& .catalog-card .catalog-code, & .catalog-card .catalog-code span': {
      fontSize: '0.6875rem !important',
      fontWeight: 500,
    },
    '& .catalog-card .catalog-card-note.MuiTypography-root': {
      fontSize: '0.625rem !important', color: '#666',
    },
    '& .catalog-card .catalog-sample-title, & .catalog-card .catalog-sample-title a': {
      fontSize: '1rem !important',
      fontWeight: 500,
    },
  },
};
const EMPTY_ITEMS = [];
const EMPTY_SITES = {};
const mapTypes = { sites: 'SITES', states: 'STATES', domains: 'DOMAINS' };

function Facet({
  name, options, selected, onChange, mapReady,
}) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => {
    if (!selected.length) setSelectedOnly(false);
  }, [selected.length]);
  const showingSelected = selectedOnly && selected.length > 0;
  const matches = options.filter((option) => (
    option.label.toLowerCase().includes(query.toLowerCase())
  ));
  const visible = showingSelected
    ? matches.filter((option) => selected.includes(option.value))
    : (name === 'preservation' || expanded || query ? matches : matches.slice(0, 5));
  return (
    <Box component="section" sx={{ py: 2 }} aria-label={labels[name]}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
          {labels[name]}
        </Typography>
        <Stack direction="row" sx={{ gap: 1, flexShrink: 0 }}>
          {mapTypes[name] && mapReady && (
            <MapSelectionButton
              selection={mapTypes[name]}
              validItems={options.filter((option) => option.known).map((option) => option.value)}
              selectedItems={selected}
              onSave={(values) => {
                onChange([...values]);
                setQuery('');
                setSelectedOnly(values.size > 0);
                setExpanded(false);
              }}
              buttonProps={{ size: 'small', variant: 'outlined', className: 'catalog-map-button' }}
              tooltipProps={{ slotProps: { tooltip: {
                sx: { fontSize: '0.625rem !important', lineHeight: 1.4 },
              } } }}
              icon
            />
          )}
          {selected.length > 0 && (
            <Button
              className="catalog-map-button"
              variant="outlined"
              size="small"
              startIcon={<CloseIcon />}
              onClick={() => {
                onChange([]);
                setSelectedOnly(false);
                setExpanded(false);
                setQuery('');
              }}
            >
              Reset
            </Button>
          )}
        </Stack>
      </Stack>
      <Typography className="catalog-selection-count" aria-live="polite" sx={{ mb: 2 }}>
        {selected.length ? `(${selected.length} selected)` : '(none selected)'}
      </Typography>
      <TextField
        className="catalog-search-field"
        fullWidth
        size="small"
        placeholder={`Search ${labels[name].toLowerCase()}`}
        slotProps={{ htmlInput: { 'aria-label': `Search ${labels[name].toLowerCase()}` } }}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Box sx={{ mt: 1 }}>
        {visible.map((option) => (
          <FormControlLabel
            key={option.value}
            sx={{
              display: 'flex',
              m: 0,
              alignItems: 'center',
              py: 0.5,
              '& .MuiFormControlLabel-label': { flex: 1, minWidth: 0 },
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
            label={(
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box component="span" sx={{ minWidth: 0 }}>
                  <Box component="span">{option.subtitle ? option.value : option.label}</Box>
                  {option.subtitle && (
                    <Box component="span" className="catalog-facet-subtitle">{option.subtitle}</Box>
                  )}
                </Box>
                <Box component="span" className="catalog-facet-count">{option.count}</Box>
              </Box>
            )}
          />
        ))}
        {!visible.length && (
          <Typography variant="body2" sx={{ py: 1 }}>
            No matching options
          </Typography>
        )}
      </Box>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        {name !== 'preservation' && (showingSelected || (!query && matches.length > 5)) && (
          <Button
            className="catalog-view-all"
            variant="outlined"
            size="small"
            startIcon={expanded && !showingSelected ? <RemoveIcon /> : <AddIcon />}
            aria-expanded={expanded && !showingSelected}
            onClick={() => {
              if (showingSelected) {
                setSelectedOnly(false);
                setExpanded(true);
                setQuery('');
              } else setExpanded(!expanded);
            }}
          >
            {expanded && !showingSelected ? 'View fewer' : `View all (${options.length})`}
          </Button>
        )}
        {name !== 'preservation' && selected.length > 0 && !showingSelected && (
          <Button
            className="catalog-view-all"
            variant="outlined"
            size="small"
            startIcon={<CheckBoxIcon />}
            onClick={() => { setSelectedOnly(true); setQuery(''); }}
          >
            {`View selected (${selected.length})`}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
Facet.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
      subtitle: PropTypes.string,
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
  const lastTrackedSearch = useRef('');
  const [sidebar, setSidebar] = useState(
    () => document.getElementById('biorepo-catalog-filters'),
  );
  const [exportError, setExportError] = useState('');
  const [downloading, setDownloading] = useState('');
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

  useEffect(() => {
    const term = filters.q.trim().replace(/\s+/g, ' ');
    if (!term) {
      lastTrackedSearch.current = '';
      return undefined;
    }
    if (!catalog || lastTrackedSearch.current === term) return undefined;
    const timer = window.setTimeout(() => {
      const event = ['event', 'sample_type_search', {
        search_term: term,
        search_source: 'sample_type_explorer',
        results_count: results.length,
      }];
      if (typeof window.gtag === 'function') window.gtag(...event);
      else if (Array.isArray(window.pendingGAEvents)) window.pendingGAEvents.push(event);
      else return;
      lastTrackedSearch.current = term;
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [filters.q, catalog, results.length]);

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
              const subtitle = key === 'sites'
                ? [title, meta?.stateCode].filter(Boolean).join(', ')
                : (key === 'domains' ? title || '' : '');
              return {
                value,
                count,
                subtitle,
                known: Boolean(meta),
                label: key === 'states' ? (title || value)
                  : (subtitle ? `${value} — ${subtitle}` : (title ? `${value} — ${title}` : value)),
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

  const download = async (format) => {
    setExportError('');
    setDownloading(format);
    try {
      const response = await fetch(
        `${root}/collections/download/downloadsampletypes.php?format=${format}`,
      );
      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        throw new Error(failure.error || 'Unable to download the sample type summary.');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1]
        || `NEON_Sample_Type_Summary.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setExportError(reason.message || 'Unable to download the sample type summary.');
    } finally {
      setDownloading('');
    }
  };

  const filterPanel = (
    <Box sx={{ pt: 2, bgcolor: '#f5f6f7' }}>
      <Button
        className="catalog-reset-button"
        fullWidth
        variant="contained"
        startIcon={<CloseIcon />}
        onClick={() => update(emptyFilters())}
      >
        Reset all filters
      </Button>
      <Typography
        id="catalog-search-heading"
        className="catalog-search-heading"
        component="h2"
        sx={{ mt: 3, mb: 2 }}
      >
        Search
      </Typography>
      <TextField
        className="catalog-search-field"
        fullWidth
        size="small"
        placeholder='Soil, "DNA extracts", etc...'
        slotProps={{ htmlInput: {
          'aria-labelledby': 'catalog-search-heading',
          'aria-describedby': 'catalog-search-help',
        } }}
        type="search"
        value={filters.q}
        onChange={(event) => update({ q: event.target.value }, true)}
      />
      <Typography id="catalog-search-help" className="catalog-search-help" sx={{ mt: 1.5 }}>
        Use several terms to match products having <em>any</em> term (<em>term OR term</em>).
        {' '}Quote terms to match phrases (e.g. "DNA extracts").
      </Typography>
      <CatalogDateFilter items={items} from={filters.from} through={filters.to} onChange={update} />
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
          <Box component="section" aria-label="Sample catalog summary" sx={{ mb: 3 }}>
            <Typography className="catalog-summary-title" component="h2" variant="h5">
              All Sample Types
            </Typography>
            <Stack
              direction="row"
              sx={{
                alignItems: 'center', gap: 0.75, mt: 2, mb: 1,
              }}
            >
              <FormatListBulletedIcon
                aria-hidden="true"
                sx={{ fontSize: '0.75rem', color: '#595d60' }}
              />
              <Typography className="catalog-summary-count">
                {`${items.length} sample types from ${siteCount} sites`}
              </Typography>
            </Stack>
            <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
              <Typography className="catalog-download-label">Download Full Catalog:</Typography>
              <Stack direction="row">
                {['csv', 'json', 'pdf'].map((format) => (
                  <Button
                    className="catalog-download-button"
                    key={format}
                    onClick={() => download(format)}
                    disabled={Boolean(downloading)}
                    aria-label={`Download full catalog ${format.toUpperCase()}`}
                  >
                    {downloading === format ? 'Downloading…' : format.toUpperCase()}
                  </Button>
                ))}
              </Stack>
            </Stack>
            <Typography className="catalog-download-note" sx={{ mt: 1 }}>
              Identification records are linked under “Bulk sample identifications” in the full catalog.
            </Typography>
          </Box>
          {exportError && <Alert severity="warning">{exportError}</Alert>}
          <Stack className="catalog-active-filters" direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
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
            const description = item.shortDescription ?? cardDescription(item.description || '');
            return (
              <Card
                key={item.id}
                className="catalog-card"
                variant="outlined"
                component="article"
                sx={{ p: { xs: 2, md: 3 }, mb: 3, boxShadow: 'none' }}
              >
                <Box sx={{
                  display: 'grid',
                  gap: 3,
                  alignItems: 'start',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(16rem, 28%)',
                  },
                }}
                >

                  <Box sx={{ minWidth: 0 }}>
                    <Typography className="catalog-sample-title" component="h2" variant="h5">
                      <Link href={details}>{item.name}</Link>
                    </Typography>
                    <Stack direction="row" sx={{ mt: 1, gap: 1, flexWrap: 'wrap' }}>
                      {item.collectionCode && (
                        <Chip
                          className="catalog-code"
                          label={item.collectionCode}
                          size="small"
                          sx={{ bgcolor: '#e4e7e7', color: '#737d81', border: '1px solid #92999b' }}
                        />
                      )}
                      {/\bidentifications?\b/i.test(item.sampleTypeName || item.name || '') && (
                        <Chip
                          className="catalog-code"
                          label="Identification Records"
                          size="small"
                          sx={{ bgcolor: '#f5b23b', color: '#4b2d0b', border: '1px solid #a4681b' }}
                        />
                      )}
                    </Stack>
                    {description && (
                      <Typography sx={{ mt: 2 }}>
                        <CatalogDescription html={item.shortDescriptionHtml} text={description} />
                      </Typography>
                    )}
                  </Box>
                  <Stack sx={{ gap: 1.5, width: '100%', minWidth: 0 }}>
                    <Button
                      variant="contained"
                      endIcon={<SearchIcon />}
                      href={`${root}/collections/list.php?db=${item.id}`}
                    >
                      Browse all samples
                    </Button>
                    <Button variant="outlined" href={details} endIcon={<InfoOutlinedIcon />}>
                      Sample type details
                    </Button>
                  </Stack>
                </Box>
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
                    hideViewControls
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
                  className="catalog-card-note"
                  variant="caption"
                  display="block"
                  sx={{ mt: 2 }}
                  color="text.secondary"
                >
                  {Number(item.totalSamples).toLocaleString()}
                  {' '}
                  records in this
                  collection. Coverage reflects collection dates of cataloged records; it does
                  not guarantee material is available for loan.
                </Typography>
              </Card>
            );
          })}
          {results.length > visibleLimit && (
            <Box ref={loadMoreRef} aria-hidden="true" sx={{ height: 1 }} />
          )}
        </>
      )}

    </Box>
  );
}

export default function BiorepoCollectionsContent() {
  const outerTheme = useTheme();
  const catalogTheme = useMemo(() => createTheme(outerTheme, {
    typography: {
      h1: { fontSize: '1.75rem' },
      h2: { fontSize: '1.53125rem' },
      h3: { fontSize: '1.53125rem' },
      h4: { fontSize: '1.20312rem' },
      h5: { fontSize: '0.984375rem' },
      h6: { fontSize: '0.875rem' },
      subtitle1: { fontSize: '0.765625rem' },
      subtitle2: { fontSize: '0.710938rem' },
      body1: { fontSize: '0.765625rem' },
      body2: { fontSize: '0.65625rem' },
      button: { fontSize: '0.65625rem' },
      caption: { fontSize: '0.601562rem' },
      overline: { fontSize: '0.601562rem' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          sizeSmall: { fontSize: '0.601562rem' },
          sizeMedium: { fontSize: '0.65625rem' },
          sizeLarge: { fontSize: '0.710938rem' },
        },
      },
      MuiChip: { styleOverrides: { root: { fontSize: '0.65625rem' } } },
    },
  }), [outerTheme]);
  return (
    <ThemeProvider theme={catalogTheme}>
      <GlobalStyles styles={compactCatalogStyles} />
      <NeonContext.Provider>
        <Catalog />
      </NeonContext.Provider>
    </ThemeProvider>
  );
}
