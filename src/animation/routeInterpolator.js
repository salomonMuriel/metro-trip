import along from '@turf/along';
import length from '@turf/length';
import bearing from '@turf/bearing';
import { ROUTE_GEOJSON, STATIONS } from '../config.js';

const routeLine = ROUTE_GEOJSON;
const totalLength = length(routeLine, { units: 'kilometers' });

/**
 * Project a point onto a line segment and return the parameter t (0-1)
 * representing how far along the segment the closest point is.
 */
function projectOntoSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { t: 0, dist: Math.sqrt((px - ax) ** 2 + (py - ay) ** 2) };

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  const dist = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

  return { t, dist };
}

// Pre-compute station distances along the route
const coords = routeLine.geometry.coordinates;

// Pre-compute cumulative distances for each segment
const segLengths = [];
const cumulative = [0];
for (let i = 0; i < coords.length - 1; i++) {
  const segLine = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: [coords[i], coords[i + 1]] },
  };
  const segLen = length(segLine, { units: 'kilometers' });
  segLengths.push(segLen);
  cumulative.push(cumulative[i] + segLen);
}

const stationDistances = STATIONS.map((station) => {
  let minDist = Infinity;
  let bestKm = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];

    // Project station onto this segment
    const { t, dist } = projectOntoSegment(station.lng, station.lat, lng1, lat1, lng2, lat2);

    if (dist < minDist) {
      minDist = dist;
      bestKm = cumulative[i] + t * segLengths[i];
    }
  }

  return bestKm;
});

export { totalLength, stationDistances };

/**
 * Get position and bearing at a given distance along the route
 */
export function getPositionAtDistance(km) {
  const clampedKm = Math.max(0, Math.min(km, totalLength));

  const point = along(routeLine, clampedKm, { units: 'kilometers' });
  const [lng, lat] = point.geometry.coordinates;

  // Compute bearing using a small offset
  const delta = 0.01; // km
  const ahead = along(routeLine, Math.min(clampedKm + delta, totalLength), { units: 'kilometers' });
  const behind = along(routeLine, Math.max(clampedKm - delta, 0), { units: 'kilometers' });

  const b = bearing(
    behind.geometry.coordinates,
    ahead.geometry.coordinates
  );

  return { lng, lat, bearing: b };
}
