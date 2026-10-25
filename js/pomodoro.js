// ── State — all declared here but initialised inside DOMContentLoaded ──────
let cfg;
let mode       = 'work';
let total      = 0;
let left       = 0;
let running    = false;
let tick       = null;
let doneWork   = 0;
let beepInterval = null;

let endTime    = null;
let pausedLeft = null;

const DEFAULT_TITLE = 'Pomodoro · StudyDesk Lite';

// Audio element for the alarm sound
const alarmAudio = new Audio('../sound.mp3');
alarmAudio.loop = true;

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
  document.getElementById('sessionInfo').textContent = Storage.getTodaySessions() + ' focus sessions completed today';

  document.getElementById('startBtn').innerHTML = running
    ? '<i class="fa-solid fa-pause"></i> Pause'
    : '<i class="fa-solid fa-play"></i> Start';

  const pct = total > 0 ? ((total - left) / total) * 100 : 0;
  document.getElementById('progressBar').style.width = pct + '%';
  // Note: document.title is no longer updated here. It only updates when the timer is actively running.
}

function notify(msg) {
  alarmAudio.currentTime = 0;
  alarmAudio.play().catch(() => {});

  if (navigator.vibrate) {
    beepInterval = setInterval(() => {
      navigator.vibrate([300, 100, 300]);
    }, 2000);
  }

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0;
    background:rgba(0,0,0,0.75);
    backdrop-filter:blur(6px);
    -webkit-backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center;
    z-index:9999; padding:2rem;
    animation:fadeIn 0.2s ease;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background:var(--surface);
    border:1px solid var(--border);
    border-radius:1.25rem;
    padding:2.5rem 2rem;
    text-align:center;
    max-width:320px;
    width:100%;
    box-shadow:0 25px 60px rgba(0,0,0,0.5);
    animation:slideUp 0.25s ease;
  `;

  box.innerHTML = `
    <style>
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes slideUp { from { transform:translateY(30px); opacity:0 } to { transform:translateY(0); opacity:1 } }
      @keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.15) } }
      #stopAlarmBtn:hover { filter:brightness(1.15); transform:scale(1.02); }
      #stopAlarmBtn:active { transform:scale(0.97); }
    </style>

    <div style="
      width:70px; height:70px;
      background:var(--accent);
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      margin:0 auto 1.25rem;
      animation:pulse 1.2s ease infinite;
      box-shadow:0 0 0 12px rgba(59,130,246,0.15);
    ">
      <i class="fa-solid fa-bell" style="font-size:1.75rem; color:#fff;"></i>
    </div>

    <div style="
      font-size:0.75rem;
      font-weight:600;
      letter-spacing:0.1em;
      text-transform:uppercase;
      color:var(--accent);
      margin-bottom:0.5rem;
    ">StudyDesk Lite</div>

    <div style="
      font-size:1.15rem;
      font-weight:700;
      color:var(--text);
      margin-bottom:0.4rem;
      line-height:1.4;
    ">${msg}</div>

    <div style="
      font-size:0.82rem;
      color:var(--text-muted);
      margin-bottom:1.75rem;
    ">Tap below to stop the timer.</div>

    <button id="stopAlarmBtn" style="
      width:100%;
      padding:0.85rem;
      background:var(--accent);
      color:#fff;
      border:none;
      border-radius:0.75rem;
      font-size:1rem;
      font-weight:700;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:0.5rem;
      transition:filter 0.15s, transform 0.15s;
      box-shadow:0 4px 15px rgba(59,130,246,0.35);
    ">
      <i class="fa-solid fa-stop"></i> Stop Timer
    </button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById('stopAlarmBtn').addEventListener('click', () => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    clearInterval(beepInterval);
    beepInterval = null;
    document.body.removeChild(overlay);
  });
}

