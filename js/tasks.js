// NOTE: esc() is defined in storage.js (loaded before this file)

let activeFilter = 'all';

function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(task.dueDate) < today;
}

function renderTasks() {
  const all   = Storage.getTasks();
  const today = new Date(); today.setHours(0,0,0,0);

  let list;
  if      (activeFilter === 'active')    list = all.filter(t => !t.completed);
  else if (activeFilter === 'completed') list = all.filter(t =>  t.completed);
  else if (activeFilter === 'overdue')   list = all.filter(t => isOverdue(t));
  else                                   list = all;

  // Update overdue tab count badge
  const overdueCount = all.filter(t => isOverdue(t)).length;
  const badge = document.getElementById('overdueCount');
  if (badge) {
    badge.textContent    = overdueCount;
    badge.style.display  = overdueCount > 0 ? 'inline-block' : 'none';
  }

  const el = document.getElementById('taskList');

  if (!list.length) {
    el.innerHTML = `<div class="empty-state">${activeFilter === 'overdue' ? 'No overdue tasks' : 'Nothing here'}</div>`;
    return;
  }

  el.innerHTML = list.map(t => {
    const overdue = isOverdue(t);
    return `
      <div class="task-item ${t.completed ? 'completed' : ''}">
        <input type="checkbox" class="task-checkbox" data-id="${t.id}" ${t.completed ? 'checked' : ''} />
        <div class="task-content">
          <div class="task-title">${esc(t.title)}</div>
          ${t.dueDate ? `<div class="task-due ${overdue ? 'overdue' : ''}">
            <i class="fa-regular fa-calendar"></i> ${t.dueDate}
            ${overdue ? ' &middot; <strong>Overdue</strong>' : ''}
          </div>` : ''}
        </div>
        <div class="task-meta">
          <span class="badge badge-${t.priority}">${t.priority}</span>

          <button class="btn btn-ghost btn-sm edit-btn" data-id="${t.id}">
            <i class="fa-solid fa-pen"></i> Edit
          </button>

          <button class="btn btn-danger btn-sm delete-btn" data-id="${t.id}">
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
      if (confirm('Delete this task?')) {
        Storage.deleteTask(btn.dataset.id);
        renderTasks();
      }
    });
  });

  el.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditTaskModal(btn.dataset.id));
  });
}

// ── Edit Task Modal Logic ──
function openEditTaskModal(id) {
  const task = Storage.getTasks().find(t => t.id === id);
  if (!task) return;

  document.getElementById('editTaskId').value       = task.id;
  document.getElementById('editTaskTitle').value    = task.title;
  document.getElementById('editTaskPriority').value = task.priority || 'medium';
  document.getElementById('editTaskDue').value      = task.dueDate || '';

  document.getElementById('editTaskModal').style.display = 'flex';
}

function closeEditTaskModal() {
  document.getElementById('editTaskModal').style.display = 'none';
  document.getElementById('editTaskForm').reset();
}

document.addEventListener('DOMContentLoaded', () => {
  // Add Task Form
  document.getElementById('taskForm').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) return;
    Storage.addTask({
      title,
      priority: document.getElementById('taskPriority').value,
      dueDate:  document.getElementById('taskDue').value
    });
    e.target.reset();

    // Automatically close the accordion after adding
    const details = document.querySelector('.collapsible-card');
    if (details) details.removeAttribute('open');

    renderTasks();
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
    const id       = document.getElementById('editTaskId').value;
    const title    = document.getElementById('editTaskTitle').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const dueDate  = document.getElementById('editTaskDue').value;

    if (!title) return;
    Storage.updateTask(id, { title, priority, dueDate });
    closeEditTaskModal();
    renderTasks();
  });

  // Modal Close Buttons
  document.getElementById('editTaskModalClose').addEventListener('click', closeEditTaskModal);
  document.getElementById('editTaskModalCancel').addEventListener('click', closeEditTaskModal);
  document.getElementById('editTaskModal').addEventListener('click', e => {
    if (e.target === document.getElementById('editTaskModal')) closeEditTaskModal();
  });

  renderTasks();
});
