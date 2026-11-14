import React from 'react';
import PropTypes from 'prop-types';

import { ThemeProvider } from '@mui/material/styles';
import { makeStyles } from '../lib_components/components/Theme/makeStyles';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import LinearProgress from '@mui/material/LinearProgress';
import TablePagination from '@mui/material/TablePagination';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import {
  emptyProjectFilters, readProjectFilters, projectSearchUrl, writeProjectHistory,
} from './projectSearch';


import Theme from '../lib_components/components/Theme/Theme';

const useStyles = makeStyles()((theme) => ({
  tableContainer: {
    backgroundColor: '#fff',

    '& table': {
      margin: '0 !important',
      borderCollapse: 'collapse',
    },

    '& th.MuiTableCell-head': {
      padding: theme.spacing(1, 2),
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      borderRight: `1px solid ${theme.palette.primary.main} !important`,
    },

    '& td.MuiTableCell-body': {
      padding: theme.spacing(2.5, 2),
      borderBottom: 'none',
      borderRight: '0 !important',
      verticalAlign: 'middle',
    },

    '& td.MuiTableCell-body, & td.MuiTableCell-body *': {
      fontSize: '0.7rem !important',
    },

    '& th.MuiTableCell-head, & th.MuiTableCell-head *': {
      fontSize: '0.7rem !important',
    },

  },

  detailTableRow: {
    '&:hover': {
      backgroundColor: 'transparent !important',
    },
  },

  detailTableCell: {
    padding: '0 !important',
    borderBottom: '0 !important',
    borderRight: '0 !important',
  },

  detailWrapper: {
    overflow: 'hidden',
  },

  detailPaper: {
    margin: theme.spacing(2),
    padding: theme.spacing(3),
  },

  detailLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 260px',
    gap: theme.spacing(5),
  },

  detailContent: {
    display: 'flex',
    flexDirection: 'column',
  },

  description: {
    lineHeight: 1.6,
  },

  metaSection: {
    minWidth: 0,
  },

  metaBlock: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },

  moreInfoButton: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
  },

  '@media (max-width: 800px)': {
    detailLayout: {
      gridTemplateColumns: '1fr',
      gap: theme.spacing(2),
    },
  },
}));

