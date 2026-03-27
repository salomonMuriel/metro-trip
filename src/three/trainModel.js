import * as THREE from 'three';

// Scene coords: x=track direction, y=cross-track, z=up
const CAR_LENGTH = 20;
const CAR_WIDTH = 3.2;
const CAR_HEIGHT = 3.8;
const CAR_GAP = 1.2;
const NUM_CARS = 3;

// Bogota Metro colors from reference images
const RED_BODY = 0xD42027;
const WHITE_SKIRT = 0xF0F0F0;
const YELLOW_STRIPE = 0xF5C518;
const DARK_NOSE = 0x2A2A2A;
const DARK_ROOF = 0x1A1A1A;
const WINDOW_DARK = 0x1C2333;
const BOGIE_COLOR = 0x333333;

// Vertical zones (z positions)
const SKIRT_HEIGHT = 0.9;       // White lower section
const STRIPE_HEIGHT = 0.12;     // Yellow accent stripe
const RED_START = SKIRT_HEIGHT + STRIPE_HEIGHT;
const RED_HEIGHT = CAR_HEIGHT - RED_START;
const WINDOW_BOTTOM = 1.6;     // From ground
const WINDOW_HEIGHT = 1.3;
const ROOF_RADIUS_APPROX = 0.35;

function createMiddleCar() {
  const group = new THREE.Group();

  // --- White lower skirt ---
  const skirtGeom = new THREE.BoxGeometry(CAR_LENGTH, CAR_WIDTH, SKIRT_HEIGHT);
  const skirtMat = new THREE.MeshStandardMaterial({ color: WHITE_SKIRT, roughness: 0.5, metalness: 0.1 });
  const skirt = new THREE.Mesh(skirtGeom, skirtMat);
  skirt.position.z = SKIRT_HEIGHT / 2;
  group.add(skirt);

  // --- Yellow accent stripe ---
  for (const side of [1, -1]) {
    const stripeGeom = new THREE.BoxGeometry(CAR_LENGTH, 0.05, STRIPE_HEIGHT);
    const stripeMat = new THREE.MeshStandardMaterial({ color: YELLOW_STRIPE, roughness: 0.3, metalness: 0.4 });
    const stripe = new THREE.Mesh(stripeGeom, stripeMat);
    stripe.position.set(0, side * (CAR_WIDTH / 2 + 0.02), SKIRT_HEIGHT + STRIPE_HEIGHT / 2);
    group.add(stripe);
  }

  // --- Red upper body ---
  const redGeom = new THREE.BoxGeometry(CAR_LENGTH, CAR_WIDTH, RED_HEIGHT);
  const redMat = new THREE.MeshStandardMaterial({ color: RED_BODY, roughness: 0.35, metalness: 0.2 });
  const redBody = new THREE.Mesh(redGeom, redMat);
  redBody.position.z = RED_START + RED_HEIGHT / 2;
  group.add(redBody);

  // --- Dark rounded roof ---
  const roofGeom = new THREE.BoxGeometry(CAR_LENGTH - 0.2, CAR_WIDTH - 0.3, ROOF_RADIUS_APPROX);
  const roofMat = new THREE.MeshStandardMaterial({ color: DARK_ROOF, roughness: 0.6, metalness: 0.15 });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.z = CAR_HEIGHT + ROOF_RADIUS_APPROX / 2;
  group.add(roof);

  // Curved roof cap (half-cylinder for rounded top)
  const roofCurveGeom = new THREE.CylinderGeometry(
    CAR_WIDTH / 2 - 0.15, CAR_WIDTH / 2 - 0.15,
    CAR_LENGTH - 0.4, 12, 1, false, 0, Math.PI
  );
  const roofCurve = new THREE.Mesh(roofCurveGeom, roofMat);
  roofCurve.rotation.z = Math.PI / 2;   // Align along x (track)
  roofCurve.rotation.x = Math.PI / 2;   // Flatten the half-pipe
  roofCurve.position.z = CAR_HEIGHT + ROOF_RADIUS_APPROX * 0.3;
  roofCurve.scale.z = 0.25;             // Flatten it into a subtle curve
  group.add(roofCurve);

  // --- Windows (individual rectangles on both sides) ---
  const windowMat = new THREE.MeshStandardMaterial({
    color: WINDOW_DARK,
    roughness: 0.05,
    metalness: 0.9,
    emissive: 0x1a3355,
    emissiveIntensity: 0.12,
  });

  const numWindows = 8;
  const windowWidth = 1.4;
  const windowSpacing = (CAR_LENGTH - 2) / numWindows;
  const windowStartX = -(CAR_LENGTH - 2) / 2 + windowSpacing / 2;

  for (let i = 0; i < numWindows; i++) {
    const wx = windowStartX + i * windowSpacing;
    for (const side of [1, -1]) {
      const winGeom = new THREE.BoxGeometry(windowWidth, 0.08, WINDOW_HEIGHT);
      const win = new THREE.Mesh(winGeom, windowMat);
      win.position.set(wx, side * (CAR_WIDTH / 2 + 0.04), WINDOW_BOTTOM + WINDOW_HEIGHT / 2);
      group.add(win);
    }
  }

  // --- Door recesses (darker gaps between some windows) ---
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.3 });
  const doorPositions = [-6, -2, 2, 6]; // 4 doors per side
  doorPositions.forEach(dx => {
    for (const side of [1, -1]) {
      const doorGeom = new THREE.BoxGeometry(1.6, 0.06, 2.2);
      const door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(dx, side * (CAR_WIDTH / 2 + 0.03), SKIRT_HEIGHT + 1.1);
      group.add(door);
    }
  });

  // --- Front/back connector faces ---
  const endMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
  const endGeom = new THREE.BoxGeometry(0.1, CAR_WIDTH - 0.6, CAR_HEIGHT - 0.3);
  for (const xDir of [1, -1]) {
    const end = new THREE.Mesh(endGeom, endMat);
    end.position.set(xDir * (CAR_LENGTH / 2 + 0.04), 0, CAR_HEIGHT / 2);
    group.add(end);
  }

  // --- Undercarriage / bogies ---
  addBogies(group);

  return group;
}

