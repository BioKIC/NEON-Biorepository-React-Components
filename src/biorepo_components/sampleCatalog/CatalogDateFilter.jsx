import React, { useMemo, useState } from 'react';
import { Box, Button, Divider, Slider, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';

const monthIndex = (value) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1;
const monthString = (value) => `${Math.floor(value / 12)}-${String(value % 12 + 1).padStart(2, '0')}`;

export default function CatalogDateFilter({ items, from, through, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [minimum, maximum] = useMemo(() => {
    const months = items.flatMap((item) => item.siteCodes.flatMap((site) => site.availableMonths));
    months.sort();
    const firstYear = months.length ? Number(months[0].slice(0, 4)) : new Date().getFullYear();
    const lastYear = months.length ? Number(months[months.length - 1].slice(0, 4)) : firstYear;
    const selected = [from, through].filter(Boolean).map(monthIndex);
    return [
      Math.floor(Math.min(firstYear * 12, ...selected) / 12) * 12,
      Math.ceil(Math.max((lastYear + 1) * 12, ...selected) / 12) * 12,
    ];
  }, [items, from, through]);
  const start = from ? monthIndex(from) : minimum;
  const end = through ? monthIndex(through) : maximum;
  const open = expanded || Boolean(from || through);
  const marks = [];
  const yearCount = (maximum - minimum) / 12;
  const labelStep = Math.max(1, Math.ceil(yearCount / 3));
  for (let value = minimum; value <= maximum; value += 12) {
    const yearOffset = (value - minimum) / 12;
    const showLabel = value === maximum || (yearOffset % labelStep === 0 && maximum - value >= 12 * labelStep / 2);
    marks.push({ value, label: showLabel ? String(value / 12) : undefined });
  }
  const reset = () => {
    onChange({ from: '', to: '' });
    setExpanded(false);
  };
  return (
    <Box component="section" className="catalog-date-filter" sx={{ py: 3 }}>
      <Divider sx={{ mb: 3 }} />
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography component="h2" className="catalog-date-heading">Available Dates</Typography>
        {open && (
          <Button className="catalog-date-button" variant="outlined" startIcon={<CloseIcon />} onClick={reset}>
            Reset
          </Button>
        )}
      </Stack>
      <Typography className="catalog-date-help" sx={{ mt: 1.5, mb: 2 }}>
        Show sample types that have any records collected between two dates.
      </Typography>
      {!open ? (
        <Button className="catalog-date-button" fullWidth variant="outlined" onClick={() => setExpanded(true)}>
          Filter on available dates…
        </Button>
      ) : (
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Box sx={{ mx: 2, mt: 2, mb: 3 }}>
            <Slider
              className="catalog-date-slider"
              min={minimum}
              max={maximum}
              step={1}
              marks={marks}
              value={[Math.min(start, end), Math.max(start, end)]}
              disableSwap
              getAriaLabel={(index) => (index === 0 ? 'From month' : 'Through month')}
              getAriaValueText={(value) => moment(monthString(value), 'YYYY-MM').format('MMMM YYYY')}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => moment(monthString(value), 'YYYY-MM').format('MMM YYYY')}
              onChange={(_event, value) => onChange({ from: monthString(value[0]), to: monthString(value[1]) }, true)}
            />
          </Box>
          <Stack sx={{ gap: 2 }}>
            {[
              { key: 'from', label: 'From', value: start, min: minimum, max: end },
              { key: 'to', label: 'Through', value: end, min: start, max: maximum },
            ].map(({ key, label, value, min, max }) => (
              <DatePicker
                key={key}
                label={label}
                views={['year', 'month']}
                openTo="month"
                format="MMMM YYYY"
                value={moment(monthString(value), 'YYYY-MM')}
                minDate={moment(monthString(min), 'YYYY-MM')}
                maxDate={moment(monthString(max), 'YYYY-MM')}
                onChange={(date, context) => {
                  if (!date) onChange({ [key]: '' });
                  else if (date.isValid() && !context.validationError) onChange({ [key]: date.format('YYYY-MM') });
                }}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            ))}
          </Stack>
        </LocalizationProvider>
      )}
    </Box>
  );
}
