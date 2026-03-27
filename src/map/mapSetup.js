import maplibregl from 'maplibre-gl';
import { MAP_CENTER, MAP_ZOOM, MAP_PITCH, MAP_BEARING } from '../config.js';

export function createMap() {
  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '&copy; Esri',
          maxzoom: 17,  // Max tile zoom available; MapLibre will overzoom above this
        },
      },
      layers: [
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite',
          minzoom: 0,
          maxzoom: 22,  // Allow rendering up to high zoom by overzooming
        },
      ],
    },
    center: MAP_CENTER,
    zoom: window.innerWidth < 640 ? 10.5 : 12,
    pitch: 0,
    bearing: 0,
    antialias: true,
    maxPitch: 80,
    maxZoom: 22,
  });

  return map;
}
