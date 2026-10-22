let cfg      = Storage.getPomodoroSettings();
let mode     = 'work';
let total    = cfg.work * 60;
let left     = total;
let running  = false;
let tick     = null;
let doneWork = 0;
let sessionN = 1;

function modeLabel()   { return { work:'Focus Time', short:'Short Break', long:'Long Break' }[mode]; }
function modeSecs()    { return { work: cfg.work*60, short: cfg.shortBreak*60, long: cfg.longBreak*60 }[mode]; }

function fmt(s) {
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
}

function render() {
  document.getElementById('timerDisplay').textContent = fmt(left);
  document.getElementById('modeLabel').textContent    = modeLabel();
  document.getElementById('sessionInfo').textContent  =
    'Session ' + sessionN + ' · ' + Storage.getTodaySessions() + ' completed today';

  const isRunning = running;
  document.getElementById('startBtn').innerHTML = isRunning
    ? '<i class="fa-solid fa-pause"></i> Pause'
    : '<i class="fa-solid fa-play"></i> Start';

  const pct = total > 0 ? ((total - left) / total) * 100 : 0;
  document.getElementById('progressBar').style.width = pct + '%';
  document.title = fmt(left) + ' · StudyDesk Lite';
}

function notify(msg) {
  if (Notification.permission === 'granted') {
    new Notification('StudyDesk Lite', { body: msg });
  }
}

function onComplete() {
  running = false;
  clearInterval(tick);

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
    if (Notification.permission === 'default') Notification.requestPermission();
    running = true;
    tick = setInterval(() => {
      if (left <= 0) { onComplete(); return; }
      left--;
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
  cfg.work           = parseInt(document.getElementById('setWork').value)      || 25;
  cfg.shortBreak     = parseInt(document.getElementById('setShort').value)     || 5;
  cfg.longBreak      = parseInt(document.getElementById('setLong').value)      || 15;
  cfg.longBreakAfter = parseInt(document.getElementById('setLongAfter').value) || 4;
  Storage.savePomodoroSettings(cfg);
  if (!running) { total = modeSecs(); left = total; render(); }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startBtn').addEventListener('click', startPause);
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('skipBtn').addEventListener('click', skip);

  const ids  = ['setWork','setShort','setLong','setLongAfter'];
  const vals = [cfg.work, cfg.shortBreak, cfg.longBreak, cfg.longBreakAfter];
  ids.forEach((id, i) => {
    document.getElementById(id).value = vals[i];
    document.getElementById(id).addEventListener('change', applySettings);
  });

  total = modeSecs();
  left  = total;
  render();
});