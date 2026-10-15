'use client';

import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../lib_components/components/Theme';
export default function ClientOnly() {
  useEffect(() => {
  
    const roots: ReturnType<typeof createRoot>[] = [];
    let cancelled = false;

    const mounts = [
      ['biorepo-page', () => import('../../biorepo_components/BiorepoPage')],
      ['biorepo-home-page-content', () => import('../../biorepo_components/BiorepoHomePageContent')],
      ['biorepo-aboutsamples-content', () => import('../../biorepo_components/BiorepoAboutSamplesContent')],
      ['biorepo-collections-content', () => import('../../biorepo_components/BiorepoCollectionsContent')],
      ['biorepo-checklists-content', () => import('../../biorepo_components/BiorepoChecklistsContent')],
      ['biorepo-collection-page-content', () => import('../../biorepo_components/BiorepoCollectionPageContent')],
      ['biorepo-search-metrics', () => import('../../biorepo_components/BiorepoSearchMetrics')],
      ['biorepo-coll-type', () => import('../../biorepo_components/CollectionTypeSummary')],
      ['collection-search-map', () => import('../../biorepo_components/CollectionSearchMap')],
      ['sample-site-map', () => import('../../biorepo_components/SampleSiteMap')],
      ['neon-table', () => import('../../biorepo_components/NeonTable')],
      ['neon-project-table', () => import('../../biorepo_components/NeonProjectTable')],
    ] as const;

    async function mountComponents() {
      // BiorepoPage is first in the mounts array.
      const [pageId, loadPage] = mounts[0];
    
      let pageElement = document.getElementById(pageId);
    
      if (!pageElement) {
        pageElement = await new Promise<HTMLElement>((resolve) => {
          const observer = new MutationObserver(() => {
            const found = document.getElementById(pageId);
            if (found) {
              observer.disconnect();
              resolve(found);
            }
          });
    
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
        });
      }
    
      if (cancelled) return;
    
      const pageModule = await loadPage();
      if (cancelled) return;
    
      const pageRoot = createRoot(pageElement);
      pageRoot.render(<pageModule.default />);
      roots.push(pageRoot);
    
      // Wait until BiorepoPage signals that its layout is ready.
      await new Promise<void>((resolve) => {
        window.addEventListener(
          'biorepo:neon-page-ready',
          () => resolve(),
          { once: true }
        );
      });
    
      if (cancelled) return;
    
      // Now mount only components present on this page.
      for (const [id, loadComponent] of mounts.slice(1)) {
        const element = document.getElementById(id);
    
        if (!element) {
          continue;
        }
    
        const module = await loadComponent();
    
        if (cancelled) return;
    
        const Component = module.default;
        const root = createRoot(element);
    
        root.render(
          <ThemeProvider theme={theme}>
            <Component />
          </ThemeProvider>
        );
        roots.push(root);
      }
    }

    void mountComponents();

    return () => {
      cancelled = true;
      for (const root of roots) {
        root.unmount();
      }
    };
  }, []);

  return null;
}
if (typeof window !== 'undefined') {
  const mount = document.createElement('div');
  mount.id = 'biorepo-client-bootstrap';
  document.body.appendChild(mount);

  createRoot(mount).render(<ClientOnly />);
}