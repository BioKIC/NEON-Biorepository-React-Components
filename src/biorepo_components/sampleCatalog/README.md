# Sample type browser

`BiorepoCollectionsContent` reads the version-1 public snapshot served by the companion portal branch at `${NEON_CLIENT_ROOT}/neon-react/biorepo_lib/sample-catalog.php`. `BiorepoPage` provides a responsive sidebar portal target on the browse page only. The rest of the portal retains its existing navigation.

Filters and shareable URL state update client-side without refetching. Cards appear alphabetically in batches of ten, with the next batch rendered automatically as the end of the list approaches the viewport. Choices within each facet are OR; facet groups and search terms are AND. Dates are inclusive collection months. Geographic and date conditions must match the same site. Facet counts respond to the other selected filters. Unknown or undated sites remain visible in unfiltered results but are not drawn as known NEON availability.

The shared `NeonContext` supplies site/state/domain reference data. `MapSelectionButton` handles geographic selection and `DataProductAvailability` renders public-record coverage with selection and release delineation disabled. The chart follows the current date/geographic filters. It is not a promise of physical loan availability. CSV and JSON download the full catalog; PDF opens a print layout with a Save as PDF action.

## Validation

- `node --test src/biorepo_components/sampleCatalog/catalog.test.mjs`
- `npx jest src/biorepo_components/__tests__/BiorepoCollectionsContent.jsx --runInBand --coverage=false`
- `npx eslint src/biorepo_components/BiorepoCollectionsContent.jsx src/biorepo_components/sampleCatalog/catalog.js`
- `npx next build` (build only; avoids the machine-specific deployment script)
