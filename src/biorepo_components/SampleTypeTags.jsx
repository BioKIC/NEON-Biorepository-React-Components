import React, { useState } from 'react';
import { Box, Chip, ClickAwayListener, IconButton, Link, Tooltip } from '@mui/material';

const chipStyles = {
  fontFamily: '"Inter", Helvetica, Arial, sans-serif',
  fontSize: '0.6875rem !important',
  fontWeight: 500,
  '& .MuiChip-label': { fontSize: 'inherit !important', fontWeight: 'inherit' },
};

function ChipHelp({ label, children, color }) {
  const [open, setOpen] = useState(false);
  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <span style={{ position: 'relative', top: '-0.25rem', display: 'inline-flex', flexShrink: 0 }}>
        <Tooltip
          title={children}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          describeChild
          slotProps={{ tooltip: { sx: { fontSize: '0.625rem !important', lineHeight: 1.5, maxWidth: 280 } } }}
        >
          <IconButton
            aria-label={label}
            size="small"
            onClick={() => setOpen((value) => !value)}
            onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
            sx={{ p: 0, color, bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}
          >
            <Box component="span" className="catalog-chip-help-glyph" aria-hidden="true" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '0.625rem', height: '0.625rem', border: '1px solid currentColor', borderRadius: '50%', fontSize: '0.45rem !important', lineHeight: 1, fontWeight: 500 }}>?</Box>
          </IconButton>
        </Tooltip>
      </span>
    </ClickAwayListener>
  );
}

// Reuse catalog classifications and help text wherever sample types are displayed.
export default function SampleTypeTags({ item = {}, className }) {
  const identification = /\bidentifications?\b/i.test(item.sampleTypeName || item.name || '');
  if (!item.outsideRepository && !identification) return null;
  return (
    <Box
      className={className}
      role="group"
      aria-label="Sample type tags"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
    >
      {item.outsideRepository && (
        <Box sx={{ display: 'inline-flex', alignItems: 'flex-start', gap: '0.125rem' }}>
          <Chip
            className="catalog-code"
            label="Outside Repository"
            size="small"
            sx={{ ...chipStyles, bgcolor: '#e8f5e9', color: '#1b5e20', border: '1px solid #388e3c' }}
          />
          <ChipHelp label="About outside repositories" color="#1b5e20">
            Samples and specimens held at repositories outside the NEON Biorepository at Arizona State University.{' '}
            <Link href="https://www.neonscience.org/samples/sample-repositories" target="_blank" rel="noopener noreferrer" color="inherit" underline="always">Learn about NEON sample repositories</Link>
          </ChipHelp>
        </Box>
      )}
      {identification && (
        <Box sx={{ display: 'inline-flex', alignItems: 'flex-start', gap: '0.125rem' }}>
          <Chip
            className="catalog-code"
            label="Identification Records"
            size="small"
            sx={{ ...chipStyles, bgcolor: '#f5b23b', color: '#4b2d0b', border: '1px solid #a4681b' }}
          />
          <ChipHelp label="About identification records" color="#a4681b">
            Taxonomic identification records describe organisms identified within a bulk sample rather than individually archived specimens.
          </ChipHelp>
        </Box>
      )}
    </Box>
  );
}
