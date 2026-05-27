// Import polyfills to support IE11
import 'core-js/es/map';
import 'core-js/es/set';
import 'core-js/es/array';
import 'core-js/es/symbol';
import 'core-js/es/promise';
import 'core-js/es/number/is-integer';
import 'core-js/es/number/is-nan';
import 'core-js/es/number/is-finite';
import 'core-js/es/object/assign';
import 'core-js/es/object/entries';
import 'core-js/es/object/from-entries';
import 'core-js/es/object/values';
import 'core-js/es/string/includes';
import 'core-js/es/string/pad-start';
import 'core-js/es/string/starts-with';

import React from 'react';
import ReactDOM from 'react-dom';
import BiorepoPage from './biorepo_components/BiorepoPage';
import BiorepoHomePageContent from './biorepo_components/BiorepoHomePageContent';
import BiorepoAboutSamplesContent from './biorepo_components/BiorepoAboutSamplesContent';
import BiorepoCollectionsContent from './biorepo_components/BiorepoCollectionsContent';
import BiorepoChecklistsContent from './biorepo_components/BiorepoChecklistsContent';
import BiorepoCollectionPageContent from './biorepo_components/BiorepoCollectionPageContent';
import BiorepoSearchMetrics from './biorepo_components/BiorepoSearchMetrics';
import CollectionTypeSummary from './biorepo_components/CollectionTypeSummary';
import CollectionSearchMap from './biorepo_components/CollectionSearchMap';

const biorepoPageElement = document.getElementById('biorepo-page');
if (biorepoPageElement) {
  ReactDOM.render(<BiorepoPage />, biorepoPageElement);
}

const biorepoHomePageContentElement = document.getElementById('biorepo-home-page-content');
if (biorepoHomePageContentElement) {
  ReactDOM.render(<BiorepoHomePageContent />, biorepoHomePageContentElement);
}

const biorepoAboutSamplesElement = document.getElementById('biorepo-aboutsamples-content');
if (biorepoAboutSamplesElement) {
  ReactDOM.render(<BiorepoAboutSamplesContent />, biorepoAboutSamplesElement);
}

const biorepoCollectionsElement = document.getElementById('biorepo-collections-content');
if (biorepoCollectionsElement) {
  ReactDOM.render(<BiorepoCollectionsContent />, biorepoCollectionsElement);
}

const biorepoChecklistsElement = document.getElementById('biorepo-checklists-content');
if (biorepoChecklistsElement) {
  ReactDOM.render(<BiorepoChecklistsContent />, biorepoChecklistsElement);
}

const biorepoCollectionPageElement = document.getElementById('biorepo-collection-page-content');
if (biorepoCollectionPageElement) {
  ReactDOM.render(<BiorepoCollectionPageContent />, biorepoCollectionPageElement);
}

const biorepoSearchMetricsElement = document.getElementById('biorepo-search-metrics');
if (biorepoSearchMetricsElement) {
  ReactDOM.render(<BiorepoSearchMetrics />, biorepoSearchMetricsElement);
}

const collectionTypeSummaryElement = document.getElementById('biorepo-coll-type');
if (collectionTypeSummaryElement) {
  ReactDOM.render(<CollectionTypeSummary />, collectionTypeSummaryElement);
}

const collectionSearchMapElement = document.getElementById('collection-search-map');
if (collectionSearchMapElement) {
  ReactDOM.render(<CollectionSearchMap />, collectionSearchMapElement);
}
