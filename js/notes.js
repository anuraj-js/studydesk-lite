function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let activeNoteId = null;

function renderNotesList() {
  const notes = Storage.getNotes();
  const listEl = document.getElementById('notesList');

  if (!notes.length) {
    listEl.innerHTML = '<div class="empty-state" style="padding:2rem 1rem;">No notes yet.<br>Create one to get started.</div>';
    return;
  }

  // Sort by most recently updated
  notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  listEl.innerHTML = notes.map(n => {
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
  renderNotesList(); 

  document.getElementById('emptyEditor').style.display = 'none';
  document.getElementById('noteEditor').style.display = 'flex';

  document.getElementById('editNoteTitle').value = note.title || 'Untitled Note';
  document.getElementById('editNoteBody').value = note.body || '';
  
  updateSaveStatus(note.updatedAt || new Date().toISOString());
}

function closeNote() {
  activeNoteId = null;
  document.getElementById('emptyEditor').style.display = 'flex';
  document.getElementById('noteEditor').style.display = 'none';
  renderNotesList();
}

function updateSaveStatus(dateStr) {
  const date = new Date(dateStr);
  document.getElementById('saveStatus').textContent = `Saved at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
}

// Auto-save logic
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
    
    const listEl = document.getElementById('notesList');
    const activeItem = listEl.querySelector(`[data-id="${activeNoteId}"]`);
    if (activeItem) {
      activeItem.querySelector('.note-list-title').textContent = title || 'Untitled Note';
      activeItem.querySelector('.note-list-preview').textContent = body.substring(0, 40).replace(/\n/g, ' ') + (body.length > 40 ? '...' : '');
    }
  }, 600);
}

// --- Toolbar & Interactive Logic (Runs inside DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {
  renderNotesList();

  document.getElementById('newNoteBtn').addEventListener('click', () => {
    const newNote = Storage.addNote('', '');
    openNote(newNote.id);
    document.getElementById('editNoteTitle').focus();
  });

  document.getElementById('deleteNoteBtn').addEventListener('click', () => {
    if (activeNoteId && confirm('Delete this note permanently?')) {
      Storage.deleteNote(activeNoteId);
      closeNote();
    }
  });

  document.getElementById('editNoteTitle').addEventListener('input', triggerAutoSave);
  
  const textarea = document.getElementById('editNoteBody');

  // 1. Auto-Format Logic (Typing triggers)
  textarea.addEventListener('input', (e) => {
    // We still trigger autosave for every keystroke
    triggerAutoSave(); 

    // Only run formatting if a space was just typed
    if (e.data !== ' ') return; 

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const lastLine = textBeforeCursor.split('\n').pop();

    let replacement = null;

    if (lastLine === '* ') {
      replacement = '• ';
    } else if (lastLine === '/check ') {
      replacement = '☐ ';
    }

    if (replacement) {
      textarea.setRangeText(replacement, cursorPos - lastLine.length, cursorPos, 'end');
      triggerAutoSave(); // Save the replacement
    }
  });

  // 2. Clickable Checkbox Logic
  textarea.addEventListener('click', (e) => {
    const clickX = e.clientX;
    const clickY = e.clientY;
    let clickedIndex = -1;

    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(clickX, clickY);
      if (pos && pos.offsetNode === textarea) clickedIndex = pos.offset;
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(clickX, clickY);
      if (range && range.startContainer === textarea) clickedIndex = range.startOffset;
    }

    if (clickedIndex !== -1) {
      const char = textarea.value[clickedIndex];
      if (char === '☐') {
        textarea.setRangeText('☑', clickedIndex, clickedIndex + 1, 'end');
        triggerAutoSave();
      } else if (char === '☑') {
        textarea.setRangeText('☐', clickedIndex, clickedIndex + 1, 'end');
        triggerAutoSave();
      }
    }
  });

  // 3. Cursor Pointer on Hover
  textarea.addEventListener('mousemove', (e) => {
    const clickX = e.clientX;
    const clickY = e.clientY;
    let hoveredIndex = -1;

    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(clickX, clickY);
      if (pos && pos.offsetNode === textarea) hoveredIndex = pos.offset;
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(clickX, clickY);
      if (range && range.startContainer === textarea) hoveredIndex = range.startOffset;
    }

    if (hoveredIndex !== -1) {
      const char = textarea.value[hoveredIndex];
      if (char === '☐' || char === '☑') {
        textarea.style.cursor = 'pointer';
        return;
      }
    }
    textarea.style.cursor = 'text'; 
  });

  textarea.addEventListener('mouseleave', () => {
    textarea.style.cursor = 'text';
  });
});