const Storage = {

  // ── Tasks ──────────────────────────────────────
  getTasks() {
    return JSON.parse(localStorage.getItem('sdl-tasks') || '[]');
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

  // ── Exams ──────────────────────────────────────
  getExams() {
    return JSON.parse(localStorage.getItem('sdl-exams') || '[]');
  },
  _saveExams(exams) {
    localStorage.setItem('sdl-exams', JSON.stringify(exams));
  },
  addExam({ name, subject, date }) {
    const exams = this.getExams();
    const exam = {
      id: Date.now().toString(),
      name,
      subject,
      date,
      topics: []
    };
    exams.push(exam);
    exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    this._saveExams(exams);
    return exam;
  },
  updateExam(id, { name, subject, date }) {
    const exams = this.getExams();
    const idx = exams.findIndex(e => e.id === id);
    if (idx === -1) return;
    exams[idx] = { ...exams[idx], name, subject, date };
    exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    this._saveExams(exams);
    return exams[idx];
  },
  deleteExam(id) {
    this._saveExams(this.getExams().filter(e => e.id !== id));
  },

  // ── Topics ─────────────────────────────────────
  addTopic(examId, text) {
    const exams = this.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    exam.topics = exam.topics || [];
    exam.topics.push({ id: Date.now().toString(), text, completed: false });
    this._saveExams(exams);
  },
  toggleTopic(examId, topicId) {
    const exams = this.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    const topic = (exam.topics || []).find(t => t.id === topicId);
    if (topic) topic.completed = !topic.completed;
    this._saveExams(exams);
  },
  deleteTopic(examId, topicId) {
    const exams = this.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    exam.topics = (exam.topics || []).filter(t => t.id !== topicId);
    this._saveExams(exams);
  },

  // ── Pomodoro ───────────────────────────────────
  getPomodoroSettings() {
    const defaults = { work: 25, shortBreak: 5, longBreak: 15, longBreakAfter: 4 };
    return Object.assign(defaults, JSON.parse(localStorage.getItem('sdl-pomo-settings') || '{}'));
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
  }
};