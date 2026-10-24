// NOTE: esc() is defined in storage.js (loaded before this file)

let use24 = localStorage.getItem('sdl-clock-24') === '1';

const studyMessages = {
  lateNight:    ['Still awake?','Night owl mode.','Still grinding?','Late-night session?','You\'re still here?','Midnight study mode.'],
  earlyMorning: ['Early bird mode.','Up early today?','Fresh day, fresh start.','Morning grind begins.','Coffee first?','Early start. Nice.'],
  morning:      ['Let\'s get productive.','Time to lock in.','Brain: online.','Ready to cook?','Let\'s make progress.','Study mode: ON.'],
  afternoon:    ['Still got time.','Keep it rolling.','Back to the grind.','Don\'t lose momentum.','Time to lock in.','Let\'s get it done.'],
  evening:      ['Evening grind?','Let\'s finish strong.','Time to lock in.','One more session?','Study mode: ON.','Let\'s get this done.'],
  lateEvening:  ['Still grinding?','Night mode activated.','One last push?','Almost there.','Keep going.','Lock in mode.'],
  veryLate:     ['Bro, it\'s late.','Still here? Respect.','Night owl spotted.','Still studying?','One last session?','Don\'t forget to sleep.']
};

function getStudyMessage(h) {
  let msgs;
  if      (h >= 0  && h < 5)  msgs = studyMessages.lateNight;
  else if (h >= 5  && h < 8)  msgs = studyMessages.earlyMorning;
  else if (h >= 8  && h < 12) msgs = studyMessages.morning;
  else if (h >= 12 && h < 17) msgs = studyMessages.afternoon;
  else if (h >= 17 && h < 20) msgs = studyMessages.evening;
  else if (h >= 20 && h < 23) msgs = studyMessages.lateEvening;
  else                         msgs = studyMessages.veryLate;
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function getGreeting(h) {
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function updateGreeting() {
  const h        = new Date().getHours();
  const userName = localStorage.getItem('sdl-username') || 'Student';
  document.getElementById('greeting').textContent     = `${getGreeting(h)}, ${userName}!`;
  document.getElementById('studyMessage').textContent = getStudyMessage(h);
}

function exportData() {
  const data = {};
  Object.keys(localStorage)
    .filter(k => k.startsWith('sdl-'))
    .forEach(k => data[k] = localStorage.getItem(k));

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `studydesk-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  // a.click() is async — delay the revoke so the browser has time to
  // initiate the download before the object URL is torn down.
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const keys = Object.keys(data).filter(k => k.startsWith('sdl-'));
      if (!keys.length) { alert('Invalid backup file.'); return; }
      if (!confirm('This will overwrite your current data. Continue?')) return;
      keys.forEach(k => localStorage.setItem(k, data[k]));
      alert('Import successful!');
      location.reload();
    } catch {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
}

function formatTime(d) {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: !use24
  });
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
  });
}

function initClock() {
  const clockEl   = document.getElementById('clock');
  const dateEl    = document.getElementById('date');
  const toggleBtn = document.getElementById('clockToggle');

  function update() {
    const now = new Date();
    clockEl.textContent = formatTime(now);
    dateEl.textContent  = formatDate(now);
  }

  function syncToggleLabel() {
    toggleBtn.innerHTML = use24
      ? '<i class="fa-regular fa-clock"></i> Switch to 12-Hour'
      : '<i class="fa-regular fa-clock"></i> Switch to 24-Hour';
  }

  syncToggleLabel();
  update();
  setInterval(update, 1000);

  toggleBtn.addEventListener('click', () => {
    use24 = !use24;
    localStorage.setItem('sdl-clock-24', use24 ? '1' : '0');
    syncToggleLabel();
    update();
  });
}

function initStats() {
  const tasks = Storage.getTasks();
  const exams = Storage.getExams();
  const today = new Date(); today.setHours(0,0,0,0);

  document.getElementById('statPending').textContent   = tasks.filter(t => !t.completed).length;
  document.getElementById('statCompleted').textContent = tasks.filter(t =>  t.completed).length;

  const next = exams.find(e => new Date(e.date + 'T00:00:00') >= today);
  if (next) {
    // Math.round instead of Math.ceil — DST transitions can make the difference
    // a non-integer (e.g. 0.958 days), causing Math.ceil to return 1 when the
    // correct answer is 0 (today).
    const diff = Math.round((new Date(next.date + 'T00:00:00') - today) / 864e5);
    document.getElementById('statExam').textContent = diff === 0 ? 'Today' : diff + 'd';
  } else {
    document.getElementById('statExam').textContent = '—';
  }

  document.getElementById('statSessions').textContent = Storage.getTodaySessions();
}

function initRecentTasks() {
  const el    = document.getElementById('recentTasks');
  const tasks = Storage.getTasks().filter(t => !t.completed).slice(0, 4);

  if (!tasks.length) {
    el.innerHTML = '<div class="empty-state">No pending tasks</div>';
    return;
  }

  el.innerHTML = tasks.map(t => `
    <div class="task-item">
      <input type="checkbox" class="task-checkbox" data-id="${t.id}" />
      <div class="task-content">
        <div class="task-title">${esc(t.title)}</div>
        ${t.dueDate ? `<div class="task-due"><i class="fa-regular fa-calendar"></i> ${t.dueDate}</div>` : ''}
      </div>
      <span class="badge badge-${t.priority}">${t.priority}</span>
    </div>
  `).join('');

  el.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      Storage.toggleTask(cb.dataset.id);
      // FIX: Replace location.reload() with targeted re-renders. The full-page
      // reload was slow, reset scroll position, and caused a visible flash.
      // Re-rendering only the affected widgets is instant and seamless.
      initStats();
      initRecentTasks();
    });
  });
}

function initUpcomingExams() {
  const el    = document.getElementById('upcomingExams');
  const today = new Date(); today.setHours(0,0,0,0);

  const exams = Storage.getExams()
    .filter(e => new Date(e.date + 'T00:00:00') >= today)
    .slice(0, 4);

  if (!exams.length) {
    el.innerHTML = '<div class="empty-state">No upcoming exams</div>';
    return;
  }

  el.innerHTML = exams.map(e => {
    // Math.round here too, same reason as initStats
    const diff   = Math.round((new Date(e.date + 'T00:00:00') - today) / 864e5);
    const urgent = diff <= 3;
    const label  = diff === 0 ? 'Today!' : diff + ' days';
    return `
      <div class="exam-item">
        <div>
          <div class="exam-subject">${esc(e.subject)}</div>
          <div class="exam-date">${esc(e.name)} &middot; ${new Date(e.date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
        </div>
        <div class="exam-countdown ${urgent ? 'urgent' : ''}">${label}</div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  let userName = localStorage.getItem('sdl-username');
  if (!userName) {
    userName = prompt('What should we call you?') || 'Student';
    localStorage.setItem('sdl-username', userName);
  }

  updateGreeting();
  initClock();
  initStats();
  initRecentTasks();
  initUpcomingExams();

  const usernameInput = document.getElementById('usernameInput');
  usernameInput.value = localStorage.getItem('sdl-username') || '';
  document.getElementById('saveUsername').addEventListener('click', () => {
    const val = usernameInput.value.trim();
    if (!val) return;
    localStorage.setItem('sdl-username', val);
    updateGreeting();
  });

  document.getElementById('exportBtn').addEventListener('click', exportData);

  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importInput').click();
  });

  document.getElementById('importInput').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
  });
});
