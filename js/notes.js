const DEFAULT_TITLE        = 'Untitled Note';
const NON_PASTE_INPUT_TYPES = ['historyUndo', 'historyRedo', 'insertReplacementText'];

let activeNoteId      = null;
let searchQuery       = '';
let isNewUnsavedNote  = false;
let saveTimeout;
let lastBodyLength    = 0;

const isDefaultTitle = t => !t.trim() || t.trim() === DEFAULT_TITLE;

function readEditor() {
  return {
    title: document.getElementById('editNoteTitle').value.trim(),
    body:  document.getElementById('editNoteBody').value
  };
}

function setEditorOpen(isOpen) {
  document.getElementById('notesSidebar').classList.toggle('hidden-view', isOpen);
  document.getElementById('notesEditor').classList.toggle('active-view', isOpen);
  document.getElementById('emptyEditor').style.display = isOpen ? 'none' : 'flex';
  document.getElementById('noteEditor').style.display  = isOpen ? 'flex' : 'none';
}

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
      <div class="note-list-item ${isActive}" data-id="${esc(n.id)}">
        <div class="note-list-title">${esc(n.title || DEFAULT_TITLE)}</div>
        <div class="note-list-preview">${esc(preview)}</div>
        <div class="note-list-date">${date}</div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.note-list-item').forEach(item => {
    item.addEventListener('click', () => openNote(item.dataset.id));
  });
}

function openNote(id, isNew = false) {
  const note = Storage.getNotes().find(n => n.id === id);
  if (!note) return;

  activeNoteId     = id;
  isNewUnsavedNote = isNew;

  setEditorOpen(true);

  document.getElementById('editNoteTitle').value = note.title || DEFAULT_TITLE;
  document.getElementById('editNoteBody').value  = note.body  || '';
  lastBodyLength = (note.body || '').length;

  updateSaveStatus(note.updatedAt || new Date().toISOString());
}

function closeNote() {
  // Saves pending changes, or deletes a new note that is still empty.
  flushActiveNote();

  activeNoteId     = null;
  isNewUnsavedNote = false;

  setEditorOpen(false);

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

function saveActiveNote() {
  const { title, body } = readEditor();

  Storage.updateNote(activeNoteId, title, body);
  isNewUnsavedNote = false;

  updateSaveStatus(new Date().toISOString());
  renderNotesList();
}

function triggerAutoSave() {
  if (!activeNoteId) return;

  document.getElementById('saveStatus').textContent = 'Saving…';

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveActiveNote, 600);
}

function flushActiveNote() {
  clearTimeout(saveTimeout);

  if (!activeNoteId) return;

  const { title, body } = readEditor();

  // Delete newly created notes that are still completely empty.
  if (isNewUnsavedNote && isDefaultTitle(title) && !body.trim()) {
    Storage.deleteNote(activeNoteId);
    return;
  }

  const note = Storage.getNotes().find(n => n.id === activeNoteId);
  if (!note) return;

  const changed =
    title !== (note.title || DEFAULT_TITLE) ||
    body  !== (note.body  || '');

  if (changed) {
    Storage.updateNote(activeNoteId, title, body);
  }

  isNewUnsavedNote = false;
}

// If the title is empty/default, moves the first line of the body into the title.
function autoTitleFromBody(titleEl, bodyEl) {
  if (!isDefaultTitle(titleEl.value)) return;

  const lines = bodyEl.value.split('\n');

  if (lines.length > 1 && lines[0].trim()) {
    titleEl.value  = lines[0].trim();
    bodyEl.value   = lines.slice(1).join('\n').trimStart();
    lastBodyLength = bodyEl.value.length;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNotesList();

  window.addEventListener('pagehide', flushActiveNote);

  // If the browser restores this page from the back/forward cache, reload it so the
  // editor can't show a note that pagehide already deleted.
  window.addEventListener('pageshow', e => {
    if (e.persisted) location.reload();
  });

  document.getElementById('searchNotes').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderNotesList();
  });

  document.getElementById('newNoteBtn').addEventListener('click', () => {
    const newNote = Storage.addNote('', '');

    // Pass true so openNote() preserves the new-note status.
    openNote(newNote.id, true);

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

  document.getElementById('editNoteBody').addEventListener('input', e => {
    const bodyEl  = e.target;
    const titleEl = document.getElementById('editNoteTitle');

    const inserted = bodyEl.value.length - lastBodyLength;
    lastBodyLength = bodyEl.value.length;

    // Ctrl+V, the paste menu, or the keyboard clipboard strip all add many characters at once.
    const isBulkInsert =
      e.inputType === 'insertFromPaste' ||
      (!NON_PASTE_INPUT_TYPES.includes(e.inputType) && inserted > 1 && !e.isComposing);

    if (isBulkInsert) autoTitleFromBody(titleEl, bodyEl);

    triggerAutoSave();
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!activeNoteId) return;

      clearTimeout(saveTimeout);
      saveActiveNote();
      showToast('Note saved.', 'success');
    }
  });
});