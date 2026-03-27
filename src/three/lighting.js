import * as THREE from 'three';

export function addLighting(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.9);
  directional.position.set(-100, 300, 200);
  scene.add(directional);

  const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.4);
  scene.add(hemisphere);
}
