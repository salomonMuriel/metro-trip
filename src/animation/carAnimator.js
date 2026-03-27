import along from '@turf/along';
import length from '@turf/length';
import { CAR_ROUTE_GEOJSON, REAL_TRIP, ANIMATION } from '../config.js';

const route = CAR_ROUTE_GEOJSON;
const routeLength = length(route, { units: 'kilometers' });

// 1 animation second = this many real-world minutes
const realMinutesPerAnimSec = REAL_TRIP.totalMinutes / ANIMATION.totalDuration;

/**
 * Create a road vehicle animator for a given speed
 * @param {number} speedKmh - real-world average speed in km/h
 */
export function createRoadAnimator(speedKmh) {
  const kmPerAnimSec = (speedKmh / 60) * realMinutesPerAnimSec;

  let distance = 0;
  let playing = true;
  let speedMultiplier = 1;
  let finished = false;

  function update(dt) {
    if (!playing) return getPosition();

    if (!finished) {
      distance += dt * speedMultiplier * kmPerAnimSec;
      if (distance >= routeLength) {
        distance = routeLength;
        finished = true;
      }
    }

    return getPosition();
  }

  function getPosition() {
    const clamped = Math.min(distance, routeLength);
    const point = along(route, clamped, { units: 'kilometers' });
    const [lng, lat] = point.geometry.coordinates;
    const progress = clamped / routeLength;
    const realMinutes = (clamped / speedKmh) * 60;

    return { lng, lat, progress, km: clamped, realMinutes, finished };
  }

  function reset() {
    distance = 0;
    finished = false;
  }

  return {
    update,
    reset,
    setPlaying(p) { playing = p; },
    setSpeed(s) { speedMultiplier = s; },
  };
}
