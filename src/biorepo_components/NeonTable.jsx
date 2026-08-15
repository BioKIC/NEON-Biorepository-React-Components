import React from 'react';
import PropTypes from 'prop-types';

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import MaterialTable from 'material-table';

import MaterialTableIcons from '../lib_components/components/MaterialTableIcons/MaterialTableIcons';
import Theme from '../lib_components/components/Theme/Theme';

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

    '& tbody tr:nth-child(even)': {
      backgroundColor: theme.palette.grey[100],
    },

    '& tbody tr:nth-child(odd)': {
      backgroundColor: '#fff',
    },

    '& tbody tr:hover': {
      backgroundColor: theme.palette.grey[200],
    },

    '& .MuiTableSortLabel-root': {
      color: '#fff',
    },

    '& .MuiTableSortLabel-root:hover': {
      color: '#fff',
    },

    '& .MuiTableSortLabel-root.MuiTableSortLabel-active': {
      color: '#fff',
    },

    '& .MuiTableSortLabel-icon': {
      color: '#fff !important',
    },

    '& td.MuiTablePagination-root': {
      borderBottom: 'none',
      borderRight: 'none',
    },

    '& .neon-sort-icon': {
      display: 'inline-flex',
      flexDirection: 'column',
      fontSize: '8px',
      lineHeight: '7px',
      marginLeft: '8px',
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

    '& .MuiTableSortLabel-root, & .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.MuiTableSortLabel-active': {
      textDecoration: 'none',
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

export default function NeonTable() {
  const classes = useStyles(Theme);
  /*
   * Expected tableData structure:
   *
   * window.tableData = [
   *   {
   *     columnName: 'Plain text or numeric value',
   *     anotherColumn: 123,
   *   },
   * ];
   *
   * To render a value as a link, pass an object containing
   * a "value" to display and a "link" for the URL:
   *
   * window.tableData = [
   *   {
   *     sampleType: {
   *       value: 'Plant Tissue',
   *       link: 'https://example.com',
   *     },
   *     sampleCount: 25,
   *   },
   * ];
   *
   * Column names are generated automatically from the object keys.
   * Any field with { value, link } will be rendered as a clickable link.
   */
  const data = window.tableData || [];

  const columns = data.length
    ? Object.keys(data[0]).map((field) => ({
      title: formatTitle(field),
      field,
      sorting: true,
      searchable: true,

      customSort: (rowA, rowB) => {
        const a = rowA[field];
        const b = rowB[field];

        const aValue = a && typeof a === 'object' && 'value' in a ? a.value : a;
        const bValue = b && typeof b === 'object' && 'value' in b ? b.value : b;

        if (aValue === bValue) return 0;
        return aValue > bValue ? 1 : -1;
      },

      render: (row) => {
        const value = row[field];

        if (value && typeof value === 'object' && value.link) {
          return (
            <a href={value.link}>
              {value.value}
            </a>
          );
        }

        return value;
      },
    }))
    : [];

  const tableIcons = {
    ...MaterialTableIcons,
    SortArrow: SortIcon,
  };

  return (
    <div className={classes.tableContainer}>
      <MaterialTable
        icons={tableIcons}
        components={{
          Container: Box,
        }}
        columns={columns}
        data={data}
        options={{
          toolbar: false,
          filtering: false,
          padding: 'default',
          thirdSortClick: false,
          paging: false,
        }}
        localization={{
          body: {
            emptyDataSourceMessage: 'No data available.',
          },
        }}
      />
    </div>
  );
}
