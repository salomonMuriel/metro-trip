import { ANIMATION, STATIONS } from '../config.js';
import { totalLength, stationDistances, getPositionAtDistance } from './routeInterpolator.js';

const { totalDuration, stationPause } = ANIMATION;

// One-way trip timing
const totalPauseTime = stationPause * STATIONS.length;
const travelTime = totalDuration - totalPauseTime;
const travelSpeed = totalLength / travelTime; // km per second

// Full round-trip = forward + reverse, each taking totalDuration
const roundTripDuration = totalDuration * 2;

// Station distances for the reverse leg (reversed order)
const reverseStationDistances = stationDistances.map(d => totalLength - d).reverse();

export function createTrainAnimator() {
  let elapsed = 0;
  let playing = true;
  let speedMultiplier = 1;
  let currentStationIndex = -1;
  let onStationChange = null;
  let onProgress = null;

  function computeDistance(legElapsed, legStationDistances) {
    let timeRemaining = legElapsed;
    let distanceTraveled = 0;
    let atStation = -1;
    let allStationsVisited = true;

    for (let i = 0; i < legStationDistances.length; i++) {
      const stationDist = legStationDistances[i];
      const distToStation = stationDist - distanceTraveled;
      const timeToStation = distToStation / travelSpeed;

      if (timeRemaining < timeToStation) {
        distanceTraveled += timeRemaining * travelSpeed;
        allStationsVisited = false;
        break;
      }

      timeRemaining -= timeToStation;
      distanceTraveled = stationDist;

      if (timeRemaining < stationPause) {
        atStation = i;
        allStationsVisited = false;
        break;
      }
      timeRemaining -= stationPause;
    }

    // After all stations visited, travel remaining distance to end of route
    if (allStationsVisited && timeRemaining > 0) {
      distanceTraveled += timeRemaining * travelSpeed;
    }

    return { distanceTraveled: Math.min(distanceTraveled, totalLength), atStation };
  }

  function getState(dt) {
    if (!playing) return null;

    elapsed += dt * speedMultiplier;

    // Loop the round trip
    if (elapsed >= roundTripDuration) {
      elapsed = elapsed % roundTripDuration;
    }

    const isReverse = elapsed >= totalDuration;
    const legElapsed = isReverse ? elapsed - totalDuration : elapsed;

    let distanceTraveled, atStation, stationsOrder;

    if (!isReverse) {
      // Forward leg
      stationsOrder = stationDistances;
      const result = computeDistance(legElapsed, stationDistances);
      distanceTraveled = result.distanceTraveled;
      atStation = result.atStation;
    } else {
      // Reverse leg — compute distance along the reverse direction
      const result = computeDistance(legElapsed, reverseStationDistances);
      // Convert reverse distance back to forward distance
      distanceTraveled = totalLength - result.distanceTraveled;
      atStation = result.atStation >= 0 ? (STATIONS.length - 1 - result.atStation) : -1;
    }

    distanceTraveled = Math.max(0, Math.min(distanceTraveled, totalLength));

    // Get geographic position
    const pos = getPositionAtDistance(distanceTraveled);

    // Flip bearing when going in reverse
    let bearing = pos.bearing;
    if (isReverse) {
      bearing = (bearing + 180) % 360;
      if (bearing > 180) bearing -= 360;
    }

    // Track station changes
    const nearestStation = findNearestStation(distanceTraveled);
    if (nearestStation !== currentStationIndex) {
      currentStationIndex = nearestStation;
      if (onStationChange) onStationChange(currentStationIndex, atStation >= 0);
    }

    // Progress on current leg: 0->1 forward, 1->0 reverse
    const progress = distanceTraveled / totalLength;

    // Cumulative: total km and real-world time across all legs
    const completedLegs = Math.floor(elapsed / totalDuration);
    const cumulativeKm = completedLegs * totalLength +
      (isReverse ? totalLength - distanceTraveled : distanceTraveled);

    if (onProgress) onProgress(progress, currentStationIndex, isReverse, cumulativeKm);

    return {
      lng: pos.lng,
      lat: pos.lat,
      bearing,
      distance: distanceTraveled,
      progress,
      cumulativeKm,
      atStation,
      stationIndex: currentStationIndex,
      isReverse,
    };
  }

  function findNearestStation(distance) {
    let minDiff = Infinity;
    let nearest = 0;
    for (let i = 0; i < stationDistances.length; i++) {
      const diff = Math.abs(stationDistances[i] - distance);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = i;
      }
    }
    return nearest;
  }

  return {
    getState,
    setPlaying(p) { playing = p; },
    isPlaying() { return playing; },
    setSpeed(s) { speedMultiplier = s; },
    onStationChange(cb) { onStationChange = cb; },
    onProgress(cb) { onProgress = cb; },
    reset() { elapsed = 0; currentStationIndex = -1; },
  };
}
