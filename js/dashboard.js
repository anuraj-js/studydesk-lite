function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let use24 = localStorage.getItem('sdl-clock-24') === '1';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
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
  });
}

function initStats() {
  const tasks = Storage.getTasks();
  const exams = Storage.getExams();
  const today = new Date(); today.setHours(0,0,0,0);

  document.getElementById('statPending').textContent   = tasks.filter(t => !t.completed).length;
  document.getElementById('statCompleted').textContent = tasks.filter(t =>  t.completed).length;

  const next = exams.find(e => new Date(e.date) >= today);
  if (next) {
    const diff = Math.ceil((new Date(next.date) - today) / 864e5);
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
      setTimeout(() => location.reload(), 250);
    });
  });
}

function initUpcomingExams() {
  const el    = document.getElementById('upcomingExams');
  const today = new Date(); today.setHours(0,0,0,0);
  const exams = Storage.getExams()
    .filter(e => new Date(e.date) >= today)
    .slice(0, 4);

  if (!exams.length) {
    el.innerHTML = '<div class="empty-state">No upcoming exams</div>';
    return;
  }

  el.innerHTML = exams.map(e => {
    const diff   = Math.ceil((new Date(e.date) - today) / 864e5);
    const urgent = diff <= 3;
    const label  = diff === 0 ? 'Today!' : diff + ' days';
    return `
      <div class="exam-item">
        <div>
          <div class="exam-subject">${esc(e.name)}</div>
          <div class="exam-date">${esc(e.subject)} &middot; ${new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
        </div>
        <div class="exam-countdown ${urgent ? 'urgent' : ''}">${label}</div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('greeting').textContent = getGreeting() + ', Anuraj!';
  initClock();
  initStats();
  initRecentTasks();
  initUpcomingExams();
});