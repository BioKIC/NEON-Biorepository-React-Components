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

  useLayoutEffect(() => {
    const sidebar = controlsRef.current?.closest('.search-sidebar');
    if (!sidebar) return undefined;

    let headers = [];
    const updateOffset = () => {
      const offset = headers.reduce((bottom, header) => {
        const style = window.getComputedStyle(header);
        const height = header.getBoundingClientRect().height;
        if (!height || !['sticky', 'fixed'].includes(style.position)) return bottom;
        return Math.max(bottom, height + (parseFloat(style.top) || 0));
      }, 0);
      const inset = parseFloat(window.getComputedStyle(sidebar).paddingTop) || 0;
      sidebar.style.setProperty('--search-header-offset', `${offset}px`);
      sidebar.style.setProperty('--search-sidebar-inset', `${inset}px`);
    };
    const resizeObserver = window.ResizeObserver ? new window.ResizeObserver(updateOffset) : null;
    const observeHeaders = () => {
      const next = Array.from(document.querySelectorAll('#header'));
      if (next.length === headers.length && next.every((header, index) => header === headers[index])) return;
      resizeObserver?.disconnect();
      headers = next;
      headers.forEach(header => resizeObserver?.observe(header));
      updateOffset();
    };
    const mutationObserver = new window.MutationObserver(observeHeaders);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    observeHeaders();
    updateOffset();
    window.addEventListener('resize', updateOffset);

    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateOffset);
      sidebar.style.removeProperty('--search-header-offset');
      sidebar.style.removeProperty('--search-sidebar-inset');
    };
  }, []);

  return <Box id="biorepo-search-controls" ref={controlsRef} sx={{ width: '100%', minWidth: 0, bgcolor: '#f5f6f7' }} />;
}
