import { ROUTE_GEOJSON, ROUTE_LINE_COLOR } from '../config.js';

export function addRouteLayer(map) {
  map.addSource('route', {
    type: 'geojson',
    data: ROUTE_GEOJSON,
  });

  // Glow under-layer
  map.addLayer({
    id: 'route-glow',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': ROUTE_LINE_COLOR,
      'line-width': 16,
      'line-opacity': 0.35,
      'line-blur': 8,
    },
  });

  // Main route line
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': ROUTE_LINE_COLOR,
      'line-width': 5,
      'line-opacity': 0.9,
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  });
}
