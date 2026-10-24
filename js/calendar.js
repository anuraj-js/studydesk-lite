let currentDate = new Date();
// Normalise to the 1st so setMonth() never overflows (e.g. Jan 31 → Feb 31 → Mar 3)
currentDate.setDate(1);

// ── Helper: Format date to YYYY-MM-DD for comparison ──
function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthYear = document.getElementById('calMonthYear');

  if (!grid) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYear.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayStr = toYMD(today);

  const tasks = Storage.getTasks();
  const exams = Storage.getExams();

  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = new Date(year, month, d);
    const thisDateStr = toYMD(thisDate);

    const isToday = thisDateStr === todayStr;
    const todayClass = isToday ? 'today' : '';

    const dayTasks = tasks.filter(t => t.dueDate === thisDateStr);
    const dayExams = exams.filter(e => e.date === thisDateStr);
    const hasEvents = dayTasks.length > 0 || dayExams.length > 0;
    const eventClass = hasEvents ? 'has-event' : '';

    html += `
      <div class="cal-day ${todayClass} ${eventClass}" data-date="${thisDateStr}">
        <span class="bs-date">${d}</span>
        ${hasEvents ? '<span class="event-dot"></span>' : ''}
      </div>
    `;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day:not(.empty)').forEach(dayEl => {
    dayEl.addEventListener('click', () => openDayModal(dayEl.dataset.date));
  });
}

function prevMonth() {
  currentDate.setDate(1);
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setDate(1);
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

function goToToday() {
  currentDate = new Date();
  currentDate.setDate(1);
  renderCalendar();
}

// ── Modal Logic ──
function openDayModal(dateStr) {
  const modal = document.getElementById('dayModal');
  const modalTitle = document.getElementById('dayModalTitle');
  const modalBody = document.getElementById('dayModalBody');

  if (!modal || !modalTitle || !modalBody) return;

  const dateObj = new Date(dateStr + 'T00:00:00');
  const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  modalTitle.textContent = formatted;

  const tasks = Storage.getTasks().filter(t => t.dueDate === dateStr);
  const exams = Storage.getExams().filter(e => e.date === dateStr);

  let html = '';

  if (!tasks.length && !exams.length) {
    html = '<div class="empty-state">No events for this day.</div>';
  } else {
    if (exams.length) {
      html += `<h4 class="event-section-title" style="color:var(--accent); margin-bottom:0.5rem;">Exams</h4>`;
      html += exams.map(e => `
        <div class="event-item">
          <i class="fa-solid fa-book-open" style="color:var(--accent);"></i>
          <div>
            <div style="font-weight:600;">${esc(e.subject)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${esc(e.name)}</div>
          </div>
        </div>
      `).join('');
    }

    if (tasks.length) {
      html += `<h4 class="event-section-title" style="color:var(--warning); margin-bottom:0.5rem; margin-top:1rem;">Tasks</h4>`;
      html += tasks.map(t => `
        <div class="event-item ${t.completed ? 'completed' : ''}">
          <i class="fa-solid fa-list-check" style="color:var(--warning);"></i>
          <div>
            <div style="font-weight:600;">${esc(t.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Priority: ${t.priority}</div>
          </div>
        </div>
      `).join('');
    }
  }

  modalBody.innerHTML = html;
  modal.style.display = 'flex';
}

function closeDayModal() {
  const modal = document.getElementById('dayModal');
  if (modal) modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const prevBtn   = document.getElementById('prevMonth');
  const nextBtn   = document.getElementById('nextMonth');
  const todayBtn  = document.getElementById('todayBtn');
  const modalClose = document.getElementById('dayModalClose');

  if (prevBtn)  prevBtn.addEventListener('click', prevMonth);
  if (nextBtn)  nextBtn.addEventListener('click', nextMonth);
  if (todayBtn) todayBtn.addEventListener('click', goToToday);

  if (modalClose) modalClose.addEventListener('click', closeDayModal);

  const modalOverlay = document.getElementById('dayModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeDayModal();
    });
  }

  if (document.getElementById('calendarGrid')) {
    renderCalendar();
  }
});