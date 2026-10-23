function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let activeNoteId = null;
let searchQuery = "";

function renderNotesList() {
  const notes = Storage.getNotes();
  const listEl = document.getElementById('notesList');

  // Filter by search query
  const filteredNotes = notes.filter(n => {
    const title = (n.title || '').toLowerCase();
    const body = (n.body || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return title.includes(q) || body.includes(q);
  });

  if (!filteredNotes.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:2rem 1rem;">${searchQuery ? 'No notes match your search.' : 'No notes yet.<br>Create one to get started.'}</div>`;
    return;
  }

  // Sort by most recently updated
  filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  listEl.innerHTML = filteredNotes.map(n => {
    const date = new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const preview = n.body ? n.body.substring(0, 40).replace(/\n/g, ' ') + (n.body.length > 40 ? '...' : '') : 'Empty note';
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
    item.addEventListener('click', () => {
      openNote(item.dataset.id);
    });
  });
}

function openNote(id) {
  const note = Storage.getNotes().find(n => n.id === id);
  if (!note) return;

  activeNoteId = id;
  
  document.getElementById('notesSidebar').classList.add('hidden-view');
  document.getElementById('notesEditor').classList.add('active-view');

  document.getElementById('emptyEditor').style.display = 'none';
  document.getElementById('noteEditor').style.display = 'flex';

  document.getElementById('editNoteTitle').value = note.title || 'Untitled Note';
  document.getElementById('editNoteBody').value = note.body || '';
  
  updateSaveStatus(note.updatedAt || new Date().toISOString());
}

function closeNote() {
  activeNoteId = null;
  
  document.getElementById('notesSidebar').classList.remove('hidden-view');
  document.getElementById('notesEditor').classList.remove('active-view');

  document.getElementById('emptyEditor').style.display = 'flex';
  document.getElementById('noteEditor').style.display = 'none';

  renderNotesList();
}

function updateSaveStatus(dateStr) {
  const date = new Date(dateStr);
  document.getElementById('saveStatus').textContent = `Saved at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
}

let saveTimeout;
function triggerAutoSave() {
  if (!activeNoteId) return;
  
  document.getElementById('saveStatus').textContent = 'Saving...';
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const title = document.getElementById('editNoteTitle').value.trim();
    const body = document.getElementById('editNoteBody').value;
    Storage.updateNote(activeNoteId, title, body);
    
    const now = new Date().toISOString();
    updateSaveStatus(now);
    
    // Silently update list item
    const listEl = document.getElementById('notesList');
    const activeItem = listEl.querySelector(`[data-id="${activeNoteId}"]`);
    if (activeItem) {
      activeItem.querySelector('.note-list-title').textContent = title || 'Untitled Note';
      activeItem.querySelector('.note-list-preview').textContent = body.substring(0, 40).replace(/\n/g, ' ') + (body.length > 40 ? '...' : '');
    }
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  renderNotesList();

  // Search Bar Logic
  document.getElementById('searchNotes').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderNotesList();
  });

  document.getElementById('newNoteBtn').addEventListener('click', () => {
    const newNote = Storage.addNote('', '');
    openNote(newNote.id);
    setTimeout(() => document.getElementById('editNoteTitle').focus(), 100);
  });

  document.getElementById('deleteNoteBtn').addEventListener('click', () => {
    if (activeNoteId && confirm('Delete this note permanently?')) {
      Storage.deleteNote(activeNoteId);
      closeNote();
    }
  });

  document.getElementById('backToListBtn').addEventListener('click', closeNote);

  document.getElementById('editNoteTitle').addEventListener('input', triggerAutoSave);
  document.getElementById('editNoteBody').addEventListener('input', triggerAutoSave);
});