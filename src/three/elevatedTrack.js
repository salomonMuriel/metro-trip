import * as THREE from 'three';
import { ROUTE_COORDINATES, VIADUCT_HEIGHT, VIADUCT_COLOR } from '../config.js';
import { geoToScene } from './customLayer.js';

// In our scene: x=east, y=north, z=up
const DECK_WIDTH = 8;       // meters (cross-track, along y after rotation)
const DECK_THICKNESS = 1;   // meters (vertical, along z)
const PILLAR_RADIUS = 0.6;
const PILLAR_SPACING = 80;  // meters between pillars

export function createElevatedTrack(scene) {
  const deckMat = new THREE.MeshStandardMaterial({
    color: VIADUCT_COLOR,
    roughness: 0.7,
    metalness: 0.1,
  });

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0xa0a0a0,
    roughness: 0.8,
    metalness: 0.05,
  });

  // Convert route coordinates to scene positions
  const deckPoints = ROUTE_COORDINATES.map(
    ([lng, lat]) => geoToScene(lng, lat, VIADUCT_HEIGHT)
  );
  const groundPoints = ROUTE_COORDINATES.map(
    ([lng, lat]) => geoToScene(lng, lat, 0)
  );

  const deckGroup = new THREE.Group();

  // Pillar geometry: cylinder along z (rotate x by PI/2 to stand upright)
  const pillarGeom = new THREE.CylinderGeometry(PILLAR_RADIUS, PILLAR_RADIUS * 1.2, VIADUCT_HEIGHT, 8);

  let distSinceLastPillar = 0;

  for (let i = 0; i < deckPoints.length - 1; i++) {
    const p1 = deckPoints[i];
    const p2 = deckPoints[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLength = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Deck segment: x=track length, y=width, z=thickness
    const segGeom = new THREE.BoxGeometry(segLength, DECK_WIDTH, DECK_THICKNESS);
    const seg = new THREE.Mesh(segGeom, deckMat);
    seg.position.set(
      (p1.x + p2.x) / 2,
      (p1.y + p2.y) / 2,
      (p1.z + p2.z) / 2
    );
    seg.rotation.z = angle; // Rotate in horizontal plane
    deckGroup.add(seg);

    // Rail lines on top of deck
    const railGeom = new THREE.BoxGeometry(segLength, 0.2, 0.15);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
    for (const offset of [-1.2, 1.2]) {
      const rail = new THREE.Mesh(railGeom, railMat);
      rail.position.set(
        (p1.x + p2.x) / 2 + Math.sin(angle) * offset,
        (p1.y + p2.y) / 2 - Math.cos(angle) * offset,
        (p1.z + p2.z) / 2 + DECK_THICKNESS / 2 + 0.075
      );
      rail.rotation.z = angle;
      deckGroup.add(rail);
    }

    // Side barriers along deck edges
    for (const side of [-1, 1]) {
      const barrierGeom = new THREE.BoxGeometry(segLength, 0.15, 0.8);
      const barrierMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.6 });
      const barrier = new THREE.Mesh(barrierGeom, barrierMat);
      barrier.position.set(
        (p1.x + p2.x) / 2 + Math.sin(angle) * (DECK_WIDTH / 2 * side),
        (p1.y + p2.y) / 2 - Math.cos(angle) * (DECK_WIDTH / 2 * side),
        (p1.z + p2.z) / 2 + DECK_THICKNESS / 2 + 0.4
      );
      barrier.rotation.z = angle;
      deckGroup.add(barrier);
    }

    // Pillars at regular intervals
    distSinceLastPillar += segLength;
    if (distSinceLastPillar >= PILLAR_SPACING || i === 0) {
      distSinceLastPillar = 0;
      const gp = groundPoints[i];
      const dp = deckPoints[i];

      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(gp.x, gp.y, (gp.z + dp.z) / 2);
      // CylinderGeometry defaults along y-axis; rotate to stand along z
      pillar.rotation.x = Math.PI / 2;
      deckGroup.add(pillar);
    }
  }

  scene.add(deckGroup);
}
