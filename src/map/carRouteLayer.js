import { CAR_ROUTE_GEOJSON } from '../config.js';

export function addCarRouteLayer(map) {
  map.addSource('car-route', {
    type: 'geojson',
    data: CAR_ROUTE_GEOJSON,
  });

  // Glow
  map.addLayer({
    id: 'car-route-glow',
    type: 'line',
    source: 'car-route',
    paint: {
      'line-color': '#FF9F1C',
      'line-width': 12,
      'line-opacity': 0.25,
      'line-blur': 6,
    },
  });

  // Main line
  map.addLayer({
    id: 'car-route-line',
    type: 'line',
    source: 'car-route',
    paint: {
      'line-color': '#FF9F1C',
      'line-width': 4,
      'line-opacity': 0.8,
      'line-dasharray': [2, 2],
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  });
}