function onComplete() {
  if (mode === 'work') {
    doneWork++;
    Storage.recordSession();
    notify('Focus session done! Time for a break.');
    mode = (doneWork % cfg.longBreakAfter === 0) ? 'long' : 'short';
  } else {
    notify('Break over! Back to work.');
    mode = 'work';
  }

  total      = modeSecs();
  left       = total;
  endTime    = null;
  pausedLeft = null;
  running    = false;
  
  // Revert the title when the timer finishes
  document.title = DEFAULT_TITLE; 
  render();
}

function startPause() {
  if (running) {
    clearInterval(tick);
    running    = false;
    pausedLeft = left;
    
    // Revert the title when paused
    document.title = DEFAULT_TITLE;
  } else {
    if (total === 0) {
      alert('Please set a duration greater than 0 seconds before starting.');
      return;
    }

    const secondsToRun = pausedLeft !== null ? pausedLeft : total;
    left       = secondsToRun;
    pausedLeft = null;
    endTime    = Date.now() + secondsToRun * 1000;
    running    = true;

    tick = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      left = remaining;

      if (remaining <= 0) {
        clearInterval(tick);
        running = false;
        onComplete();
        return;
      }
      
      // Only update the title while the timer is actively running
      document.title = fmt(left) + ' · StudyDesk Lite';
      render();
    }, 250);
  }
  render();
}

function reset() {
  clearInterval(tick);
  running    = false;
  total      = modeSecs();
  left       = total;
  endTime    = null;
  pausedLeft = null;
  
  // Revert the title when reset
  document.title = DEFAULT_TITLE;
  render();
}

function skip() {
  clearInterval(tick);
  running = false;

  // Silently advance mode, no dialog, no alarm
  if (mode === 'work') {
    doneWork++;
    Storage.recordSession();
    mode = (doneWork % cfg.longBreakAfter === 0) ? 'long' : 'short';
  } else {
    mode = 'work';
  }

  total      = modeSecs();
  left       = total;
  endTime    = null;
  pausedLeft = null;
  
  // Revert the title when skipped
  document.title = DEFAULT_TITLE;
  render();
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

  if (!running) {
    total      = modeSecs();
    left       = total;
    pausedLeft = null;
    endTime    = null;
    render();
  }
}

// ── Leave Warning Logic ──
// This triggers ONLY when the timer is running and the user tries to close, refresh, or navigate.
window.addEventListener('beforeunload', (e) => {
  if (running) {
    // Modern browsers ignore custom messages, but this is the required standard to trigger the popup
    e.preventDefault();
    e.returnValue = ''; // Legacy fallback for browsers lacking preventDefault support
  }
});

document.addEventListener('DOMContentLoaded', () => {
  cfg      = Storage.getPomodoroSettings();
  doneWork = Storage.getTodaySessions();
  total    = cfg.work * 60 + (cfg.workSec || 0);
  left     = total;

  document.getElementById('startBtn').addEventListener('click', startPause);
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('skipBtn').addEventListener('click', skip);

  document.getElementById('setWork').value      = cfg.work;
  document.getElementById('setWorkSec').value   = cfg.workSec  || 0;
  document.getElementById('setShort').value     = cfg.shortBreak;
  document.getElementById('setShortSec').value  = cfg.shortSec || 0;
  document.getElementById('setLong').value      = cfg.longBreak;
  document.getElementById('setLongSec').value   = cfg.longSec  || 0;
  document.getElementById('setLongAfter').value = cfg.longBreakAfter;

  document.getElementById('resetSessions').addEventListener('click', () => {
    if (confirm('Reset today\'s session count?')) {
      localStorage.removeItem('sdl-pomo-date');
      localStorage.removeItem('sdl-pomo-count');
      doneWork = 0;
      location.reload();
    }
  });

  ['setWork','setWorkSec','setShort','setShortSec','setLong','setLongSec','setLongAfter'].forEach(id => {
    document.getElementById(id).addEventListener('change', applySettings);
  });

  render();
});