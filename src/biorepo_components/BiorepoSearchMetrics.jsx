import React from 'react';

import DataProductAvailability from '../lib_components/components/DataProductAvailability/DataProductAvailability';

export default function BiorepoSearchMetrics() {
  const siteCodes = window.biorepoAvailabilitySiteCodes || [];

  return (
    <div className="biorepo-search-metrics-wrapper">
      <style>
        {`
          .ui-widget .biorepo-search-metrics-wrapper button {
            font-size: unset !important;
          }
        `}
      </style>

      <div style={{ padding: '24px' }}>
        <DataProductAvailability
          siteCodes={siteCodes}
          view="ungrouped"
          sortMethod="sites"
          sortDirection="ASC"
        />
      </div>
    </div>
  );
}
