import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Link from '@mui/material/Link';

// Render only text and safe anchors; never insert stored HTML into the page.
export default function CatalogDescription({ html, text }) {
  const content = useMemo(() => {
    if (!html) return text;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const renderNode = (node, key) => {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return null;
      const tag = node.tagName.toLowerCase();
      if (['script', 'style', 'iframe', 'object', 'template'].includes(tag)) return null;
      const children = Array.from(node.childNodes, (child, index) => renderNode(child, `${key}-${index}`));
      if (tag === 'a') {
        const href = node.getAttribute('href');
        try {
          const url = new URL(href, window.location.href);
          if (href && ['http:', 'https:', 'mailto:'].includes(url.protocol)) {
            return <Link key={key} href={url.href}>{children}</Link>;
          }
        } catch { /* Invalid links remain plain text. */ }
      }
      return <React.Fragment key={key}>{children}{['p', 'div', 'br', 'li'].includes(tag) ? ' ' : ''}</React.Fragment>;
    };
    return Array.from(doc.body.childNodes, (node, index) => renderNode(node, String(index)));
  }, [html, text]);
  return <>{content}</>;
}

CatalogDescription.propTypes = {
  html: PropTypes.string,
  text: PropTypes.string.isRequired,
};
CatalogDescription.defaultProps = { html: '' };
