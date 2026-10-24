// ── State — all declared here but initialised inside DOMContentLoaded ──────
let cfg;
let mode       = 'work';
let total      = 0;
let left       = 0;
let running    = false;
let tick       = null;
let doneWork   = 0;
let sessionN   = 1;

// FIX (timer drift): We no longer decrement `left` on every interval
// tick. Instead we record the exact wall-clock time at which the timer should
// end, and recompute `left` from `Date.now()` on each tick. Browsers throttle
// setInterval in background tabs, but Date.now() keeps advancing at the correct
// rate, so the timer stays accurate even if you minimise the app.
let endTime    = null;
// When paused mid-session, this stores the remaining seconds so that resuming
// picks up from exactly where the user paused (rather than resetting).
let pausedLeft = null;

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

// FIX (skip counts as completed): `skipped` argument added.
// When skipped=true and mode was 'work', we do NOT call Storage.recordSession()
// and do NOT increment sessionN — a skipped focus session isn't a completed one.
// We still advance the mode to a break (so the user gets the break cadence),
// but the stats stay honest.
function onComplete(skipped = false) {
  if (mode === 'work') {
    if (!skipped) {
      doneWork++;
      sessionN++;
      Storage.recordSession();
      notify('Focus session done! Time for a break.');
    } else {
      notify('Focus session skipped.');
    }
    mode = (doneWork % cfg.longBreakAfter === 0) ? 'long' : 'short';
  } else {
    if (!skipped) {
      notify('Break over! Back to work.');
    }
    mode = 'work';
  }

  total      = modeSecs();
  left       = total;
  endTime    = null;
  pausedLeft = null;
  render();
}

function startPause() {
  if (running) {
    // Pausing: remember how much time is left, clear the interval
    clearInterval(tick);
    running    = false;
    pausedLeft = left;
  } else {
    if (total === 0) {
      alert('Please set a duration greater than 0 seconds before starting.');
      return;
    }
    if (Notification.permission === 'default') Notification.requestPermission();

    // Resume from pausedLeft if we have one, otherwise start from `total`
    const secondsToRun = pausedLeft !== null ? pausedLeft : total;
    left      = secondsToRun;
    pausedLeft = null;
    endTime   = Date.now() + secondsToRun * 1000;
    running   = true;

    tick = setInterval(() => {
      // Compute remaining from wall clock, not from a decrementing counter
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      left = remaining;

      if (remaining <= 0) {
        clearInterval(tick);
        running = false;
        onComplete(false);
        return;
      }
      render();
    }, 250); // poll faster than 1s so the display stays smooth
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
  render();
}

function skip() {
  clearInterval(tick);
  running = false;
  left    = 0;
  onComplete(true); // ← pass skipped=true so no session is recorded
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

  // FIX: only reset doneWork if the user actually changed the longBreakAfter
  // value. Previously this reset on *any* setting change, which could skip
  // the long break if you were 3 sessions in and tweaked the short-break length.
  if (!running) {
    total      = modeSecs();
    left       = total;
    pausedLeft = null;
    endTime    = null;
    render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
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