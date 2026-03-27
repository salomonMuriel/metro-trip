import * as THREE from 'three';
import { createMap } from './map/mapSetup.js';
import { addRouteLayer } from './map/routeLayer.js';
import { addStationMarkers } from './map/stationMarkers.js';
import { addCarRouteLayer } from './map/carRouteLayer.js';
import { createCustomLayer, geoToScene } from './three/customLayer.js';
import { createTrain } from './three/trainModel.js';
import { addLighting } from './three/lighting.js';
import { createElevatedTrack } from './three/elevatedTrack.js';
import { createStationPlatforms } from './three/stationPlatforms.js';
import { createTrainAnimator } from './animation/trainAnimator.js';
import { createRoadAnimator } from './animation/carAnimator.js';
import { createCameraController } from './animation/cameraController.js';
import { initOverlay } from './ui/overlay.js';
import { VIADUCT_HEIGHT, REAL_TRIP } from './config.js';

function addDotMarker(map, id, color) {
  map.addSource(id, {
    type: 'geojson',
    data: { type: 'Point', coordinates: [0, 0] },
  });
  map.addLayer({
    id: `${id}-glow`,
    type: 'circle',
    source: id,
    paint: {
      'circle-radius': 12,
      'circle-color': color,
      'circle-opacity': 0.3,
      'circle-blur': 0.5,
    },
  });
  map.addLayer({
    id: `${id}-dot`,
    type: 'circle',
    source: id,
    paint: {
      'circle-radius': 6,
      'circle-color': color,
      'circle-opacity': 1,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  });
}

// Initialize map
const map = createMap();

map.on('style.load', () => {
  // Map layers
  addRouteLayer(map);
  addCarRouteLayer(map);
  addStationMarkers(map);

  // Position markers
  addDotMarker(map, 'train-pos', '#E63946');
  addDotMarker(map, 'car-pos', '#FF9F1C');
  addDotMarker(map, 'moto-pos', '#06D6A0');

  // Three.js scene
  const scene = new THREE.Scene();
  addLighting(scene);
  createElevatedTrack(scene);
  createStationPlatforms(scene);

  const train = createTrain();
  scene.add(train);

  const customLayer = createCustomLayer(scene);
  map.addLayer(customLayer);

  // Animators
  const animator = createTrainAnimator();
  const carAnimator = createRoadAnimator(REAL_TRIP.carSpeedKmh);
  const motoAnimator = createRoadAnimator(REAL_TRIP.motoSpeedKmh);
  const camera = createCameraController(map);

  // UI
  initOverlay(animator, carAnimator, motoAnimator, camera);

  // Animation loop
  let lastTime = performance.now();

  function animate() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const state = animator.getState(dt);
    const carState = carAnimator.update(dt);
    const motoState = motoAnimator.update(dt);

    if (state) {
      const trainPos = geoToScene(state.lng, state.lat, VIADUCT_HEIGHT + 1);
      train.position.copy(trainPos);

      const bearingRad = (state.bearing * Math.PI) / 180;
      train.rotation.z = -bearingRad + Math.PI / 2;

      map.getSource('train-pos').setData({
        type: 'Point',
        coordinates: [state.lng, state.lat],
      });

      camera.update(state);
    }

    if (carState) {
      map.getSource('car-pos').setData({
        type: 'Point',
        coordinates: [carState.lng, carState.lat],
      });
    }

    if (motoState) {
      map.getSource('moto-pos').setData({
        type: 'Point',
        coordinates: [motoState.lng, motoState.lat],
      });
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
