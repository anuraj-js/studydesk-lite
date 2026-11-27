// NOTE: esc(), isPastDate(), highlightText(), and showToast/showDialog are defined in utils.js and other scripts loaded before this file.

let activeFilter = 'all';
let searchQuery = '';

function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(task.dueDate + 'T00:00:00') < today;
}

function renderTasks() {
  // Silent-cancel any in-progress drag on full re-render
  if (taskDrag) {
    clearTaskDragIndicators();
    taskDrag = null;
  }

  const all = Storage.getTasks();

  // 1. Apply Status Filter
  let list;
  if      (activeFilter === 'active')    list = all.filter(t => !t.completed);
  else if (activeFilter === 'completed') list = all.filter(t =>  t.completed);
  else if (activeFilter === 'overdue')   list = all.filter(t => isOverdue(t));
  else                                   list = all;

  // 2. Apply Search Query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(q));
  }

  // Update overdue tab count badge
  const overdueCount = all.filter(t => isOverdue(t)).length;
  const badge = document.getElementById('overdueCount');
  if (badge) {
    badge.textContent    = overdueCount;
    badge.style.display  = overdueCount > 0 ? 'inline-block' : 'none';
  }

  const el = document.getElementById('taskList');

  if (!list.length) {
    const emptyMsg = searchQuery 
      ? 'No tasks match your search' 
      : (activeFilter === 'overdue' ? 'No overdue tasks' : 'Nothing here');
    el.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
    return;
  }

  el.innerHTML = list.map(t => {
    const overdue = isOverdue(t);
    const highlightedTitle = highlightText(t.title, searchQuery);
    const safeId = esc(t.id);
    const safeDueDate = esc(t.dueDate || '');
    const safePriority = ['low', 'medium', 'high'].includes(t.priority)
      ? t.priority
      : 'medium';

    return `
      <div class="task-item task-page-item ${t.completed ? 'completed' : ''}" data-id="${safeId}">

        <div class="task-main-content">
          <span class="task-drag-handle" data-id="${safeId}" title="Drag to reorder">
            <i class="fa-solid fa-grip-vertical"></i>
          </span>

          <input type="checkbox" class="task-checkbox" data-id="${safeId}" ${t.completed ? 'checked' : ''} />

          <div class="task-content">
            <div class="task-title">${highlightedTitle}</div>
            ${t.dueDate ? `<div class="task-due ${overdue ? 'overdue' : ''}">
              <i class="fa-regular fa-calendar"></i> ${safeDueDate}
              ${overdue ? ' &middot; <strong>Overdue</strong>' : ''}
            </div>` : ''}
          </div>
        </div>

        <div class="task-meta">
          <span class="badge badge-${safePriority}">${esc(safePriority)}</span>
          <button class="btn btn-ghost btn-sm edit-btn" data-id="${safeId}">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${safeId}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>

      </div>
    `;
  }).join('');

  // Attach Event Listeners
  el.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      Storage.toggleTask(cb.dataset.id);
      renderTasks();
    });
  });

  el.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showDialog({
        title: 'Delete Task',
        message: 'Are you sure you want to delete this task?',
        confirmText: 'Delete',
        onConfirm: () => {
          Storage.deleteTask(btn.dataset.id);
          renderTasks();
          showToast('Task deleted.', 'success');
        }
      });
    });
  });

  el.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditTaskModal(btn.dataset.id));
  });
}

// ── Task drag-and-drop (pointer-based) ────────
let taskDrag = null;

function getTaskListEl() {
  return document.getElementById('taskList');
}

function clearTaskDragIndicators() {
  const listEl = getTaskListEl();
  if (!listEl) return;
  listEl.querySelectorAll('.task-item').forEach(el => {
    el.classList.remove('dragging', 'drag-over', 'drag-insert-before', 'drag-insert-after');
  });
}

