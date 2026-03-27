import * as THREE from 'three';
import { STATIONS, VIADUCT_HEIGHT } from '../config.js';
import { geoToScene } from './customLayer.js';

// Scene coords: x=east, y=north, z=up
const CANOPY_HEIGHT = 9;       // meters above platform (train is ~4.5m tall)
const PLATFORM_THICKNESS = 0.6;

export function createStationPlatforms(scene) {
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 0.5,
    metalness: 0.1,
  });

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.3,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xE63946,
    roughness: 0.3,
    metalness: 0.4,
  });

  const colMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccee,
    roughness: 0.05,
    metalness: 0.8,
    transparent: true,
    opacity: 0.3,
  });

  STATIONS.forEach((station) => {
    const pos = geoToScene(station.lng, station.lat, VIADUCT_HEIGHT);
    const group = new THREE.Group();

    const len = station.length;   // Real length from polygon data
    const wid = station.width;    // Real width from polygon data

    // Orientation: degrees from north, convert to scene rotation around z
    // In our scene x=east, y=north, so bearing 0 (north) = along +y = rotation.z = 0
    const rotZ = -(station.orientation * Math.PI) / 180;

    // --- Platform slab ---
    const platGeom = new THREE.BoxGeometry(len, wid, PLATFORM_THICKNESS);
    const plat = new THREE.Mesh(platGeom, platformMat);
    plat.position.z = PLATFORM_THICKNESS / 2;
    group.add(plat);

    // --- Canopy roof ---
    const canopyGeom = new THREE.BoxGeometry(len - 4, wid + 3, 0.35);
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.z = CANOPY_HEIGHT;
    group.add(canopy);

    // --- Glass wind barriers on canopy edges ---
    for (const side of [-1, 1]) {
      const glassGeom = new THREE.BoxGeometry(len - 8, 0.15, CANOPY_HEIGHT * 0.6);
      const glass = new THREE.Mesh(glassGeom, glassMat);
      glass.position.set(0, side * (wid / 2 + 1), CANOPY_HEIGHT * 0.35);
      group.add(glass);
    }

    // --- Support columns (spaced along length) ---
    const numCols = Math.max(4, Math.round(len / 30));
    const colGeom = new THREE.CylinderGeometry(0.35, 0.35, CANOPY_HEIGHT, 6);
    const colSpacing = (len - 8) / (numCols - 1);
    const startX = -(len - 8) / 2;

    for (let i = 0; i < numCols; i++) {
      for (const side of [-1, 1]) {
        const col = new THREE.Mesh(colGeom, colMat);
        col.position.set(
          startX + i * colSpacing,
          side * (wid / 3),
          CANOPY_HEIGHT / 2
        );
        col.rotation.x = Math.PI / 2; // Stand upright along z
        group.add(col);
      }
    }

    // --- Red accent strips along platform edges ---
    for (const side of [-1, 1]) {
      const stripGeom = new THREE.BoxGeometry(len - 2, 0.6, 0.12);
      const strip = new THREE.Mesh(stripGeom, accentMat);
      strip.position.set(0, side * (wid / 2 - 1.5), PLATFORM_THICKNESS + 0.06);
      group.add(strip);
    }

    // --- Yellow safety line ---
    const safetyMat = new THREE.MeshStandardMaterial({ color: 0xF5C518, roughness: 0.4 });
    for (const side of [-1, 1]) {
      const safetyGeom = new THREE.BoxGeometry(len - 2, 0.2, 0.05);
      const safety = new THREE.Mesh(safetyGeom, safetyMat);
      safety.position.set(0, side * (wid / 2 - 3), PLATFORM_THICKNESS + 0.03);
      group.add(safety);
    }

    // Position and rotate the whole group
    group.position.copy(pos);
    group.rotation.z = rotZ;
    scene.add(group);
  });
}
