import React, { useEffect, useState } from 'react';

import SiteMap from '../lib_components/components/SiteMap/SiteMap';

export default function SampleSiteMap() {
  const siteCodes = window.sampleSites || [];
  const [manualLocationData, setManualLocationData] = useState([]);

  useEffect(() => {
    Promise.all(
      siteCodes.map((siteCode) => fetch(`https://data.neonscience.org/api/v0/locations/${siteCode}`)
        .then((response) => response.json())
        .then((response) => {
          const site = response.data;
          const stateProperty = site.locationProperties.find(
            (property) => property.locationPropertyName === 'Value for State Abbreviation',
          );

          return {
            manualLocationType: 'PROTOTYPE_SITE',
            domain: site.domainCode,
            state: stateProperty,
            siteCode: site.siteCode,
            siteName: site.locationDescription,
            latitude: site.locationDecimalLatitude,
            longitude: site.locationDecimalLongitude,
          };
        })),
    ).then((sites) => {
      setManualLocationData(sites);
    });
  }, []);

  if (!manualLocationData.length) {
    return null;
  }

  return (
    <div style={{ width: '100%' }}>
      <SiteMap
        manualLocationData={manualLocationData}
        view="split"
        aspectRatio={0.5}
      />
    </div>
  );
}
