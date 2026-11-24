let activeNoteId      = null;
let searchQuery       = '';
let isNewUnsavedNote  = false;
let saveTimeout;

function renderNotesList() {
  const notes  = Storage.getNotes();
  const listEl = document.getElementById('notesList');

  const filteredNotes = notes.filter(n => {
    const title = (n.title || '').toLowerCase();
    const body  = (n.body  || '').toLowerCase();
    const q     = searchQuery.toLowerCase();
    return title.includes(q) || body.includes(q);
  });

  if (!filteredNotes.length) {
    const msg = searchQuery
      ? 'No notes match your search.'
      : 'No notes yet.<br>Create one to get started.';
    listEl.innerHTML = `<div class="empty-state" style="padding:2rem 1rem;">${msg}</div>`;
    return;
  }

  filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  listEl.innerHTML = filteredNotes.map(n => {
    const date     = new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const preview  = n.body
      ? n.body.substring(0, 40).replace(/\n/g, ' ') + (n.body.length > 40 ? '…' : '')
      : 'Empty note';
    const isActive = n.id === activeNoteId ? 'active-note' : '';

    return `
      <div class="note-list-item ${isActive}" data-id="${n.id}">
        <div class="note-list-title">${esc(n.title || 'Untitled Note')}</div>
        <div class="note-list-preview">${esc(preview)}</div>
        <div class="note-list-date">${date}</div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.note-list-item').forEach(item => {
    item.addEventListener('click', () => openNote(item.dataset.id));
  });
}

function openNote(id) {
  const note = Storage.getNotes().find(n => n.id === id);
  if (!note) return;

  activeNoteId     = id;
  isNewUnsavedNote = false;

  document.getElementById('notesSidebar').classList.add('hidden-view');
  document.getElementById('notesEditor').classList.add('active-view');

  document.getElementById('emptyEditor').style.display = 'none';
  document.getElementById('noteEditor').style.display  = 'flex';

  document.getElementById('editNoteTitle').value = note.title || 'Untitled Note';
  document.getElementById('editNoteBody').value  = note.body  || '';

  updateSaveStatus(note.updatedAt || new Date().toISOString());
}

function closeNote() {
  if (activeNoteId) {
    clearTimeout(saveTimeout);
    const title = document.getElementById('editNoteTitle').value.trim();
    const body  = document.getElementById('editNoteBody').value;
    const note  = Storage.getNotes().find(n => n.id === activeNoteId);
    const changed = note && (title !== (note.title || 'Untitled Note') || body !== (note.body || ''));
    if (changed) {
      Storage.updateNote(activeNoteId, title, body);
      isNewUnsavedNote = false;
    }
  }

  if (isNewUnsavedNote && activeNoteId) {
    const title = document.getElementById('editNoteTitle').value.trim();
    const body  = document.getElementById('editNoteBody').value.trim();
    if ((!title || title === 'Untitled Note') && !body) {
      Storage.deleteNote(activeNoteId);
    }
  }

  activeNoteId     = null;
  isNewUnsavedNote = false;

  document.getElementById('notesSidebar').classList.remove('hidden-view');
  document.getElementById('notesEditor').classList.remove('active-view');

  document.getElementById('emptyEditor').style.display = 'flex';
  document.getElementById('noteEditor').style.display  = 'none';

  renderNotesList();
}

function updateSaveStatus(dateStr) {
  const date    = new Date(dateStr);
  const today   = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  if (isToday) {
    document.getElementById('saveStatus').textContent = `Saved at ${timeString}`;
  } else {
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('saveStatus').textContent = `Saved at ${dateString}, ${timeString}`;
  }
}

function triggerAutoSave() {
  if (!activeNoteId) return;

  document.getElementById('saveStatus').textContent = 'Saving…';
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const title = document.getElementById('editNoteTitle').value.trim();
    const body  = document.getElementById('editNoteBody').value;
    Storage.updateNote(activeNoteId, title, body);

    isNewUnsavedNote = false;
    updateSaveStatus(new Date().toISOString());
    renderNotesList();
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  renderNotesList();

  window.addEventListener('beforeunload', () => clearTimeout(saveTimeout));

  document.getElementById('searchNotes').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderNotesList();
  });

  document.getElementById('newNoteBtn').addEventListener('click', () => {
    const newNote = Storage.addNote('', '');
    isNewUnsavedNote = true;
    openNote(newNote.id);
    document.getElementById('editNoteTitle').value = '';
    setTimeout(() => document.getElementById('editNoteTitle').focus(), 100);
  });

  document.getElementById('deleteNoteBtn').addEventListener('click', () => {
    if (activeNoteId) {
      showDialog({
        title: 'Delete Note',
        message: 'Delete this note permanently?',
        confirmText: 'Delete',
        onConfirm: () => {
          Storage.deleteNote(activeNoteId);
          isNewUnsavedNote = false;
          closeNote();
          showToast('Note deleted.', 'success');
        }
      });
    }
  });

  document.getElementById('backToListBtn').addEventListener('click', closeNote);

  document.getElementById('editNoteTitle').addEventListener('input', triggerAutoSave);
  document.getElementById('editNoteBody').addEventListener('input', triggerAutoSave);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!activeNoteId) return;

      clearTimeout(saveTimeout);
      const title = document.getElementById('editNoteTitle').value.trim();
      const body  = document.getElementById('editNoteBody').value;
      Storage.updateNote(activeNoteId, title, body);
      isNewUnsavedNote = false;

      updateSaveStatus(new Date().toISOString());
      renderNotesList();
      showToast('Note saved.', 'success');
    }
  });

  document.getElementById('editNoteBody').addEventListener('paste', e => {
    const titleEl = document.getElementById('editNoteTitle');
    if (titleEl.value.trim() && titleEl.value.trim() !== 'Untitled Note') return;

    setTimeout(() => {
      const body  = document.getElementById('editNoteBody').value;
      const lines = body.split('\n');
      if (lines.length > 1 && lines[0].trim()) {
        titleEl.value = lines[0].trim();
        document.getElementById('editNoteBody').value = lines.slice(1).join('\n').trimStart();
        triggerAutoSave();
      }
    }, 0);
  });
});