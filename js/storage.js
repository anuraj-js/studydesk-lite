const Storage = {
  // ── IDs ────────────────────────────────────────
  // crypto.randomUUID() only exists in secure contexts (HTTPS / localhost),
  // so fall back to other methods when it is unavailable.
  _newId() {
    const c = globalThis.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    if (c && typeof c.getRandomValues === 'function') {
      const b = c.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  },

  // ── Tasks ──────────────────────────────────────
  getTasks() {
    try {
      return JSON.parse(localStorage.getItem('sdl-tasks') || '[]');
    } catch { return []; }
  },
  _saveTasks(tasks) {
    localStorage.setItem('sdl-tasks', JSON.stringify(tasks));
  },
  addTask({ title, priority, dueDate }) {
    const tasks = this.getTasks();
    const task = {
      id: this._newId(),
      title,
      priority: priority || 'medium',
      dueDate: dueDate || '',
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(task);
    this._saveTasks(tasks);
    return task;
  },
  toggleTask(id) {
    const tasks = this.getTasks();
    const t = tasks.find(t => t.id === id);
    if (t) t.completed = !t.completed;
    this._saveTasks(tasks);
  },
  deleteTask(id) {
    this._saveTasks(this.getTasks().filter(t => t.id !== id));
  },
  updateTask(id, { title, priority, dueDate }) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx].title    = title;
      tasks[idx].priority = priority;
      tasks[idx].dueDate  = dueDate;
      this._saveTasks(tasks);
    }
  },
  reorderTasks(visibleOrderedIds) {
    const allTasks = this.getTasks();
    const visibleSet = new Set(visibleOrderedIds);
    const reorderedVisible = visibleOrderedIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean);
    let vIndex = 0;
    const newAllTasks = allTasks.map(t => {
      if (visibleSet.has(t.id)) return reorderedVisible[vIndex++];
      return t;
    });
    this._saveTasks(newAllTasks);
  },

  // ── Exams ──────────────────────────────────────
  getExams() {
    try {
      return JSON.parse(localStorage.getItem('sdl-exams') || '[]');
    } catch { return []; }
  },
  _saveExams(exams) {
    localStorage.setItem('sdl-exams', JSON.stringify(exams));
  },
  // Exams without a time sort as end-of-day.
  _examTs(e) {
    return new Date(e.date + 'T' + (e.time || '23:59'));
  },
  addExam({ name, subject, date, time }) {
    const exams = this.getExams();
    const exam = {
      id: this._newId(),
      name,
      subject,
      date,
      time,
      topics: []
    };
    exams.push(exam);
    exams.sort((a, b) => this._examTs(a) - this._examTs(b));
    this._saveExams(exams);
    return exam;
  },
  updateExam(id, { name, subject, date, time }) {
    const exams = this.getExams();
    const idx = exams.findIndex(e => e.id === id);
    if (idx === -1) return;
    exams[idx] = { ...exams[idx], name, subject, date, time };
    exams.sort((a, b) => this._examTs(a) - this._examTs(b));
    this._saveExams(exams);
    return exams.find(e => e.id === id);
  },
  deleteExam(id) {
    this._saveExams(this.getExams().filter(e => e.id !== id));
  },

  // ── Topics ─────────────────────────────────────
  addTopic(examId, text) {
    const exams = this.getExams();
    const exam  = exams.find(e => e.id === examId);
    if (!exam) return;
    exam.topics = exam.topics || [];
    exam.topics.push({ id: this._newId(), text, completed: false });
    this._saveExams(exams);
  },
  toggleTopic(examId, topicId) {
    const exams = this.getExams();
    const exam  = exams.find(e => e.id === examId);
    if (!exam) return;
    const topic = (exam.topics || []).find(t => t.id === topicId);
    if (topic) topic.completed = !topic.completed;
    this._saveExams(exams);
  },
  deleteTopic(examId, topicId) {
    const exams = this.getExams();
    const exam  = exams.find(e => e.id === examId);
    if (!exam) return;
    exam.topics = (exam.topics || []).filter(t => t.id !== topicId);
    this._saveExams(exams);
  },
  updateTopic(examId, topicId, text) {
    const exams = this.getExams();
    const exam  = exams.find(e => e.id === examId);
    if (!exam) return;
    const topic = (exam.topics || []).find(t => t.id === topicId);
    if (!topic) return;
    topic.text = text;
    this._saveExams(exams);
  },
  reorderTopics(examId, orderedIds) {
    const exams = this.getExams();
    const exam  = exams.find(e => e.id === examId);
    if (!exam) return;
    const byId = {};
    (exam.topics || []).forEach(t => { byId[t.id] = t; });
    const reordered = orderedIds.map(id => byId[id]).filter(Boolean);
    (exam.topics || []).forEach(t => {
      if (!orderedIds.includes(t.id)) reordered.push(t);
    });
    exam.topics = reordered;
    this._saveExams(exams);
  },

  // ── Pomodoro ───────────────────────────────────
  POMODORO_DEFAULTS: {
    work: 25, workSec: 0,
    shortBreak: 5, shortSec: 0,
    longBreak: 15, longSec: 0,
    longBreakAfter: 4
  },

  // [min, max] for each setting. These match the inputs on the Pomodoro page.
  POMODORO_LIMITS: {
    work: [0, 180],       workSec: [0, 59],
    shortBreak: [0, 30], shortSec: [0, 59],
    longBreak: [0, 60],  longSec: [0, 59],
    longBreakAfter: [1, 10]
  },

  _validatePomodoroSettings(s) {
    const result = {};
    for (const key of Object.keys(this.POMODORO_DEFAULTS)) {
      const [min, max] = this.POMODORO_LIMITS[key];
      const value = s ? s[key] : undefined;
      result[key] = (Number.isInteger(value) && value >= min && value <= max)
        ? value
        : this.POMODORO_DEFAULTS[key];
    }
    return result;
  },
  getPomodoroSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem('sdl-pomo-settings') || '{}');
      return this._validatePomodoroSettings(raw);
    } catch {
      return { ...this.POMODORO_DEFAULTS };
    }
  },
  savePomodoroSettings(s) {
    localStorage.setItem('sdl-pomo-settings', JSON.stringify(this._validatePomodoroSettings(s)));
  },
  getTodaySessions() {
    const today = new Date().toDateString();
    if (localStorage.getItem('sdl-pomo-date') !== today) return 0;
    return parseInt(localStorage.getItem('sdl-pomo-count') || '0');
  },
  recordSession() {
    const today = new Date().toDateString();
    if (localStorage.getItem('sdl-pomo-date') !== today) {
      localStorage.setItem('sdl-pomo-date', today);
      localStorage.setItem('sdl-pomo-count', '1');
      return 1;
    }
    const n = this.getTodaySessions() + 1;
    localStorage.setItem('sdl-pomo-count', n.toString());
    return n;
  },

  // ── Notes ──────────────────────────────────────
  getNotes() {
    try {
      return JSON.parse(localStorage.getItem('sdl-notes') || '[]');
    } catch { return []; }
  },
  _saveNotes(notes) {
    localStorage.setItem('sdl-notes', JSON.stringify(notes));
  },
  addNote(title, body) {
    const notes = this.getNotes();
    const note  = {
      id: this._newId(),
      title: title || 'Untitled Note',
      body:  body  || '',
      pinned: false,
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString()
    };
    notes.unshift(note);
    this._saveNotes(notes);
    return note;
  },
  updateNote(id, title, body) {
    const notes = this.getNotes();
    const idx   = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      notes[idx].title     = title || 'Untitled Note';
      notes[idx].body      = body;
      notes[idx].updatedAt = new Date().toISOString();
      this._saveNotes(notes);
    }
  },
  togglePin(id) {
    const notes = this.getNotes();
    const note  = notes.find(n => n.id === id);
    if (!note) return;
    note.pinned = !note.pinned;
    this._saveNotes(notes);
    return note.pinned;
  },
  deleteNote(id) {
    this._saveNotes(this.getNotes().filter(n => n.id !== id));
  }
};