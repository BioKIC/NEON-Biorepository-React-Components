import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';

import { makeStyles } from '../lib_components/components/Theme/makeStyles';
import Theme from '../lib_components/components/Theme/Theme';

const useStyles = makeStyles()((theme) => ({
  tableContainer: {
    backgroundColor: '#fff',
    '& table': {
      margin: '0 !important',
      borderCollapse: 'collapse',
    },
    '& th.MuiTableCell-head': {
      padding: '6px 16px',
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      borderRight: '1px solid rgba(0, 0, 0, 0.2)',
    },
    '& th.MuiTableCell-head:last-child': {
      borderRight: 'none',
    },
    '& td.MuiTableCell-body': {
      borderBottom: 'none',
      borderRight: '1px solid #ddd',
    },
    '& td.MuiTableCell-body:last-child': {
      borderRight: 'none',
    },
    '& tbody tr:nth-of-type(even)': {
      backgroundColor: theme.palette.grey[100],
    },
    '& tbody tr:nth-of-type(odd)': {
      backgroundColor: '#fff',
    },
    '& tbody tr:hover': {
      backgroundColor: theme.palette.grey[200],
    },
    '& .MuiTableSortLabel-root, & .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.Mui-active': {
      color: '#fff',
      textDecoration: 'none',
    },
    '& .MuiTableSortLabel-icon': {
      color: '#fff !important',
    },
    '& td.MuiTableCell-body, & td.MuiTableCell-body *': {
      fontSize: '0.7rem !important',
    },
    '& th.MuiTableCell-head, & th.MuiTableCell-head *': {
      fontSize: '0.7rem !important',
    },
    '& td.MuiTableCell-body a': {
      textDecoration: 'underline',
    },
  },
}));

const formatTitle = (key = '') => (
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
);

const displayValue = (value) => (
  value && typeof value === 'object' && 'value' in value ? value.value : value
);

function compareValues(a, b) {
  const aValue = displayValue(a);
  const bValue = displayValue(b);
  if (aValue === bValue) return 0;
  if (aValue == null) return -1;
  if (bValue == null) return 1;
  return aValue > bValue ? 1 : -1;
}

function NeonTableContent() {
  const { classes } = useStyles();
  const data = window.tableData || [];
  const columns = data.length ? Object.keys(data[0]) : [];
  const [sortField, setSortField] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState('asc');

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => (
      compareValues(a[sortField], b[sortField]) * (sortDirection === 'asc' ? 1 : -1)
    ));
  }, [data, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <TableContainer component={Box} className={classes.tableContainer}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((field) => (
              <TableCell key={field} sortDirection={sortField === field ? sortDirection : false}>
                <TableSortLabel
                  active={sortField === field}
                  direction={sortField === field ? sortDirection : 'asc'}
                  onClick={() => handleSort(field)}
                >
                  {formatTitle(field)}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Math.max(columns.length, 1)} align="center">
                No data available.
              </TableCell>
            </TableRow>
          ) : sortedData.map((row, index) => (
            <TableRow key={row.id ?? row.datasetid ?? index}>
              {columns.map((field) => {
                const value = row[field];
                return (
                  <TableCell key={field}>
                    {value && typeof value === 'object' && value.link ? (
                      <a href={value.link}>{value.value}</a>
                    ) : displayValue(value)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function NeonTable() {
  return (
    <ThemeProvider theme={Theme}>
      <NeonTableContent />
    </ThemeProvider>
  );
}
