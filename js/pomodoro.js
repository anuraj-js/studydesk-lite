// ── State — all declared here but initialised inside DOMContentLoaded ──────
// FIX: Previously cfg, total, and left were set at the TOP LEVEL of the file,
// meaning Storage.getPomodoroSettings() ran the moment the script was parsed —
// before storage.js was guaranteed to have finished executing. Moving every
// initialisation inside DOMContentLoaded eliminates that race condition.
let cfg;
let mode     = 'work';
let total    = 0;
let left     = 0;
let running  = false;
let tick     = null;
let doneWork = 0;
let sessionN = 1;

function modeLabel() { return { work: 'Focus Time', short: 'Short Break', long: 'Long Break' }[mode]; }
function modeSecs() {
  return {
    work:  cfg.work       * 60 + (cfg.workSec  || 0),
    short: cfg.shortBreak * 60 + (cfg.shortSec || 0),
    long:  cfg.longBreak  * 60 + (cfg.longSec  || 0)
  }[mode];
}

function fmt(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function render() {
  document.getElementById('timerDisplay').textContent = fmt(left);
  document.getElementById('modeLabel').textContent    = modeLabel();
  document.getElementById('sessionInfo').textContent  =
    'Session ' + sessionN + ' · ' + Storage.getTodaySessions() + ' completed today';

  document.getElementById('startBtn').innerHTML = running
    ? '<i class="fa-solid fa-pause"></i> Pause'
    : '<i class="fa-solid fa-play"></i> Start';

  const pct = total > 0 ? ((total - left) / total) * 100 : 0;
  document.getElementById('progressBar').style.width = pct + '%';
  document.title = fmt(left) + ' · StudyDesk Lite';
}

function beep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type              = 'sine';
    osc.frequency.value   = 880;
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {}
}

function notify(msg) {
  beep();
  if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
  if (Notification.permission === 'granted') {
    const iconPath = location.pathname.includes('/html/')
      ? '../images/icon-192.png'
      : 'images/icon-192.png';
    new Notification('StudyDesk Lite', { body: msg, icon: iconPath });
  }
}

function onComplete() {
  // NOTE: running and tick are already cleared by the caller before this runs
  if (mode === 'work') {
    doneWork++;
    sessionN++;
    Storage.recordSession();
    notify('Focus session done! Time for a break.');
    mode = (doneWork % cfg.longBreakAfter === 0) ? 'long' : 'short';
  } else {
    notify('Break over! Back to work.');
    mode = 'work';
  }

  total = modeSecs();
  left  = total;
  render();
}

function startPause() {
  if (running) {
    clearInterval(tick);
    running = false;
  } else {
    if (total === 0) {
      alert('Please set a duration greater than 0 seconds before starting.');
      return;
    }
    if (Notification.permission === 'default') Notification.requestPermission();
    running = true;
    tick = setInterval(() => {
      left--;
      // Clear the interval HERE before calling onComplete so it cannot
      // fire again even if the browser batches ticks while backgrounded.
      if (left <= 0) {
        clearInterval(tick);
        running = false;
        onComplete();
        return;
      }
      render();
    }, 1000);
  }
  render();
}

function reset() {
  clearInterval(tick);
  running = false;
  total   = modeSecs();
  left    = total;
  render();
}

function skip() {
  clearInterval(tick);
  running = false;
  left    = 0;
  onComplete();
}

function applySettings() {
  cfg.work           = parseInt(document.getElementById('setWork').value)      || 0;
  cfg.workSec        = parseInt(document.getElementById('setWorkSec').value)   || 0;
  cfg.shortBreak     = parseInt(document.getElementById('setShort').value)     || 0;
  cfg.shortSec       = parseInt(document.getElementById('setShortSec').value)  || 0;
  cfg.longBreak      = parseInt(document.getElementById('setLong').value)      || 0;
  cfg.longSec        = parseInt(document.getElementById('setLongSec').value)   || 0;
  cfg.longBreakAfter = parseInt(document.getElementById('setLongAfter').value) || 4;
  Storage.savePomodoroSettings(cfg);

  // FIX: Also reset doneWork so the long-break cadence restarts from 1 when
  // the user changes longBreakAfter mid-session, preventing the counter from
  // landing on an offset that skips or never triggers the long break.
  doneWork = 0;

  if (!running) { total = modeSecs(); left = total; render(); }
}

document.addEventListener('DOMContentLoaded', () => {
  // FIX: Initialise all state here, after storage.js is guaranteed to be ready.
  cfg   = Storage.getPomodoroSettings();
  total = cfg.work * 60 + (cfg.workSec || 0);
  left  = total;

  document.getElementById('startBtn').addEventListener('click', startPause);
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('skipBtn').addEventListener('click', skip);

  document.getElementById('setWork').value      = cfg.work;
  document.getElementById('setWorkSec').value   = cfg.workSec  || 0;
  document.getElementById('setShort').value      = cfg.shortBreak;
  document.getElementById('setShortSec').value   = cfg.shortSec || 0;
  document.getElementById('setLong').value       = cfg.longBreak;
  document.getElementById('setLongSec').value    = cfg.longSec  || 0;
  document.getElementById('setLongAfter').value  = cfg.longBreakAfter;

  document.getElementById('resetSessions').addEventListener('click', () => {
    if (confirm('Reset today\'s session count?')) {
      localStorage.removeItem('sdl-pomo-date');
      localStorage.removeItem('sdl-pomo-count');
      doneWork = 0;
      sessionN = 1;
      render();
    }
  });

  ['setWork','setWorkSec','setShort','setShortSec','setLong','setLongSec','setLongAfter'].forEach(id => {
    document.getElementById(id).addEventListener('change', applySettings);
  });

  render();
});
