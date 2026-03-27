import { MAP_CENTER } from '../config.js';

export const VIEWS = {
  overhead: { zoom: 12, pitch: 0 },
  isometric: { zoom: 19, pitch: 60 },
};

const LERP_SPEED = 0.04;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createCameraController(map) {
  let smoothBearing = null;
  let currentView = 'overhead';
  let smoothZoom = VIEWS.overhead.zoom;
  let smoothPitch = VIEWS.overhead.pitch;
  let userZoomOffset = 0;
  const BEARING_SMOOTHING = 0.08;

  // Listen for user scroll/pinch zoom and capture it as an offset
  map.on('zoom', (e) => {
    if (e.originalEvent) {
      const view = VIEWS[currentView];
      const currentZoom = map.getZoom();
      userZoomOffset = currentZoom - view.zoom;
      userZoomOffset = Math.max(-6, Math.min(4, userZoomOffset));
      smoothZoom = currentZoom;
    }
  });

  function update(state) {
    if (!state) return;

    // Map view: user has full control over pan/zoom/bearing
    if (currentView === 'overhead') return;

    const view = VIEWS[currentView];
    const targetZoom = view.zoom + userZoomOffset;

    smoothZoom = lerp(smoothZoom, targetZoom, LERP_SPEED);
    smoothPitch = lerp(smoothPitch, view.pitch, LERP_SPEED);

    // Smooth the bearing
    if (smoothBearing === null) {
      smoothBearing = state.bearing;
    } else {
      let diff = state.bearing - smoothBearing;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      smoothBearing += diff * BEARING_SMOOTHING;
    }

    map.jumpTo({
      center: [state.lng, state.lat],
      bearing: smoothBearing - 45,
      pitch: smoothPitch,
      zoom: smoothZoom,
    });
  }

  function setView(viewName) {
    if (VIEWS[viewName]) {
      currentView = viewName;
      userZoomOffset = 0;
    }
  }

  function getView() {
    return currentView;
  }

  return { update, setView, getView };
}
