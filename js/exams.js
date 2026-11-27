// NOTE: esc(), isPastDateTime(), highlightText(), and showToast/showDialog are defined in utils.js and other scripts loaded before this file.

let searchQuery = '';

// ── Countdown helpers ──────────────────────────
function getCountdown(dateStr, timeStr) {
  const now     = new Date();
  const examEnd = new Date(dateStr + 'T' + (timeStr || '23:59'));
  const diff = examEnd - now;

  if (diff <= 0) return { text: 'Exam time has ended.', cls: 'past' };

  const totalSecs = Math.floor(diff / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;

  const cls  = days <= 3 ? 'urgent' : '';
  const text = `${days}d ${hours}h ${mins}m ${secs}s left`;
  return { text, cls };
}

function tickCountdowns() {
  Storage.getExams().forEach(e => {
    const el = document.getElementById('countdown-' + e.id);
    if (!el) return;
    const { text, cls } = getCountdown(e.date, e.time);
    el.textContent = text;
    el.className   = 'exam-countdown-live ' + cls;
  });
}

function renderTopics(exam) {
  const topics = exam.topics || [];
  const done   = topics.filter(t => t.completed).length;
  const total  = topics.length;
  const pct    = total ? Math.round((done / total) * 100) : 0;

  const topicsHtml = topics.length
    ? topics.map(t => `
        <div class="topic-item" data-topic-id="${t.id}">
          <span class="topic-drag-handle" data-exam-id="${exam.id}" data-topic-id="${t.id}" title="Drag to reorder">
            <i class="fa-solid fa-grip-vertical"></i>
          </span>
          <input type="checkbox" class="task-checkbox topic-check"
            data-exam-id="${exam.id}" data-topic-id="${t.id}"
            ${t.completed ? 'checked' : ''} />
          <span class="topic-text ${t.completed ? 'done' : ''}">${esc(t.text)}</span>
          <button class="topic-edit" data-exam-id="${exam.id}" data-topic-id="${t.id}" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="topic-delete" data-exam-id="${exam.id}" data-topic-id="${t.id}" title="Remove">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `).join('')
    : '<div class="empty-state" style="padding:.5rem 0;text-align:left;font-size:.82rem">No topics yet. Add one below.</div>';

  return { topicsHtml, pct, done, total };
}

function renderExams() {
  // Silent-cancel any in-progress drag on full re-render
  if (topicDrag) {
    clearDragIndicators(topicDrag.listEl);
    topicDrag = null;
  }

  const allExams = Storage.getExams();
  const el       = document.getElementById('examList');

  // Apply Search Filter
  let exams = allExams;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    exams = exams.filter(e => 
      e.subject.toLowerCase().includes(q) || 
      e.name.toLowerCase().includes(q)
    );
  }

  if (!exams.length) {
    el.innerHTML = `<div class="empty-state">${searchQuery ? 'No exams match your search' : 'No exams added yet'}</div>`;
    return;
  }

  el.innerHTML = exams.map(exam => {
    const { text, cls } = getCountdown(exam.date, exam.time);
    const { topicsHtml, pct, done, total } = renderTopics(exam);
    
    const dateFormatted = new Date(exam.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });

    const timeFormatted = exam.time 
      ? new Date(exam.date + 'T' + exam.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';

    const highlightedSubject = highlightText(exam.subject, searchQuery);
    const highlightedName = highlightText(exam.name, searchQuery);

    return `
      <div class="card exam-card" data-exam-id="${exam.id}">
        <div class="exam-card-header">
          <div>
            <div class="exam-subject-title">${highlightedSubject}</div>
            <div class="exam-name-label">${highlightedName} &middot; ${dateFormatted} ${timeFormatted ? 'at ' + timeFormatted : ''}</div>
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
}

function refreshTopics(examId) {
  const exam = Storage.getExams().find(e => e.id === examId);
  if (!exam) return;
  const { topicsHtml, pct, done, total } = renderTopics(exam);

  const topicsEl = document.getElementById('topics-' + examId);
  if (topicsEl) topicsEl.innerHTML = topicsHtml;

  const card = document.querySelector(`[data-exam-id="${examId}"]`);
  if (card) {
    const meta  = card.querySelector('.topics-meta');
    const bar   = card.querySelector('.topic-bar');
    const pctEl = card.querySelector('.topic-bar-pct');
    if (meta)  meta.textContent  = `${pct}% topics done · ${done} of ${total} completed`;
    if (bar)   bar.style.width   = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }
}

function addTopicFromInput(examId) {
  const input = document.querySelector(`.topic-input[data-exam-id="${examId}"]`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    showToast('Topic text is required.', 'error');
    return;
  }
  Storage.addTopic(examId, text);
  input.value = '';
  refreshTopics(examId);
}

// ── Topic drag-and-drop (pointer-based) ────────
let topicDrag = null; // { examId, topicId, listEl, startRow }

function getTopicListEl(examId) {
  return document.getElementById('topics-' + examId);
}

function clearDragIndicators(listEl) {
  if (!listEl) return;
  listEl.querySelectorAll('.topic-item').forEach(el => {
    el.classList.remove('dragging', 'drag-over', 'drag-insert-before', 'drag-insert-after');
  });
}

function startTopicDrag(e, handle) {
  const examId  = handle.dataset.examId;
  const topicId = handle.dataset.topicId;
  const listEl  = getTopicListEl(examId);
  if (!listEl) return;

  const startRow = handle.closest('.topic-item');
  if (!startRow) return;

  e.preventDefault();

  topicDrag = { examId, topicId, listEl, startRow, pointerId: e.pointerId, handle };
  startRow.classList.add('dragging');

  try { handle.setPointerCapture(e.pointerId); } catch (_) {}

  const onMove = (ev) => onTopicDragMove(ev);
  const onUp   = (ev) => {
    endTopicDrag(ev, true);
    cleanup();
  };
  const onCancel = (ev) => {
    endTopicDrag(ev, false);
    cleanup();
  };
  const cleanup = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onCancel);
}

function onTopicDragMove(e) {
  if (!topicDrag) return;
  const { listEl, startRow } = topicDrag;
  const rows = Array.from(listEl.querySelectorAll('.topic-item')).filter(r => r !== startRow);

  // Clear previous indicators
  rows.forEach(r => r.classList.remove('drag-over', 'drag-insert-before', 'drag-insert-after'));

  const target = rows.find(r => {
    const rect = r.getBoundingClientRect();
    return e.clientY >= rect.top && e.clientY <= rect.bottom;
  });

  if (!target) return;

  const rect = target.getBoundingClientRect();
  const insertAfter = e.clientY > rect.top + rect.height / 2;

  target.classList.add('drag-over');
  target.classList.add(insertAfter ? 'drag-insert-after' : 'drag-insert-before');
}

function endTopicDrag(e, commit) {
  if (!topicDrag) return;
  const { examId, topicId, listEl, startRow } = topicDrag;
  topicDrag = null;

  const rows = Array.from(listEl.querySelectorAll('.topic-item'));

  if (!commit) {
    clearDragIndicators(listEl);
    return;
  }

  // Find the target row (the one with an insert class)
  const target = rows.find(r => r !== startRow &&
    (r.classList.contains('drag-insert-before') || r.classList.contains('drag-insert-after')));

  if (!target) {
    clearDragIndicators(listEl);
    return;
  }

  const insertAfter = target.classList.contains('drag-insert-after');

  // Build new order of ids
  const currentIds = rows.map(r => r.dataset.topicId);
  const withoutDragged = currentIds.filter(id => id !== topicId);

  const targetId = target.dataset.topicId;
  let targetIdx = withoutDragged.indexOf(targetId);
  if (insertAfter) targetIdx++;
  withoutDragged.splice(targetIdx, 0, topicId);

  Storage.reorderTopics(examId, withoutDragged);
  clearDragIndicators(listEl);
  refreshTopics(examId);
}

function openEditModal(id) {
  const exam = Storage.getExams().find(e => e.id === id);
  if (!exam) return;
  const dateInput = document.getElementById('editExamDate');
  const timeInput = document.getElementById('editExamTime');
  const shownTime = exam.time || '09:00';

  document.getElementById('editExamId').value      = exam.id;
  document.getElementById('editExamName').value    = exam.name;
  document.getElementById('editExamSubject').value = exam.subject;
  dateInput.value                                  = exam.date;
  timeInput.value                                  = shownTime;
  // Store originals exactly as displayed so the submit handler can detect real changes
  dateInput.dataset.originalDate                   = exam.date;
  timeInput.dataset.originalTime                   = shownTime;
  if (window.resetExamSaveBtn) window.resetExamSaveBtn();
  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editExamForm').reset();
}

function openTopicEditModal(examId, topicId) {
  const exam = Storage.getExams().find(e => e.id === examId);
  if (!exam) return;
  const topic = (exam.topics || []).find(t => t.id === topicId);
  if (!topic) return;

  document.getElementById('editTopicExamId').value = examId;
  document.getElementById('editTopicId').value     = topicId;
  document.getElementById('editTopicText').value   = topic.text;
  if (window.resetTopicSaveBtn) window.resetTopicSaveBtn();
  document.getElementById('editTopicModal').style.display = 'flex';
}

function closeTopicEditModal() {
  document.getElementById('editTopicModal').style.display = 'none';
  document.getElementById('editTopicForm').reset();
}

document.addEventListener('DOMContentLoaded', () => {
  initDateInputsMinToday();

  // Search Input
  const searchInput = document.getElementById('searchExam');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderExams();
    });
  }

  document.getElementById('examForm').addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('examName').value.trim();
    const subject = document.getElementById('examSubject').value.trim();
    const date    = document.getElementById('examDate').value;
    const time    = document.getElementById('examTime').value;
    
    if (!name || !subject || !date || !time) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (isPastDateTime(date, time)) {
      showToast('Exam date and time cannot be in the past.', 'error');
      return;
    }
    
    Storage.addExam({ name, subject, date, time });
    e.target.reset();
    if (searchInput) searchInput.value = '';
    searchQuery = '';

    const details = document.querySelector('.collapsible-card');
    if (details) details.removeAttribute('open');
    renderExams();
    showToast('Exam created.', 'success');
  });

  document.getElementById('editExamForm').addEventListener('submit', e => {
    e.preventDefault();
    const id        = document.getElementById('editExamId').value;
    const name      = document.getElementById('editExamName').value.trim();
    const subject   = document.getElementById('editExamSubject').value.trim();
    const dateInput = document.getElementById('editExamDate');
    const timeInput = document.getElementById('editExamTime');
    const date      = dateInput.value;
    const time      = timeInput.value;
    const originalDate = dateInput.dataset.originalDate || '';
    const originalTime = timeInput.dataset.originalTime || '';

    if (!name || !subject || !date || !time) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    // Only reject a past date/time if either value was actually changed.
    // This allows editing name or subject of an exam that already has a past date.
    const dateTimeChanged = date !== originalDate || time !== originalTime;
    if (dateTimeChanged && isPastDateTime(date, time)) {
      showToast('Exam date and time cannot be in the past.', 'error');
      return;
    }

    Storage.updateExam(id, { name, subject, date, time });
    if (window.resetExamSaveBtn) window.resetExamSaveBtn();
    closeEditModal();
    renderExams();
    showToast('Exam updated.', 'success');
  });

  document.getElementById('modalClose').addEventListener('click', closeEditModal);
  document.getElementById('modalCancel').addEventListener('click', closeEditModal);
  document.getElementById('editModal').addEventListener('click', e => {
    if (e.target === document.getElementById('editModal')) closeEditModal();
  });

  renderExams();

  // Init amber + disabled tracker for exam edit modal Save
  window.resetExamSaveBtn = initUnsavedChangesTracker(
    ['editExamName', 'editExamSubject', 'editExamDate', 'editExamTime'],
    'saveExamBtn',
    'saveExamBtnText'
  );

  // Edit Topic Modal wiring
  const editTopicForm = document.getElementById('editTopicForm');
  if (editTopicForm) {
    editTopicForm.addEventListener('submit', e => {
      e.preventDefault();
      const examId  = document.getElementById('editTopicExamId').value;
      const topicId = document.getElementById('editTopicId').value;
      const text    = document.getElementById('editTopicText').value.trim();

      if (!text) {
        showToast('Topic text is required.', 'error');
        return;
      }

      Storage.updateTopic(examId, topicId, text);
      if (window.resetTopicSaveBtn) window.resetTopicSaveBtn();
      closeTopicEditModal();
      refreshTopics(examId);
      showToast('Topic updated.', 'success');
    });

    document.getElementById('editTopicModalClose').addEventListener('click', closeTopicEditModal);
    document.getElementById('editTopicModalCancel').addEventListener('click', closeTopicEditModal);
    document.getElementById('editTopicModal').addEventListener('click', e => {
      if (e.target.id === 'editTopicModal') closeTopicEditModal();
    });

    window.resetTopicSaveBtn = initUnsavedChangesTracker(
      ['editTopicText'],
      'saveTopicBtn',
      'saveTopicBtnText'
    );
  }

  const examList = document.getElementById('examList');

  // Pointer-down on a topic drag handle → start drag
  examList.addEventListener('pointerdown', e => {
    const handle = e.target.closest('.topic-drag-handle');
    if (!handle) return;
    startTopicDrag(e, handle);
  });

  examList.addEventListener('click', e => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      showDialog({
        title: 'Delete Exam',
        message: 'Delete this exam and all its topics?',
        confirmText: 'Delete',
        onConfirm: () => {
          Storage.deleteExam(deleteBtn.dataset.id);
          renderExams();
          showToast('Exam deleted.', 'success');
        }
      });
      return;
    }

    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      openEditModal(editBtn.dataset.id);
      return;
    }

    const topicEditBtn = e.target.closest('.topic-edit');
    if (topicEditBtn) {
      openTopicEditModal(topicEditBtn.dataset.examId, topicEditBtn.dataset.topicId);
      return;
    }

    const topicDeleteBtn = e.target.closest('.topic-delete');
    if (topicDeleteBtn) {
      showDialog({
        title: 'Remove Topic',
        message: 'Remove this topic?',
        confirmText: 'Remove',
        onConfirm: () => {
          Storage.deleteTopic(topicDeleteBtn.dataset.examId, topicDeleteBtn.dataset.topicId);
          refreshTopics(topicDeleteBtn.dataset.examId);
          showToast('Topic removed.', 'success');
        }
      });
      return;
    }

    const addTopicBtn = e.target.closest('.add-topic-btn');
    if (addTopicBtn) {
      addTopicFromInput(addTopicBtn.dataset.examId);
      return;
    }
  });

  examList.addEventListener('change', e => {
    const cb = e.target.closest('.topic-check');
    if (cb) {
      Storage.toggleTopic(cb.dataset.examId, cb.dataset.topicId);
      refreshTopics(cb.dataset.examId);
    }
  });

  examList.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const input = e.target.closest('.topic-input');
      if (input) {
        e.preventDefault();
        addTopicFromInput(input.dataset.examId);
      }
    }
  });

  setInterval(tickCountdowns, 1000);
});