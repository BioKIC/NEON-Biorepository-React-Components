import React, { useEffect, useMemo, useRef, useState } from 'react';

import SiteMap from '../lib_components/components/SiteMap/SiteMap';

import biorepoDatasets from '../lib_components/staticJSON/biorepoDatasets.json';
import { sitesFromRecordQuery } from './sampleCatalog/recordLinks';

/* global updateChip */

export default function BiorepoSearchMap() {
  const datasets = useMemo(() => window.NEON_SEARCH_PARAMETERS?.datasetid
    ?.filter((entry) => entry.view === 'site')
    .map((entry) => ({ name: entry.token, datasetID: entry.ids[0] }))
    ?? biorepoDatasets.datasets, []);
  const [selectedSites, setSelectedSites] = useState(() => sitesFromRecordQuery(
    window.NEON_SEARCH_PARAMETERS?.query ?? window.location.search,
    datasets,
  ));
  const [isMapVisible, setIsMapVisible] = useState(false);
  const restoreTarget = useRef(selectedSites);

  const datasetLookup = Object.fromEntries(
    datasets.map((dataset) => [
      dataset.name,
      dataset.datasetID,
    ]),
  );
  // Restore the map along with the form when navigating Back or Forward.
  useEffect(() => {
    const clearSites = () => {
      restoreTarget.current = null;
      setSelectedSites(new Set());
    };
    const restoreSites = (event) => {
      const query = event.detail?.query;
      if (typeof query !== 'string') return;
      const sites = sitesFromRecordQuery(query, datasets);
      restoreTarget.current = sites;
      setSelectedSites(sites);
    };
    window.addEventListener('neon:clear-sites', clearSites);
    window.addEventListener('neon:restore-search', restoreSites);
    return () => {
      window.removeEventListener('neon:clear-sites', clearSites);
      window.removeEventListener('neon:restore-search', restoreSites);
    };
  }, [datasets]);

  useEffect(() => {
    const target = restoreTarget.current;
    if (target && target.size === selectedSites.size
      && [...target].every((site) => selectedSites.has(site))) {
      restoreTarget.current = null;
      window.dispatchEvent(new CustomEvent('neon:sites-restored', {
        detail: { datasetIds: datasets.filter((dataset) => selectedSites.has(dataset.name)).map((dataset) => dataset.datasetID) },
      }));
    }
    // Map checkboxes may mount after the legacy form's URL-prefill handler runs.
    if (typeof updateChip === 'function' && document.getElementById('chips')) updateChip();
  }, [selectedSites, datasets]);
  useEffect(() => {
    const modal = document.getElementById('domains-sites-modal');

    if (!modal) return undefined;

    const isVisible = () => window.getComputedStyle(modal).display !== 'none';
    let visible;
    let renderTimer;

    const handleModalVisibility = () => {
      const nextVisible = isVisible();
      if (nextVisible === visible) return;
      visible = nextVisible;
      clearTimeout(renderTimer);
      if (visible) {
        renderTimer = setTimeout(() => {
          setIsMapVisible(true);
        }, 300);
      } else {
        setIsMapVisible(false);
      }
    };

    const observer = new MutationObserver(handleModalVisibility);

    observer.observe(modal, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    handleModalVisibility();

    return () => {
      observer.disconnect();
      clearTimeout(renderTimer);
    };
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <style>
        {`
          .ui-widget button {
            font-size: unset !important;
          }
        `}
      </style>
      {isMapVisible && (
        <SiteMap
          fullscreen
          selection="SITES"
          selectedItems={selectedSites}
          onSelectionChange={(selectionState) => {
            restoreTarget.current = null;
            setSelectedSites(new Set(selectionState.set));

          }}
        />
      )}

      {Array.from(selectedSites).map((siteCode) => {
        const datasetId = datasetLookup[siteCode];

        if (!datasetId) return null;

        return (
          <input
            key={siteCode}
            type="checkbox"
            id={siteCode}
            name="datasetid"
            value={datasetId}
            className="child"
            checked
            readOnly
            hidden
          />
        );
      })}
    </div>
  );
}
