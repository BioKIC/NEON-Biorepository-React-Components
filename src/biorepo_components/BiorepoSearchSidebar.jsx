import React, { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function BiorepoSearchSidebar({ footer }) {
  const controlsRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useMediaQuery('(max-width: 959.95px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isOpen = !isMobile || expanded;

  useLayoutEffect(() => {
    const panel = document.getElementById('criteria-panel');
    const host = controlsRef.current;
    if (!panel || !host) return undefined;

    const placeholder = document.createComment('search controls');
    panel.before(placeholder);
    host.append(panel);

    return () => {
      placeholder.replaceWith(panel);
    };
  }, []);

  return (
    <Box sx={{
      position: { xs: 'static', md: 'sticky' },
      top: '24px',
      maxHeight: { xs: 'none', md: 'calc(100vh - 48px)' },
      overflowY: { xs: 'visible', md: 'auto' },
      minWidth: 0,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography id="search-sidebar-title" component="h2" variant="h5" sx={{ fontWeight: 700 }}>
          Search Criteria
        </Typography>
        {isMobile && (
          <IconButton
            aria-label={isOpen ? 'Collapse search criteria' : 'Expand search criteria'}
            aria-expanded={isOpen}
            aria-controls="search-sidebar-content"
            onClick={() => setExpanded(value => !value)}
          >
            {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
      <Collapse in={isOpen} timeout={reduceMotion ? 0 : 'auto'} unmountOnExit={false}>
        <div id="search-sidebar-content" aria-labelledby="search-sidebar-title">
          <Divider sx={{ my: { xs: 2, md: 3 } }} />
          <div id="biorepo-search-controls" ref={controlsRef} />
          {footer}
        </div>
      </Collapse>
    </Box>
  );
}

BiorepoSearchSidebar.propTypes = { footer: PropTypes.node };