function createHeadCar(isFront) {
  const group = new THREE.Group();

  // Nose section length
  const NOSE_LEN = 2.5;
  const BODY_LEN = CAR_LENGTH - NOSE_LEN;

  // --- White lower skirt (body section) ---
  const skirtGeom = new THREE.BoxGeometry(BODY_LEN, CAR_WIDTH, SKIRT_HEIGHT);
  const skirtMat = new THREE.MeshStandardMaterial({ color: WHITE_SKIRT, roughness: 0.5, metalness: 0.1 });
  const skirt = new THREE.Mesh(skirtGeom, skirtMat);
  skirt.position.set(-NOSE_LEN / 2, 0, SKIRT_HEIGHT / 2);
  group.add(skirt);

  // --- Yellow stripe on body section ---
  for (const side of [1, -1]) {
    const stripeGeom = new THREE.BoxGeometry(BODY_LEN, 0.05, STRIPE_HEIGHT);
    const stripeMat = new THREE.MeshStandardMaterial({ color: YELLOW_STRIPE, roughness: 0.3, metalness: 0.4 });
    const stripe = new THREE.Mesh(stripeGeom, stripeMat);
    stripe.position.set(-NOSE_LEN / 2, side * (CAR_WIDTH / 2 + 0.02), SKIRT_HEIGHT + STRIPE_HEIGHT / 2);
    group.add(stripe);
  }

  // --- Red upper body (body section) ---
  const redGeom = new THREE.BoxGeometry(BODY_LEN, CAR_WIDTH, RED_HEIGHT);
  const redMat = new THREE.MeshStandardMaterial({ color: RED_BODY, roughness: 0.35, metalness: 0.2 });
  const redBody = new THREE.Mesh(redGeom, redMat);
  redBody.position.set(-NOSE_LEN / 2, 0, RED_START + RED_HEIGHT / 2);
  group.add(redBody);

  // --- Nose section (dark charcoal, tapered) ---
  // Main nose block
  const noseMat = new THREE.MeshStandardMaterial({ color: DARK_NOSE, roughness: 0.3, metalness: 0.4 });
  const noseGeom = new THREE.BoxGeometry(NOSE_LEN, CAR_WIDTH, CAR_HEIGHT);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(BODY_LEN / 2, 0, CAR_HEIGHT / 2);
  group.add(nose);

  // Red diagonal V-stripe on nose (the distinctive Bogota metro feature)
  const vStripeMat = new THREE.MeshStandardMaterial({ color: RED_BODY, roughness: 0.3, metalness: 0.3 });
  // Left diagonal
  for (const side of [1, -1]) {
    const vGeom = new THREE.BoxGeometry(NOSE_LEN - 0.3, 0.06, 0.6);
    const vStripe = new THREE.Mesh(vGeom, vStripeMat);
    vStripe.position.set(BODY_LEN / 2, side * (CAR_WIDTH / 2 + 0.03), CAR_HEIGHT * 0.45);
    // Slight diagonal tilt
    vStripe.rotation.y = side * 0.15;
    group.add(vStripe);

    // Upper red accent on nose sides
    const upperGeom = new THREE.BoxGeometry(NOSE_LEN - 0.5, 0.06, 1.0);
    const upper = new THREE.Mesh(upperGeom, vStripeMat);
    upper.position.set(BODY_LEN / 2, side * (CAR_WIDTH / 2 + 0.03), CAR_HEIGHT * 0.75);
    group.add(upper);
  }

  // Windshield (large dark glass on front face)
  const windshieldMat = new THREE.MeshStandardMaterial({
    color: 0x1a2233,
    roughness: 0.02,
    metalness: 0.95,
    emissive: 0x112244,
    emissiveIntensity: 0.15,
  });
  const windshieldGeom = new THREE.BoxGeometry(0.08, CAR_WIDTH - 1.0, 1.6);
  const windshield = new THREE.Mesh(windshieldGeom, windshieldMat);
  windshield.position.set(CAR_LENGTH / 2 + 0.04, 0, CAR_HEIGHT * 0.65);
  group.add(windshield);

  // Headlights (small white emissive boxes)
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });
  for (const side of [1, -1]) {
    const hlGeom = new THREE.BoxGeometry(0.08, 0.4, 0.2);
    const hl = new THREE.Mesh(hlGeom, headlightMat);
    hl.position.set(CAR_LENGTH / 2 + 0.04, side * 1.0, CAR_HEIGHT * 0.52);
    group.add(hl);
  }

  // --- Dark roof ---
  const roofMat = new THREE.MeshStandardMaterial({ color: DARK_ROOF, roughness: 0.6, metalness: 0.15 });
  const roofGeom = new THREE.BoxGeometry(CAR_LENGTH - 0.2, CAR_WIDTH - 0.3, ROOF_RADIUS_APPROX);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.z = CAR_HEIGHT + ROOF_RADIUS_APPROX / 2;
  group.add(roof);

  // Curved roof cap
  const roofCurveGeom = new THREE.CylinderGeometry(
    CAR_WIDTH / 2 - 0.15, CAR_WIDTH / 2 - 0.15,
    CAR_LENGTH - 0.4, 12, 1, false, 0, Math.PI
  );
  const roofCurve = new THREE.Mesh(roofCurveGeom, roofMat);
  roofCurve.rotation.z = Math.PI / 2;
  roofCurve.rotation.x = Math.PI / 2;
  roofCurve.position.z = CAR_HEIGHT + ROOF_RADIUS_APPROX * 0.3;
  roofCurve.scale.z = 0.25;
  group.add(roofCurve);

  // --- Windows on body section ---
  const windowMat = new THREE.MeshStandardMaterial({
    color: WINDOW_DARK,
    roughness: 0.05,
    metalness: 0.9,
    emissive: 0x1a3355,
    emissiveIntensity: 0.12,
  });
  const numWindows = 6;
  const windowWidth = 1.4;
  const bodyStart = -CAR_LENGTH / 2 + 1;
  const windowSpacing = (BODY_LEN - 2) / numWindows;

  for (let i = 0; i < numWindows; i++) {
    const wx = bodyStart + i * windowSpacing + windowSpacing / 2;
    for (const side of [1, -1]) {
      const winGeom = new THREE.BoxGeometry(windowWidth, 0.08, WINDOW_HEIGHT);
      const win = new THREE.Mesh(winGeom, windowMat);
      win.position.set(wx, side * (CAR_WIDTH / 2 + 0.04), WINDOW_BOTTOM + WINDOW_HEIGHT / 2);
      group.add(win);
    }
  }

  // --- Door recesses ---
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.3 });
  const doorPositions = [-6, -2, 2];
  doorPositions.forEach(dx => {
    for (const side of [1, -1]) {
      const doorGeom = new THREE.BoxGeometry(1.6, 0.06, 2.2);
      const door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(dx, side * (CAR_WIDTH / 2 + 0.03), SKIRT_HEIGHT + 1.1);
      group.add(door);
    }
  });

  // --- Rear connector face ---
  const endMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
  const endGeom = new THREE.BoxGeometry(0.1, CAR_WIDTH - 0.6, CAR_HEIGHT - 0.3);
  const end = new THREE.Mesh(endGeom, endMat);
  end.position.set(-CAR_LENGTH / 2 - 0.04, 0, CAR_HEIGHT / 2);
  group.add(end);

  // --- Bogies ---
  addBogies(group);

  // Flip if this is the rear head car (nose faces backward)
  if (!isFront) {
    group.rotation.z = Math.PI; // Rotate 180 so nose faces the other way
  }

  return group;
}

