import maplibregl from 'maplibre-gl';
import { STATIONS } from '../config.js';

export function addStationMarkers(map) {
  STATIONS.forEach((station) => {
    // Dot marker
    const dotEl = document.createElement('div');
    dotEl.className = 'station-marker-dot';

    new maplibregl.Marker({ element: dotEl })
      .setLngLat([station.lng, station.lat])
      .addTo(map);

    // Label marker
    const labelEl = document.createElement('div');
    labelEl.className = 'station-marker';
    labelEl.textContent = station.name;

    new maplibregl.Marker({ element: labelEl, offset: [0, -18] })
      .setLngLat([station.lng, station.lat])
      .addTo(map);
  });
}