const formatDate = (date) => {
  if (!date) return '';

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function ProjectDetails({ rowData }) {
  const { classes } = useStyles();

  return (
    <Paper
      variant="outlined"
      className={classes.detailPaper}
    >
      <Box className={classes.detailLayout}>
        <Box className={classes.detailContent}>
          {rowData.description && (
            <Typography
              variant="body1"
              component="div"
              className={classes.description}
              dangerouslySetInnerHTML={{ __html: rowData.description }}
            />
          )}

          <Button
            variant="contained"
            color="primary"
            size="large"
            href={`neonpublic.php?datasetid=${rowData.datasetid}`}
            endIcon={<ArrowForwardIosIcon />}
            className={classes.moreInfoButton}
          >
            More Info
          </Button>
        </Box>

        <Box className={classes.metaSection}>
          <Box className={classes.metaBlock}>
            <Typography variant="subtitle2">
              PI Affiliation
            </Typography>

            <Typography variant="body1">
              {rowData.institution || '—'}
            </Typography>
          </Box>

          <Divider />

          <Box className={classes.metaBlock} mt={2}>
            <Typography variant="subtitle2">
              Start Date
            </Typography>

            <Typography variant="body1">
              {formatDate(rowData.activeDate) || '—'}
            </Typography>
          </Box>

          <Divider />

          <Box className={classes.metaBlock} mt={2}>
            <Typography variant="subtitle2">
              End Date
            </Typography>

            <Typography variant="body1">
              {rowData.completeDate
                ? formatDate(rowData.completeDate)
                : 'In Progress'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

ProjectDetails.propTypes = {
  rowData: PropTypes.shape({
    datasetid: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
    description: PropTypes.string,
    institution: PropTypes.string,
    activeDate: PropTypes.string,
    completeDate: PropTypes.string,
  }).isRequired,
};

function ProjectRow({ data, isOpen, onToggle, index }) {
  const { classes } = useStyles();

  return (
    <React.Fragment>
      <TableRow sx={{ backgroundColor: index % 2 === 0 ? Theme.palette.common.white : Theme.palette.grey[100] }}>
        <TableCell sx={{ width: '55%' }}>
          <span dangerouslySetInnerHTML={{ __html: data.name || '' }} />
        </TableCell>
        <TableCell sx={{ width: '25%' }}>{data.researcherName}</TableCell>
        <TableCell sx={{ width: '20%', textAlign: 'right', whiteSpace: 'nowrap' }}>
          <Button
            variant="outlined"
            color="primary"
            size="medium"
            startIcon={isOpen ? <RemoveIcon /> : <AddIcon />}
            onClick={() => onToggle(data.datasetid)}
          >
            {isOpen ? 'Close Details' : 'More Details'}
          </Button>
        </TableCell>
      </TableRow>
      <TableRow className={classes.detailTableRow}>
        <TableCell colSpan={3} className={classes.detailTableCell}>
          <Collapse in={isOpen} timeout={350} unmountOnExit>
            <Box className={classes.detailWrapper}>
              <ProjectDetails rowData={data} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

ProjectRow.propTypes = {
  data: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

function ProjectOverview({ endpoint }) {
  const [overview, setOverview] = React.useState(null);
  const [failed, setFailed] = React.useState(false);
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    const controller = new AbortController();
    const url = new URL(endpoint, window.location.href);
    url.searchParams.set('action', 'overview');
    setFailed(false);
    fetch(url, { signal: controller.signal, credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) throw new Error('Overview unavailable');
        return response.json();
      })
      .then(data => { if (!controller.signal.aborted) setOverview(data); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [endpoint, retry]);
  return (
    <section id="project-overview" aria-label="Public research project overview" aria-busy={!overview && !failed}>
      <dl className="overview-metrics">
        {[
          ['specimens', 'Specimens'], ['projects', 'Research projects'],
          ['institutions', 'Institutions'], ['sampleTypes', 'Sample types'],
        ].map(([key, label]) => (
          <div className="overview-metric" key={key}>
            <dt>{label}</dt>
            <dd>{overview ? Number(overview[key]).toLocaleString('en-US') : '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="overview-footer">
        <p className="overview-note">Across all public projects. Totals refresh every 15 minutes.</p>
        {failed && <Button size="small" onClick={() => setRetry(value => value + 1)}>Retry totals</Button>}
      </div>
    </section>
  );
}

ProjectOverview.propTypes = { endpoint: PropTypes.string.isRequired };

function NeonTableContent() {
  const { classes } = useStyles();
  const config = React.useMemo(() => window.NEON_PROJECT_SEARCH || {}, []);
  const [filters, setFilters] = React.useState(() => config.filters || emptyProjectFilters());
  const [search, setSearch] = React.useState(filters.q);
  const [expanded, setExpanded] = React.useState({});
  const [result, setResult] = React.useState({ rows: [], total: 0, page: filters.page });
  const [loading, setLoading] = React.useState(!config.error);
  const [error, setError] = React.useState(config.error || '');
  const [retry, setRetry] = React.useState(0);

  const navigate = React.useCallback((next, replace = false) => {
    writeProjectHistory(next, replace);
    setFilters(next);
  }, []);

  React.useEffect(() => {
    if (!config.error) writeProjectHistory(config.filters || emptyProjectFilters(), true);
    const restore = () => {
      const restored = readProjectFilters(window.location.search);
      setSearch(restored.q);
      setFilters(restored);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [config]);

  React.useEffect(() => {
    if (search === filters.q) return undefined;
    const timer = setTimeout(() => navigate({ ...filters, q: search, page: 1 }, true), 300);
    return () => clearTimeout(timer);
  }, [search, filters, navigate]);

  React.useEffect(() => {
    if (config.error || !config.endpoint) return undefined;
    const controller = new AbortController();
    const url = projectSearchUrl(new URL(config.endpoint, window.location.href), filters);
    setLoading(true);
    setError('');
    setExpanded({});
    setResult({ rows: [], total: 0, page: filters.page });
    fetch(url, { signal: controller.signal, credentials: 'same-origin' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load projects. Please try again.');
        return data;
      })
      .then(data => {
        if (controller.signal.aborted) return;
        setResult(data);
        setLoading(false);
        if (data.page !== filters.page) navigate({ ...filters, page: data.page }, true);
      })
      .catch(reason => {
        if (controller.signal.aborted) return;
        setError(reason.message || 'Unable to load projects. Please try again.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [config, filters, navigate, retry]);

  const toggleDetails = React.useCallback((datasetid) => {
    setExpanded(current => ({ ...current, [datasetid]: !current[datasetid] }));
  }, []);
  const hasFilters = search || filters.db.length || filters.datasetid.length || filters.site.length;

  return (
    <Box className={classes.tableContainer}>
      {config.endpoint && !config.error && <ProjectOverview endpoint={config.endpoint} />}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            label="Search projects"
            placeholder="Title, description, PI, or institution"
            value={search}
            disabled={!!config.error}
            onChange={event => setSearch(event.target.value)}
            sx={{ flex: '1 1 350px' }}
            slotProps={{ input: { startAdornment: (
              <InputAdornment position="start"><SearchIcon /></InputAdornment>
            ) } }}
          />
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            disabled={!hasFilters || !!config.error}
            onClick={() => {
              setSearch('');
              navigate({ ...emptyProjectFilters(), pageSize: filters.pageSize });
            }}
          >
            Clear Filters
          </Button>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
          {[
            ['db', 'Sample types'], ['datasetid', 'Datasets'], ['site', 'Sites'],
          ].map(([key, label]) => {
            const options = (config.options?.[key] || []).map(option => ({
              ...option,
              label: `${option.label}${key === 'db' && option.code ? ` (${option.code})` : ''}${key === 'datasetid' ? ` (#${option.value})` : ''}`,
            }));
            const selected = filters[key].map(value => options.find(option => option.value === value)
              || { value, label: value });
            return (
              <Autocomplete
                key={key}
                multiple
                disableCloseOnSelect
                limitTags={2}
                size="small"
                disabled={!!config.error}
                options={options}
                value={selected}
                getOptionLabel={option => option.label}
                getOptionKey={option => option.value}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                onChange={(_event, values) => navigate({ ...filters, [key]: values.map(option => option.value), page: 1 })}
                renderInput={params => <TextField {...params} label={label} />}
              />
            );
          })}
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ m: 2 }} action={!config.error && (
          <Button color="inherit" size="small" onClick={() => setRetry(value => value + 1)}>Retry</Button>
        )}>{error}</Alert>
      )}
      <Box sx={{ height: 4 }}>{loading && <LinearProgress aria-label="Loading projects" />}</Box>
      <Box sx={{ overflowX: 'auto' }} aria-busy={loading}>
        <Table aria-label="Research projects">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>PI Name</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {result.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" role="status">
                  {loading ? 'Loading projects…' : error ? 'Projects could not be loaded.' : 'No projects match these filters.'}
                </TableCell>
              </TableRow>
            ) : result.rows.map((row, index) => (
              <ProjectRow
                key={row.datasetid}
                data={row}
                index={index}
                isOpen={!!expanded[row.datasetid]}
                onToggle={toggleDetails}
              />
            ))}
          </TableBody>
        </Table>
      </Box>
      <TablePagination
        component="div"
        count={loading || error ? -1 : result.total}
        page={Math.max(0, result.page - 1)}
        rowsPerPage={filters.pageSize}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Projects per page:"
        labelDisplayedRows={({ from, to, count }) => (loading ? 'Loading…' : error ? '' : `${from}–${to} of ${count}`)}
        disabled={loading || !!error}
        onPageChange={(_event, page) => navigate({ ...filters, page: page + 1 })}
        onRowsPerPageChange={event => navigate({ ...filters, pageSize: Number(event.target.value), page: 1 })}
      />
    </Box>
  );
}

export default function NeonProjectTable() {
  return (
    <ThemeProvider theme={Theme}>
      <NeonTableContent />
    </ThemeProvider>
  );
}