function addBogies(group) {
  const bogieMat = new THREE.MeshStandardMaterial({ color: BOGIE_COLOR, roughness: 0.7, metalness: 0.3 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.5 });

  // Two bogies per car
  for (const bx of [-5.5, 5.5]) {
    // Bogie frame
    const frameGeom = new THREE.BoxGeometry(3.5, 2.2, 0.5);
    const frame = new THREE.Mesh(frameGeom, bogieMat);
    frame.position.set(bx, 0, -0.5);
    group.add(frame);

    // Wheels (4 per bogie)
    const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    for (const wx of [-1, 1]) {
      for (const wy of [-1, 1]) {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(bx + wx * 1.0, wy * 1.0, -0.7);
        // Cylinder along y by default, rotate to spin around x
        wheel.rotation.x = Math.PI / 2;
        group.add(wheel);
      }
    }
  }
}

export function createTrain() {
  const train = new THREE.Group();
  const totalSpan = NUM_CARS * CAR_LENGTH + (NUM_CARS - 1) * CAR_GAP;
  const startX = -totalSpan / 2;

  for (let i = 0; i < NUM_CARS; i++) {
    let car;
    if (i === 0) {
      car = createHeadCar(true);    // Front head car (nose forward)
    } else if (i === NUM_CARS - 1) {
      car = createHeadCar(false);   // Rear head car (nose backward)
    } else {
      car = createMiddleCar();
    }
    car.position.x = startX + i * (CAR_LENGTH + CAR_GAP) + CAR_LENGTH / 2;
    train.add(car);
  }

  // Connectors between cars (accordion gangway)
  const connMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6 });
  for (let i = 0; i < NUM_CARS - 1; i++) {
    const connGeom = new THREE.BoxGeometry(CAR_GAP + 0.8, 2.0, 2.8);
    const conn = new THREE.Mesh(connGeom, connMat);
    conn.position.x = startX + (i + 1) * CAR_LENGTH + i * CAR_GAP + CAR_GAP / 2;
    conn.position.z = 1.8;
    train.add(conn);

    // Bellows texture (ribbed connector look)
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    for (let r = -2; r <= 2; r++) {
      const ribGeom = new THREE.BoxGeometry(0.08, 2.2, 3.0);
      const rib = new THREE.Mesh(ribGeom, ribMat);
      rib.position.x = conn.position.x + r * 0.2;
      rib.position.z = 1.8;
      train.add(rib);
    }
  }

  return train;
}
