function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let activeFilter = 'all';

function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(task.dueDate) < today;
}

function renderTasks() {
  const all = Storage.getTasks();
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
    badge.textContent = overdueCount;
    badge.style.display = overdueCount > 0 ? 'inline-block' : 'none';
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
          <button class="delete-btn" data-id="${t.id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

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
}

document.addEventListener('DOMContentLoaded', () => {
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
    renderTasks();
  });

  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTasks();
    });
  });

  renderTasks();
});