import * as THREE from 'three';
import maplibregl from 'maplibre-gl';
import { MAP_CENTER } from '../config.js';

// Geographic origin for the Three.js scene
const ORIGIN = maplibregl.MercatorCoordinate.fromLngLat(MAP_CENTER, 0);
const SCALE = ORIGIN.meterInMercatorCoordinateUnits();

/**
 * Convert geographic coordinates to Three.js scene position
 */
export function geoToScene(lng, lat, altitudeMeters = 0) {
  const merc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], altitudeMeters);
  return new THREE.Vector3(
    (merc.x - ORIGIN.x) / SCALE,
    -(merc.y - ORIGIN.y) / SCALE,  // Negate Y (Mercator Y is inverted)
    merc.z / SCALE
  );
}

/**
 * Create the MapLibre custom layer that bridges Three.js
 */
export function createCustomLayer(scene) {
  let renderer, camera;

  const customLayer = {
    id: 'three-layer',
    type: 'custom',
    renderingMode: '3d',

    onAdd(map, gl) {
      camera = new THREE.Camera();

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;

      this.map = map;
    },

    render(gl, args) {
      // Build the projection matrix from MapLibre's matrix
      const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);

      // Apply the origin transform: translate to our origin and scale
      const l = new THREE.Matrix4()
        .makeTranslation(ORIGIN.x, ORIGIN.y, ORIGIN.z)
        .scale(new THREE.Vector3(SCALE, -SCALE, SCALE));

      camera.projectionMatrix = m.multiply(l);

      renderer.resetState();
      renderer.render(scene, camera);

      this.map.triggerRepaint();
    },
  };

  return customLayer;
}
