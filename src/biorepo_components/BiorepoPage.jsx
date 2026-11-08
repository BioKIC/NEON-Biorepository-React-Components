import React, {
  useState,
  useEffect,
  useLayoutEffect,
} from 'react';

import GlobalStyles from '@mui/material/GlobalStyles';

import NeonPage from '../lib_components/components/NeonPage/NeonPage';
import StyleSeeds from './StyleSeeds';

export default function BiorepoPage() {
  const isSampleCatalog = window.location.pathname
    .endsWith('/collections/misc/browsecollprofiles.php');
  const isCollectionProfile = window.location.pathname.endsWith('/collections/misc/neoncollprofiles.php');
  const hasCustomSidebar = isSampleCatalog || isCollectionProfile;
  const [config, setConfig] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);

  // Get breadcrumbs and sidebar from json based on pathname
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [sidebarLinks, setSidebarLinks] = useState([]);
  const [sidebarTitle, setSidebarTitle] = useState('');

  useEffect(() => {
    // Fetch configuration from getSymbiniConfig.php
    const fetchConfig = async () => {
      try {
        const basePath = window.location.origin;
        let clientRootPath = window.NEON_CLIENT_ROOT;
        if (typeof clientRootPath !== 'string') {
          const pathSegments = window.location.pathname.split('/').slice(0, -1).filter(Boolean);
          clientRootPath = '';
          for (let i = 1; i <= pathSegments.length; i += 1) {
            const candidatePath = `/${pathSegments.slice(0, i).join('/')}`;
            const response = await fetch(
              `${basePath}${candidatePath}/neon-react/biorepo_lib/getSymbiniConfig.php`,
              { method: 'HEAD' },
            );
            if (response.ok) {
              clientRootPath = candidatePath;
              break;
            }
          }
        }
        const fetchUrl = `${basePath}${clientRootPath.endsWith('/') ? clientRootPath.slice(0, -1) : clientRootPath}/neon-react/biorepo_lib/getSymbiniConfig.php`;
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch configuration');
        }
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Error fetching configuration:', error);
        setLayoutReady(true);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!config) return;
    const fetchBreadcrumbs = async () => {
      try {
        const response = await fetch(`${config.CLIENT_ROOT}/neon-react/biorepo_lib/breadcrumbs.json?ts=${Date.now()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch breadcrumbs');
        }
        const data = await response.json();
        const pathname = window.location.pathname.slice(config.CLIENT_ROOT.length);
        const breadcrumbData = data[pathname] || [{ name: 'Data & Samples', href: 'https://www.neonscience.org/data-samples' }, { name: 'Sample Portal' }];
        setBreadcrumbs(breadcrumbData);
      } catch (error) {
        console.error('Error fetching breadcrumbs:', error);
      }
    };

    const fetchSidebarLinks = async () => {
      try {
        const response = await fetch(`${config.CLIENT_ROOT}/neon-react/biorepo_lib/sidebar.json?ts=${Date.now()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sidebar links');
        }
        const data = await response.json();
        const { pathname } = window.location;
        const filename = pathname.split('/').pop();

        const sidebarData = data[filename] || data.default;
        setSidebarLinks(sidebarData.links);
        setSidebarTitle(sidebarData.sidebarTitle);
      } catch (error) {
        console.error('Error fetching sidebar links:', error);
      }
    };

    // Reveal only after both requests settle, including their error paths.
    Promise.allSettled([fetchBreadcrumbs(), fetchSidebarLinks()])
      .then(() => setLayoutReady(true));
  }, [config]);
  
  useLayoutEffect(() => {
    if (!layoutReady) return;
    const neonPageContent = document.querySelector(
      'div[data-selenium="neon-page.content"]'
    );
  
    if (neonPageContent) {
  
      window.dispatchEvent(
        new CustomEvent('biorepo:neon-page-ready')
      );
    }
  }, [layoutReady]);

  return (
    <NeonPage
      breadcrumbs={breadcrumbs}
      breadcrumbHomeHref="https://www.neonscience.org/"
      sidebarLinks={hasCustomSidebar ? [] : sidebarLinks}
      sidebarContent={isSampleCatalog ? <div id="biorepo-catalog-filters" /> : isCollectionProfile ? <div id="biorepo-profile-navigation" /> : null}
      sidebarContentResponsive={hasCustomSidebar}
      sidebarDisableMaxHeight={hasCustomSidebar}
      sidebarUnsticky={isSampleCatalog}
      sidebarWidth={isSampleCatalog ? 340 : 300}
      sidebarTitle={isSampleCatalog ? 'Filter' : isCollectionProfile ? '' : sidebarTitle}
      sidebarContainerClassName={isSampleCatalog ? 'catalog-sidebar' : undefined}
    >
      {isSampleCatalog && (
        <GlobalStyles styles={{
          '#header': { position: 'relative !important', top: 'auto !important' },
          '.catalog-sidebar > div > .MuiDivider-root': { display: 'none' },
        }} />
      )}
      <StyleSeeds />
    </NeonPage>
  );
}
