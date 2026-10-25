// NOTE: esc() is defined in storage.js (loaded before this file)

let activeNoteId      = null;
let searchQuery       = '';
// Track whether the current note was just created (unsaved/empty)
// so we can delete it if the user hits back without typing anything meaningful.
let isNewUnsavedNote  = false;

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

  // Sort by most-recently updated first
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
  // Flush any pending debounced save immediately before nulling activeNoteId,
  // so content typed within the 600ms window is not silently lost.
  if (activeNoteId) {
    clearTimeout(saveTimeout);
    const title = document.getElementById('editNoteTitle').value.trim();
    const body  = document.getElementById('editNoteBody').value;
    if (title || body.trim()) {
      Storage.updateNote(activeNoteId, title, body);
      isNewUnsavedNote = false;
    }
  }

  // Auto-delete guard: remove the note if it was newly created and has no meaningful content.
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
  const date       = new Date(dateStr);
  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  document.getElementById('saveStatus').textContent = `Saved at ${timeString}`;
}

let saveTimeout;
function triggerAutoSave() {
  if (!activeNoteId) return;

  document.getElementById('saveStatus').textContent = 'Saving…';

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const title = document.getElementById('editNoteTitle').value.trim();
    const body  = document.getElementById('editNoteBody').value;
    Storage.updateNote(activeNoteId, title, body);

    // Once the user has actually typed something, it's no longer "unsaved new"
    isNewUnsavedNote = false;

    const now = new Date().toISOString();
    updateSaveStatus(now);

    // FIX: Re-render the full sidebar list after each save so the note floats
    // to the top of the "sorted by updatedAt" list immediately, instead of
    // staying frozen in its old position until the user navigates away.
    renderNotesList();
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  renderNotesList();

  // FIX: Clear the pending autosave timer if the user navigates away mid-debounce,
  // preventing a stale save from firing after the page has begun unloading.
  window.addEventListener('beforeunload', () => clearTimeout(saveTimeout));

  document.getElementById('searchNotes').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderNotesList();
  });

  document.getElementById('newNoteBtn').addEventListener('click', () => {
    const newNote = Storage.addNote('', '');
    // Mark this note as new and unsaved so closeNote can clean it up
    isNewUnsavedNote = true;
    openNote(newNote.id);
    // Clear the default "Untitled Note" title so the placeholder shows instead
    document.getElementById('editNoteTitle').value = '';
    setTimeout(() => document.getElementById('editNoteTitle').focus(), 100);
  });

  document.getElementById('deleteNoteBtn').addEventListener('click', () => {
    if (activeNoteId && confirm('Delete this note permanently?')) {
      Storage.deleteNote(activeNoteId);
      isNewUnsavedNote = false;
      closeNote();
    }
  });

  document.getElementById('backToListBtn').addEventListener('click', closeNote);

  document.getElementById('editNoteTitle').addEventListener('input', triggerAutoSave);
  document.getElementById('editNoteBody').addEventListener('input', triggerAutoSave);
});