function startTaskDrag(e, handle) {
  const taskId = handle.dataset.id;
  const listEl = getTaskListEl();
  if (!listEl) return;

  const startRow = handle.closest('.task-item');
  if (!startRow) return;

  e.preventDefault();

  taskDrag = { taskId, listEl, startRow, pointerId: e.pointerId, handle };
  startRow.classList.add('dragging');

  try { handle.setPointerCapture(e.pointerId); } catch (_) {}

  const onMove = (ev) => onTaskDragMove(ev);
  const onUp   = (ev) => {
    endTaskDrag(ev, true);
    cleanup();
  };
  const onCancel = (ev) => {
    endTaskDrag(ev, false);
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

function onTaskDragMove(e) {
  if (!taskDrag) return;
  const { listEl, startRow } = taskDrag;
  const rows = Array.from(listEl.querySelectorAll('.task-item')).filter(r => r !== startRow);

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

function endTaskDrag(e, commit) {
  if (!taskDrag) return;
  const { taskId, listEl, startRow } = taskDrag;
  taskDrag = null;

  const rows = Array.from(listEl.querySelectorAll('.task-item'));

  if (!commit) {
    clearTaskDragIndicators();
    return;
  }

  const target = rows.find(r => r !== startRow &&
    (r.classList.contains('drag-insert-before') || r.classList.contains('drag-insert-after')));

  if (!target) {
    clearTaskDragIndicators();
    return;
  }

  const insertAfter = target.classList.contains('drag-insert-after');

  const currentIds = rows.map(r => r.dataset.id);
  const withoutDragged = currentIds.filter(id => id !== taskId);

  const targetId = target.dataset.id;
  let targetIdx = withoutDragged.indexOf(targetId);
  if (insertAfter) targetIdx++;
  withoutDragged.splice(targetIdx, 0, taskId);

  Storage.reorderTasks(withoutDragged);
  clearTaskDragIndicators();
  renderTasks();
}

// ── Edit Task Modal Logic ──
function openEditTaskModal(id) {
  const task = Storage.getTasks().find(t => t.id === id);
  if (!task) return;

  const dueDateInput = document.getElementById('editTaskDue');
  document.getElementById('editTaskId').value       = task.id;
  document.getElementById('editTaskTitle').value    = task.title;
  document.getElementById('editTaskPriority').value = task.priority || 'medium';
  dueDateInput.value                                = task.dueDate || '';
  // Store the original due date so the submit handler can tell whether it changed
  dueDateInput.dataset.originalDue                  = task.dueDate || '';

  if (window.resetTaskSaveBtn) window.resetTaskSaveBtn();
  document.getElementById('editTaskModal').style.display = 'flex';
}

function closeEditTaskModal() {
  document.getElementById('editTaskModal').style.display = 'none';
  document.getElementById('editTaskForm').reset();
}

document.addEventListener('DOMContentLoaded', () => {
  // Set the 'min' attribute on all date inputs to today
  initDateInputsMinToday();

  // Search Input
  const searchInput = document.getElementById('searchTask');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTasks();
    });
  }

  // Add Task Form
  document.getElementById('taskForm').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    const dueDate = document.getElementById('taskDue').value;

    if (!title) {
      showToast('Task title is required.', 'error');
      return;
    }

    if (dueDate && isPastDate(dueDate)) {
      showToast('Due date cannot be in the past.', 'error');
      return;
    }

    Storage.addTask({
      title,
      priority: document.getElementById('taskPriority').value,
      dueDate: dueDate
    });

    e.target.reset();
    if (searchInput) searchInput.value = '';
    searchQuery = '';

    const details = document.querySelector('.collapsible-card');
    if (details) details.removeAttribute('open');

    renderTasks();
    showToast('Task added successfully.', 'success');
  });

  // Filter Tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTasks();
    });
  });

  // Edit Task Form
  document.getElementById('editTaskForm').addEventListener('submit', e => {
    e.preventDefault();
    const id          = document.getElementById('editTaskId').value;
    const title       = document.getElementById('editTaskTitle').value.trim();
    const priority    = document.getElementById('editTaskPriority').value;
    const dueDateInput = document.getElementById('editTaskDue');
    const dueDate     = dueDateInput.value;
    const originalDue = dueDateInput.dataset.originalDue || '';

    if (!title) {
      showToast('Task title is required.', 'error');
      return;
    }

    // Only reject a past date if it was actually changed from the original value.
    // This allows editing other fields on tasks that already have a past due date.
    if (dueDate && dueDate !== originalDue && isPastDate(dueDate)) {
      showToast('Due date cannot be in the past.', 'error');
      return;
    }

    Storage.updateTask(id, { title, priority, dueDate });
    if (window.resetTaskSaveBtn) window.resetTaskSaveBtn();
    closeEditTaskModal();
    renderTasks();
    showToast('Task updated.', 'success');
  });

  // Modal Close Buttons
  document.getElementById('editTaskModalClose').addEventListener('click', closeEditTaskModal);
  document.getElementById('editTaskModalCancel').addEventListener('click', closeEditTaskModal);
  document.getElementById('editTaskModal').addEventListener('click', e => {
    if (e.target === document.getElementById('editTaskModal')) closeEditTaskModal();
  });

  renderTasks();

  // Init amber + disabled tracker for task edit modal Save
  window.resetTaskSaveBtn = initUnsavedChangesTracker(
    ['editTaskTitle', 'editTaskPriority', 'editTaskDue'],
    'saveTaskBtn',
    'saveTaskBtnText'
  );

  // Pointer-down on a task drag handle → start drag
  document.getElementById('taskList').addEventListener('pointerdown', e => {
    const handle = e.target.closest('.task-drag-handle');
    if (!handle) return;
    startTaskDrag(e, handle);
  });
});