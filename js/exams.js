function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Countdown helpers ──────────────────────────
function getCountdown(dateStr) {
  const now     = new Date();
  const examEnd = new Date(dateStr);
  examEnd.setHours(23, 59, 59, 999);
  const diff = examEnd - now;

  if (diff <= 0) return { text: 'Past', cls: 'past' };

  const totalSecs = Math.floor(diff / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;

  let cls = '';
  
  // Set urgency color if less than 3 days
  if (days < 3) cls = 'urgent';

  // Format exactly as: 15d 13h 43m 48s left
  const text = `${days}d ${hours}h ${mins}m ${secs}s left`;

  return { text, cls };
}

// ── Tick: update only countdown spans ──────────
function tickCountdowns() {
  Storage.getExams().forEach(e => {
    const el = document.getElementById('countdown-' + e.id);
    if (!el) return;
    const { text, cls } = getCountdown(e.date);
    el.textContent = text;
    el.className = 'exam-countdown-live ' + cls;
  });
}

// ── Render topic list for one exam ─────────────
function renderTopics(exam) {
  const topics = exam.topics || [];
  const done   = topics.filter(t => t.completed).length;
  const total  = topics.length;
  const pct    = total ? Math.round((done / total) * 100) : 0;

  const topicsHtml = topics.length
    ? topics.map(t => `
        <div class="topic-item" data-topic-id="${t.id}">
          <input type="checkbox" class="task-checkbox topic-check"
            data-exam-id="${exam.id}" data-topic-id="${t.id}"
            ${t.completed ? 'checked' : ''} />
          <span class="topic-text ${t.completed ? 'done' : ''}">${esc(t.text)}</span>
          <button class="topic-delete" data-exam-id="${exam.id}" data-topic-id="${t.id}" title="Remove">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `).join('')
    : '<div class="empty-state" style="padding:.5rem 0;text-align:left;font-size:.82rem">No topics yet. Add one below.</div>';

  return { topicsHtml, pct, done, total };
}

// ── Render all exam cards ──────────────────────
function renderExams() {
  const exams = Storage.getExams();
  const el    = document.getElementById('examList');

  if (!exams.length) {
    el.innerHTML = '<div class="empty-state">No exams added yet</div>';
    return;
  }

  el.innerHTML = exams.map(exam => {
    const { text, cls }         = getCountdown(exam.date);
    const { topicsHtml, pct, done, total } = renderTopics(exam);
    const dateFormatted = new Date(exam.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });

    return `
      <div class="card exam-card" data-exam-id="${exam.id}">
        <div class="exam-card-header">
          <div>
            <div class="exam-name">${esc(exam.name)}</div>
            <div class="exam-subject-label">${esc(exam.subject)} &middot; ${dateFormatted}</div>
          </div>
          <div class="exam-actions">
            <button class="btn btn-ghost btn-sm edit-btn" data-id="${exam.id}">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${exam.id}">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>

        <div class="exam-countdown-live ${cls}" id="countdown-${exam.id}">${text}</div>

        <div class="topics-meta">${pct}% topics done &middot; ${done} of ${total} completed</div>
        <div class="topic-bar-row">
          <div class="topic-bar-wrap">
            <div class="topic-bar" style="width:${pct}%"></div>
          </div>
          <span class="topic-bar-pct">${pct}%</span>
        </div>

        <hr class="topics-divider" />

        <div class="topics-list" id="topics-${exam.id}">${topicsHtml}</div>

        <div class="topic-input-row">
          <input type="text" class="topic-input" data-exam-id="${exam.id}" placeholder="Add topic" />
          <button class="btn btn-primary btn-sm add-topic-btn" data-exam-id="${exam.id}">Add</button>
        </div>
      </div>
    `;
  }).join('');

  bindExamEvents();
}

// ── Bind events on rendered cards ─────────────
function bindExamEvents() {
  // Delete exam
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this exam and all its topics?')) {
        Storage.deleteExam(btn.dataset.id);
        renderExams();
      }
    });
  });

  // Edit exam
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });

  // Toggle topic
  document.querySelectorAll('.topic-check').forEach(cb => {
    cb.addEventListener('change', () => {
      Storage.toggleTopic(cb.dataset.examId, cb.dataset.topicId);
      refreshTopics(cb.dataset.examId);
    });
  });

  // Delete topic
  document.querySelectorAll('.topic-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Remove this topic?')) {
        Storage.deleteTopic(btn.dataset.examId, btn.dataset.topicId);
        refreshTopics(btn.dataset.examId);
      }
    });
  });

  // Add topic via button
  document.querySelectorAll('.add-topic-btn').forEach(btn => {
    btn.addEventListener('click', () => addTopicFromInput(btn.dataset.examId));
  });

  // Add topic via Enter key
  document.querySelectorAll('.topic-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); addTopicFromInput(input.dataset.examId); }
    });
  });
}

function addTopicFromInput(examId) {
  const input = document.querySelector(`.topic-input[data-exam-id="${examId}"]`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  Storage.addTopic(examId, text);
  input.value = '';
  refreshTopics(examId);
}

// ── Refresh topics section without full re-render ──
function refreshTopics(examId) {
  const exam = Storage.getExams().find(e => e.id === examId);
  if (!exam) return;
  const { topicsHtml, pct, done, total } = renderTopics(exam);

  const topicsEl = document.getElementById('topics-' + examId);
  if (topicsEl) topicsEl.innerHTML = topicsHtml;

  // update progress
  const card = document.querySelector(`[data-exam-id="${examId}"]`);
  if (card) {
    const meta = card.querySelector('.topics-meta');
    const bar  = card.querySelector('.topic-bar');
    const pctEl = card.querySelector('.topic-bar-pct');
    if (meta)  meta.textContent  = `${pct}% topics done · ${done} of ${total} completed`;
    if (bar)   bar.style.width   = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }

  // re-bind events for the refreshed section
  bindExamEvents();
}

// ── Edit Modal ─────────────────────────────────
function openEditModal(id) {
  const exam = Storage.getExams().find(e => e.id === id);
  if (!exam) return;
  document.getElementById('editExamId').value      = exam.id;
  document.getElementById('editExamName').value    = exam.name;
  document.getElementById('editExamSubject').value = exam.subject;
  document.getElementById('editExamDate').value    = exam.date;
  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editExamForm').reset();
}

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Add exam form
  document.getElementById('examForm').addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('examName').value.trim();
    const subject = document.getElementById('examSubject').value.trim();
    const date    = document.getElementById('examDate').value;
    if (!name || !subject || !date) return;
    Storage.addExam({ name, subject, date });
    e.target.reset();
    renderExams();
  });

  // Edit form
  document.getElementById('editExamForm').addEventListener('submit', e => {
    e.preventDefault();
    const id      = document.getElementById('editExamId').value;
    const name    = document.getElementById('editExamName').value.trim();
    const subject = document.getElementById('editExamSubject').value.trim();
    const date    = document.getElementById('editExamDate').value;
    if (!name || !subject || !date) return;
    Storage.updateExam(id, { name, subject, date });
    closeEditModal();
    renderExams();
  });

  document.getElementById('modalClose').addEventListener('click', closeEditModal);
  document.getElementById('modalCancel').addEventListener('click', closeEditModal);
  document.getElementById('editModal').addEventListener('click', e => {
    if (e.target === document.getElementById('editModal')) closeEditModal();
  });

  renderExams();

  // Live countdown every second
  setInterval(tickCountdowns, 1000);
});