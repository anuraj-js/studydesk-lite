// ── Shared utility ─────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

const Storage = {
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
      id: Date.now().toString(),
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

  // ── Exams ──────────────────────────────────────
  getExams() {
    try {
      return JSON.parse(localStorage.getItem('sdl-exams') || '[]');
    } catch { return []; }
  },
  _saveExams(exams) {
    localStorage.setItem('sdl-exams', JSON.stringify(exams));
  },
  addExam({ name, subject, date, time }) {
    const exams = this.getExams();
    const exam = {
      id: Date.now().toString(),
      name,
      subject,
      date,
      time, 
      topics: []
    };
    exams.push(exam);
    // Sort by date AND time
    exams.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    this._saveExams(exams);
    return exam;
  },
  updateExam(id, { name, subject, date, time }) {
    const exams = this.getExams();
    const idx = exams.findIndex(e => e.id === id);
    if (idx === -1) return;
    // Spread existing first so topics are preserved, add time
    exams[idx] = { ...exams[idx], name, subject, date, time }; 
    exams.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    this._saveExams(exams);
    return exams[idx];
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
    exam.topics.push({ id: Date.now().toString(), text, completed: false });
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

  // ── Pomodoro ───────────────────────────────────
  getPomodoroSettings() {
    try {
      const defaults = {
        work: 25, workSec: 0,
        shortBreak: 5, shortSec: 0,
        longBreak: 15, longSec: 0,
        longBreakAfter: 4
      };
      return Object.assign(defaults, JSON.parse(localStorage.getItem('sdl-pomo-settings') || '{}'));
    } catch {
      return {
        work: 25, workSec: 0,
        shortBreak: 5, shortSec: 0,
        longBreak: 15, longSec: 0,
        longBreakAfter: 4
      };
    }
  },
  savePomodoroSettings(s) {
    localStorage.setItem('sdl-pomo-settings', JSON.stringify(s));
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
      id: Date.now().toString(),
      title: title || 'Untitled Note',
      body:  body  || '',
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
  deleteNote(id) {
    this._saveNotes(this.getNotes().filter(n => n.id !== id));
  }
};