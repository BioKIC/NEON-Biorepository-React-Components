import React, { useMemo, useState } from 'react';
import { Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Link, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { hasKeyword, keywordGroups, toggleKeyword } from './keywords';

export default function CatalogKeywordBrowser({ items, query, onChange, resultCount }) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => keywordGroups(items), [items]);
  return (
    <>
      <Link
        component="button"
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        sx={{ fontSize: 'inherit !important', verticalAlign: 'baseline', color: '#0073cf', textDecoration: 'underline' }}
      >
        Browse keywords
      </Link>{' '}for ideas.
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="lg"
        aria-labelledby="catalog-keywords-title"
        aria-describedby="catalog-keywords-help"
        slotProps={{ paper: { className: 'biorepo-catalog-dialog' } }}
        sx={{
          '& .keyword-description, & .keyword-result-count': { fontSize: '0.75rem !important', lineHeight: 1.5 },
          '& .keyword-letter': { fontSize: '0.875rem !important', fontWeight: 500 },
          '& .keyword-chip, & .keyword-chip .MuiChip-label': { fontSize: '0.75rem !important', fontWeight: 500 },
          '& .keyword-chip': { height: 'auto', minHeight: 28, maxWidth: '100%' },
          '& .keyword-chip .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere', py: 0.5 },
          '& .keyword-chip .MuiChip-icon': { fontSize: '1rem' },
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto', md: '1fr 1fr auto' }, gap: 2, alignItems: 'start', p: 3, pb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <DialogTitle id="catalog-keywords-title" sx={{ p: 0, mb: 1 }}>Browse Keywords</DialogTitle>
            <Typography id="catalog-keywords-help" className="keyword-description">
              Click keywords below to add them to your search. Separate search terms match sample types with either term. Click a selected keyword again to remove it.
            </Typography>
          </Box>
          <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, gridRow: { xs: 2, md: 'auto' }, minWidth: 0 }}>
            <TextField
              autoFocus
              fullWidth
              size="small"
              type="search"
              label="Search sample types"
              placeholder='Soil, "DNA extracts", etc...'
              value={query}
              onChange={(event) => onChange(event.target.value)}
            />
            <Typography className="keyword-result-count" role="status" sx={{ mt: 1, textAlign: 'right', color: '#595d60' }}>
              With all filters combined: {resultCount.toLocaleString()} sample {resultCount === 1 ? 'type' : 'types'}
            </Typography>
          </Box>
          <IconButton aria-label="Close keyword browser" onClick={() => setOpen(false)} sx={{ gridColumn: { xs: 2, md: 3 }, gridRow: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 1, pb: 3 }}>
          {groups.length ? (
            <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 3 }}>
              {groups.map(([letter, keywords]) => (
                <Box component="section" key={letter} aria-label={`${letter} keywords`} sx={{ breakInside: 'avoid', mb: 3 }}>
                  <Typography component="h3" className="keyword-letter" sx={{ mb: 1 }}>{letter}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {keywords.map((keyword) => {
                      const selected = hasKeyword(query, keyword);
                      return (
                        <Chip
                          key={keyword}
                          className="keyword-chip"
                          label={keyword}
                          icon={selected ? <CheckIcon /> : <AddIcon />}
                          variant="outlined"
                          clickable
                          aria-pressed={selected}
                          onClick={() => onChange(toggleKeyword(query, keyword))}
                          sx={{
                            color: '#0073cf', borderColor: selected ? '#0073cf' : '#c5d4dc',
                            borderStyle: selected ? 'solid' : 'dotted', bgcolor: selected ? '#eaf4fc' : '#fff',
                            '& .MuiChip-icon': { color: selected ? '#0073cf' : '#8ebdde' },
                            '&:hover': { bgcolor: '#eaf4fc' },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : <Typography>No keywords are available yet. You can still search sample titles and descriptions above.</Typography>}
        </DialogContent>
      </Dialog>
    </>
  );
}
