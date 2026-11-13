import React, { useLayoutEffect, useRef } from 'react';
import Box from '@mui/material/Box';

export default function BiorepoSearchSidebar() {
  const controlsRef = useRef(null);
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

  return <Box id="biorepo-search-controls" ref={controlsRef} sx={{ pt: 2, bgcolor: '#f5f6f7' }} />;
}
