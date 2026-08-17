import React from 'react';
import PropTypes from 'prop-types';

import {
  makeStyles,
  ThemeProvider,
} from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';

import MaterialTable, { MTableBodyRow } from 'material-table';

import MaterialTableIcons from '../lib_components/components/MaterialTableIcons/MaterialTableIcons';
import Theme from '../lib_components/components/Theme/Theme';

const ExpansionContext = React.createContext({
  expanded: {},
});

const SortIcon = ({ className }) => (
  <span className={`${className} neon-sort-icon`}>
    <span className="sort-up">▲</span>
    <span className="sort-down">▼</span>
  </span>
);

SortIcon.propTypes = {
  className: PropTypes.string,
};

SortIcon.defaultProps = {
  className: '',
};

const useStyles = makeStyles((theme) => ({
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
      borderRight: '0 !important',
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

    '& .MuiTableSortLabel-root, & .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.MuiTableSortLabel-active': {
      color: '#fff',
      textDecoration: 'none',
    },

    '& .MuiTableSortLabel-icon': {
      color: '#fff !important',
    },

    '& .neon-sort-icon': {
      display: 'inline-flex',
      flexDirection: 'column',
      fontSize: '8px',
      lineHeight: '7px',
      marginLeft: theme.spacing(1),
      color: 'rgba(255, 255, 255, 0.4)',
      transform: 'none !important',
    },

    '& .MuiTableSortLabel-iconDirectionAsc .sort-up': {
      color: '#fff',
    },

    '& .MuiTableSortLabel-iconDirectionAsc .sort-down': {
      color: 'rgba(255, 255, 255, 0.4)',
    },

    '& .MuiTableSortLabel-iconDirectionDesc .sort-up': {
      color: 'rgba(255, 255, 255, 0.4)',
    },

    '& .MuiTableSortLabel-iconDirectionDesc .sort-down': {
      color: '#fff',
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
  const classes = useStyles();

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
              className={classes.description}
            >
              {rowData.description}
            </Typography>
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

function ProjectRow(props) {
  const { data, columns } = props;
  const classes = useStyles();
  const { expanded } = React.useContext(ExpansionContext);

  const isOpen = !!expanded[data.datasetid];

  return (
    <>
      <MTableBodyRow {...props} />

      <TableRow className={classes.detailTableRow}>
        <TableCell
          colSpan={columns.length}
          className={classes.detailTableCell}
        >
          <Collapse
            in={isOpen}
            timeout={350}
            unmountOnExit
          >
            <Box className={classes.detailWrapper}>
              <ProjectDetails rowData={data} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

ProjectRow.propTypes = {
  data: PropTypes.shape({
    datasetid: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
  }).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string,
      title: PropTypes.string,
    }),
  ).isRequired,
};

function NeonTableContent() {
  const classes = useStyles();
  const data = window.tableData || [];

  const [expanded, setExpanded] = React.useState({});

  const expansionContextValue = React.useMemo(
    () => ({ expanded }),
    [expanded],
  );

  const toggleDetails = React.useCallback((datasetid) => {
    setExpanded((current) => ({
      ...current,
      [datasetid]: !current[datasetid],
    }));
  }, []);

  const columns = [
    {
      title: 'Title',
      field: 'name',
      sorting: true,
      searchable: true,
      cellStyle: {
        width: '55%',
      },
    },
    {
      title: 'PI Name',
      field: 'researcherName',
      sorting: true,
      searchable: true,
      cellStyle: {
        width: '25%',
      },
    },
    {
      title: '',
      field: 'details',
      sorting: false,
      searchable: false,
      cellStyle: {
        width: '20%',
        textAlign: 'right',
        whiteSpace: 'nowrap',
      },
      render: (rowData) => {
        const isOpen = !!expanded[rowData.datasetid];

        return (
          <Button
            variant="outlined"
            color="primary"
            size="medium"
            startIcon={isOpen ? <RemoveIcon /> : <AddIcon />}
            onClick={(event) => {
              event.stopPropagation();
              toggleDetails(rowData.datasetid);
            }}
          >
            {isOpen ? 'Close Details' : 'More Details'}
          </Button>
        );
      },
    },
  ];

  const tableIcons = {
    ...MaterialTableIcons,
    SortArrow: SortIcon,
  };

  return (
    <ExpansionContext.Provider value={expansionContextValue}>
      <Box className={classes.tableContainer}>
        <MaterialTable
          title=""
          icons={tableIcons}
          components={{
            Container: Box,
            Row: ProjectRow,
          }}
          columns={columns}
          data={data}
          options={{
            toolbar: true,
            search: true,
            filtering: false,
            paging: false,
            padding: 'default',
            thirdSortClick: false,
            searchFieldAlignment: 'left',
            searchFieldStyle: {
              width: '450px',
            },
            rowStyle: (rowData) => ({
              backgroundColor: rowData.tableData.id % 2 === 0
                ? Theme.palette.common.white
                : Theme.palette.grey[100],
            }),
          }}
          localization={{
            body: {
              emptyDataSourceMessage: 'No projects available.',
            },
            toolbar: {
              searchPlaceholder: 'Search',
            },
          }}
        />
      </Box>
    </ExpansionContext.Provider>
  );
}

export default function NeonProjectTable() {
  return (
    <ThemeProvider theme={Theme}>
      <NeonTableContent />
    </ThemeProvider>
  );
}
