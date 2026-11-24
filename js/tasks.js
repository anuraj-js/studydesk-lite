// NOTE: esc(), isPastDate(), highlightText(), and showToast/showDialog are defined in utils.js and other scripts loaded before this file.

let activeFilter = 'all';
let searchQuery = '';

function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(task.dueDate + 'T00:00:00') < today;
}

function renderTasks() {
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

    return `
      <div class="task-item ${t.completed ? 'completed' : ''}">
        <input type="checkbox" class="task-checkbox" data-id="${t.id}" ${t.completed ? 'checked' : ''} />
        <div class="task-content">
          <div class="task-title">${highlightedTitle}</div>
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
  // Set the 'min' attribute on all date inputs to today
  const todayStr = new Date().toISOString().split('T')[0];
  document.querySelectorAll('.date-input').forEach(input => {
      input.setAttribute('min', todayStr);
  });

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
    const id       = document.getElementById('editTaskId').value;
    const title    = document.getElementById('editTaskTitle').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const dueDate  = document.getElementById('editTaskDue').value;

    if (!title) {
      showToast('Task title is required.', 'error');
      return;
    }

    if (dueDate && isPastDate(dueDate)) {
      showToast('Due date cannot be in the past.', 'error');
      return;
    }
    
    Storage.updateTask(id, { title, priority, dueDate });
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
});