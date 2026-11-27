const PREVIEW_LENGTH = 40;
const SNIPPET_LEAD   = 10;   // characters of context shown before a match
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

function buildPreview(body, query) {
  if (!body) return 'Empty note';

  const flat = body.replace(/\n/g, ' ');
  const idx  = query ? flat.toLowerCase().indexOf(query.toLowerCase()) : -1;

  // Not searching, no body match, or the match is already inside the normal preview.
  if (idx === -1 || idx + query.length <= PREVIEW_LENGTH) {
    return flat.substring(0, PREVIEW_LENGTH) + (flat.length > PREVIEW_LENGTH ? '…' : '');
  }

  // Otherwise show a window of text starting a little before the match.
  const start = Math.max(0, idx - SNIPPET_LEAD);
  const end   = start + PREVIEW_LENGTH;

  return (start > 0 ? '…' : '') +
         flat.substring(start, end) +
         (end < flat.length ? '…' : '');
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

  // Pinned notes first, then newest first within each group.
  filteredNotes.sort((a, b) =>
    Boolean(b.pinned) - Boolean(a.pinned) ||
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  listEl.innerHTML = filteredNotes.map(n => {
    const date    = new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const preview = buildPreview(n.body, searchQuery);

    return `
      <div class="note-list-item${n.pinned ? ' pinned-note' : ''}" data-id="${esc(n.id)}">
        <div class="note-list-text">
          <div class="note-list-title">${highlightText(n.title || DEFAULT_TITLE, searchQuery)}</div>
          <div class="note-list-preview">${highlightText(preview, searchQuery)}</div>
          <div class="note-list-date">${date}</div>
        </div>
        <button type="button" class="note-pin-btn${n.pinned ? ' pinned' : ''}"
                aria-label="Pin note" aria-pressed="${n.pinned ? 'true' : 'false'}"
                title="${n.pinned ? 'Unpin note' : 'Pin note'}">
          <i class="fa-solid fa-thumbtack"></i>
        </button>
      </div>
    `;
  }).join('');
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

  renderWordCount();
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

function renderWordCount() {
  const text  = document.getElementById('editNoteBody').value;
  const count = (text.match(/\S+/g) || []).length;

  document.getElementById('wordCount').textContent =
    `${count.toLocaleString('en-US')} ${count === 1 ? 'word' : 'words'}`;
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

  // One delegated listener: the pin button toggles the pin, anything else opens the note.
  document.getElementById('notesList').addEventListener('click', e => {
    const item = e.target.closest('.note-list-item');
    if (!item) return;

    if (e.target.closest('.note-pin-btn')) {
      const isPinned = Storage.togglePin(item.dataset.id);
      renderNotesList();

      // undefined means the note no longer exists (e.g. deleted in another tab).
      if (isPinned === undefined) return;

      showToast(isPinned ? 'Note pinned.' : 'Note unpinned.', 'success');
      return;
    }

    openNote(item.dataset.id);
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

    renderWordCount();
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