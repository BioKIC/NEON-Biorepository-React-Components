import React from 'react';
import PropTypes from 'prop-types';

import { ThemeProvider } from '@mui/material/styles';
import { makeStyles } from '../lib_components/components/Theme/makeStyles';

import Box from '@mui/material/Box';
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

function NeonTableContent() {
  const { classes } = useStyles();
  const data = React.useMemo(() => window.tableData || [], []);
  const [expanded, setExpanded] = React.useState({});
  const [search, setSearch] = React.useState('');

  const toggleDetails = React.useCallback((datasetid) => {
    setExpanded((current) => ({ ...current, [datasetid]: !current[datasetid] }));
  }, []);

  const visibleRows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const stripHtml = (value) => String(value ?? '').replace(/<[^>]*>/g, '');
    return data.filter((row) => !term || ['name', 'researcherName'].some(
      (field) => stripHtml(row[field]).toLowerCase().includes(term),
    ));
  }, [data, search]);

  return (
    <Box className={classes.tableContainer}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', p: 2 }}>
        <TextField
          size="small"
          placeholder="Search"
          aria-label="Search projects"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ width: 450, maxWidth: '100%' }}
          slotProps={{ input: { startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ) } }}
        />
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>PI Name</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center">No projects available.</TableCell></TableRow>
            ) : visibleRows.map((row, index) => (
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
