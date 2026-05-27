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
    const localityToggle = document.getElementById('locality');

    if (!localityToggle) return undefined;

    const handleChange = () => {
      if (localityToggle.checked) {
        setTimeout(() => {
          setIsMapVisible(true);
        }, 300);
      } else {
        setIsMapVisible(false);
      }
    };

    localityToggle.addEventListener('change', handleChange);

    handleChange();

    return () => {
      localityToggle.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <div style={{ width: '100%', minHeight: '700px' }}>
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
          style={{
            width: '100%',
            height: '700px',
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
