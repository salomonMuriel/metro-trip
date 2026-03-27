import maplibregl from 'maplibre-gl';
import { STATIONS } from '../config.js';

const LABEL_ZOOM_THRESHOLD = 14;

export function addStationMarkers(map) {
  const labelMarkers = [];

  STATIONS.forEach((station, i) => {
    // Dot marker (always visible)
    const dotEl = document.createElement('div');
    dotEl.className = 'station-marker-dot';

    new maplibregl.Marker({ element: dotEl })
      .setLngLat([station.lng, station.lat])
      .addTo(map);

    // Label marker (visibility controlled)
    const labelEl = document.createElement('div');
    labelEl.className = 'station-marker';
    labelEl.textContent = station.name;
    labelEl.style.display = 'none';

    const marker = new maplibregl.Marker({ element: labelEl, offset: [0, -18] })
      .setLngLat([station.lng, station.lat])
      .addTo(map);

    labelMarkers.push({ el: labelEl, index: i });
  });

  let currentStationIndex = 0;

  function updateLabels() {
    const isMobile = window.innerWidth < 640;

    if (!isMobile) {
      labelMarkers.forEach(({ el }) => { el.style.display = ''; });
      return;
    }

    const zoom = map.getZoom();
    const showAll = zoom >= LABEL_ZOOM_THRESHOLD;

    labelMarkers.forEach(({ el, index }) => {
      el.style.display = (showAll || index === currentStationIndex) ? '' : 'none';
    });
  }

  map.on('zoom', updateLabels);
  updateLabels();

  return {
    setCurrentStation(index) {
      currentStationIndex = index;
      updateLabels();
    },
  };
}
