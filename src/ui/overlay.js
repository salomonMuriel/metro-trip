import { STATIONS, REAL_TRIP } from '../config.js';

const FIRST_STATION = STATIONS[0].name;
const LAST_STATION = STATIONS[STATIONS.length - 1].name;

function formatTime(minutes) {
  const m = Math.floor(minutes);
  const s = Math.floor((minutes - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateVehicleUI(state, timeEl, kmEl, fillEl) {
  if (!state || !timeEl) return;
  timeEl.textContent = formatTime(state.realMinutes);
  kmEl.textContent = state.km.toFixed(1);
  fillEl.style.width = `${state.progress * 100}%`;
}

export function initOverlay(animator, carAnimator, motoAnimator, cameraController) {
  const overlay = document.getElementById('overlay');
  const btnExpand = document.getElementById('btn-expand');
  const slimBar = document.getElementById('slim-bar');

  // Desktop: always expanded. Mobile: collapsed by default, toggle on tap.
  const isDesktop = window.innerWidth >= 640;
  if (isDesktop) {
    overlay.classList.add('desktop-expanded');
  }

  function togglePanel() {
    overlay.classList.toggle('expanded');
  }

  btnExpand.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });

  slimBar.addEventListener('click', () => {
    if (window.innerWidth < 640) togglePanel();
  });

  const stationNameEl = document.getElementById('station-name');
  const stationLabelEl = document.getElementById('station-label');
  const progressFill = document.getElementById('progress-fill');
  const stationDotsContainer = document.getElementById('station-dots');
  const tripTimeEl = document.getElementById('trip-time');
  const tripKmEl = document.getElementById('trip-km');
  const tripDirectionEl = document.getElementById('trip-direction');
  const tripDestEl = document.getElementById('trip-dest');
  const btnPlay = document.getElementById('btn-play');
  const btnRestart = document.getElementById('btn-restart');
  const iconPause = btnPlay.querySelector('.icon-pause');
  const iconPlay = btnPlay.querySelector('.icon-play');
  const btn1x = document.getElementById('btn-1x');
  const btn2x = document.getElementById('btn-2x');
  const btn4x = document.getElementById('btn-4x');

  const allAnimators = [animator, carAnimator, motoAnimator];

  // Create station dots
  STATIONS.forEach((station, i) => {
    const dot = document.createElement('div');
    dot.className = 'station-dot';
    dot.style.left = `${(i / (STATIONS.length - 1)) * 100}%`;
    dot.title = station.name;
    stationDotsContainer.appendChild(dot);
  });

  const dots = stationDotsContainer.querySelectorAll('.station-dot');

  // Station change
  animator.onStationChange((stationIndex, stopped) => {
    const station = STATIONS[stationIndex];
    stationLabelEl.textContent = stopped ? 'Estacion actual' : 'Proxima estacion';
    stationNameEl.style.opacity = 0;
    setTimeout(() => {
      stationNameEl.textContent = station.name;
      stationNameEl.style.opacity = 1;
    }, 150);
  });

  // Progress
  animator.onProgress((progress, stationIndex, isReverse, cumulativeKm) => {
    progressFill.style.width = `${progress * 100}%`;

    // Cumulative metro stats
    const cumulativeRealMin = (cumulativeKm / REAL_TRIP.totalKm) * REAL_TRIP.totalMinutes;
    tripTimeEl.textContent = formatTime(cumulativeRealMin);
    tripKmEl.textContent = cumulativeKm.toFixed(1);

    tripDirectionEl.innerHTML = isReverse ? '&#8592;' : '&#8594;';
    tripDestEl.textContent = isReverse ? FIRST_STATION : LAST_STATION;

    dots.forEach((dot, i) => {
      dot.classList.remove('current', 'passed');
      if (isReverse) {
        if (i > stationIndex) dot.classList.add('passed');
        else if (i === stationIndex) dot.classList.add('current');
      } else {
        if (i < stationIndex) dot.classList.add('passed');
        else if (i === stationIndex) dot.classList.add('current');
      }
    });

    // Vehicle stats (read state without advancing)
    updateVehicleUI(
      carAnimator.update(0),
      document.getElementById('car-time'),
      document.getElementById('car-km'),
      document.getElementById('car-progress-fill')
    );
    updateVehicleUI(
      motoAnimator.update(0),
      document.getElementById('moto-time'),
      document.getElementById('moto-km'),
      document.getElementById('moto-progress-fill')
    );
  });

  // Restart
  btnRestart.addEventListener('click', () => {
    allAnimators.forEach(a => { a.reset(); a.setPlaying(true); });
    iconPause.style.display = 'inline';
    iconPlay.style.display = 'none';
  });

  // Play/Pause
  btnPlay.addEventListener('click', () => {
    const isPlaying = animator.isPlaying();
    allAnimators.forEach(a => a.setPlaying(!isPlaying));
    iconPause.style.display = isPlaying ? 'none' : 'inline';
    iconPlay.style.display = isPlaying ? 'inline' : 'none';
  });

  // Speed
  const speedBtns = [btn1x, btn2x, btn4x];
  const speeds = [1, 2, 4];
  speedBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      allAnimators.forEach(a => a.setSpeed(speeds[i]));
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // View
  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cameraController.setView(btn.dataset.view);
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}
