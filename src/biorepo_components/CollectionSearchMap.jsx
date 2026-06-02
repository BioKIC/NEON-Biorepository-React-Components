import React, { useEffect, useState } from 'react';

import SiteMap from '../lib_components/components/SiteMap/SiteMap';

import biorepoDatasets from '../lib_components/staticJSON/biorepoDatasets.json';

/* global updateChip */

export default function BiorepoSearchMap() {
  const [selectedSites, setSelectedSites] = useState(new Set());
  const [isMapVisible, setIsMapVisible] = useState(false);

  const datasetLookup = Object.fromEntries(
    biorepoDatasets.datasets.map((dataset) => [
      dataset.name,
      dataset.datasetID,
    ]),
  );

  useEffect(() => {
    const modal = document.getElementById('domains-sites-modal');

    if (!modal) return undefined;

    const isVisible = () => window.getComputedStyle(modal).display !== 'none';

    const handleModalVisibility = () => {
      if (isVisible()) {
        setTimeout(() => {
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
          selection="SITES"
          selectedItems={selectedSites}
          onSelectionChange={(selectionState) => {
            setSelectedSites(new Set(selectionState.set));

            setTimeout(() => {
              updateChip();
            }, 0);
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
