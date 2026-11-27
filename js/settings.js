document.addEventListener('DOMContentLoaded', () => {
    // ── Backup configuration ──────────────────────

    const BACKUP_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    const ALLOWED_KEYS = new Set([
        'sdl-tasks',
        'sdl-exams',
        'sdl-notes',
        'sdl-pomo-settings',
        'sdl-pomo-date',
        'sdl-pomo-count',
        'sdl-username',
        'sdl-clock-24',
        'sdl-theme'
    ]);

    // Validate a YYYY-MM-DD date without accepting invalid dates.
    function isValidDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const date = new Date(value + 'T00:00:00Z');

        return !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value;
    }

    function isValidTimestamp(value) {
        return typeof value === 'string' &&
            value.trim() !== '' &&
            !Number.isNaN(Date.parse(value));
    }

    function isPlainObject(value) {
        return value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value);
    }

    // IDs are placed into HTML attributes, so restrict them to a safe set.
    // This matches both old numeric IDs and UUIDs.
    function isValidId(value) {
        return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
    }

    function hasUniqueIds(items) {
        return new Set(items.map(item => item.id)).size === items.length;
    }

    function isValidTask(task) {
        return isPlainObject(task) &&
            isValidId(task.id) &&
            typeof task.title === 'string' &&
            typeof task.completed === 'boolean' &&
            ['low', 'medium', 'high'].includes(task.priority) &&
            typeof task.dueDate === 'string' &&
            (task.dueDate === '' || isValidDate(task.dueDate)) &&
            isValidTimestamp(task.createdAt);
    }

    function isValidTopic(topic) {
        return isPlainObject(topic) &&
            isValidId(topic.id) &&
            typeof topic.text === 'string' &&
            typeof topic.completed === 'boolean';
    }

    function isValidExam(exam) {
        return isPlainObject(exam) &&
            isValidId(exam.id) &&
            typeof exam.name === 'string' &&
            typeof exam.subject === 'string' &&
            isValidDate(exam.date) &&
            typeof exam.time === 'string' &&
            (exam.time === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(exam.time)) &&
            (exam.topics === undefined ||
                (Array.isArray(exam.topics) &&
                    exam.topics.every(isValidTopic) &&
                    hasUniqueIds(exam.topics)));
    }

    function isValidNote(note) {
        return isPlainObject(note) &&
            isValidId(note.id) &&
            typeof note.title === 'string' &&
            typeof note.body === 'string' &&
            isValidTimestamp(note.createdAt) &&
            isValidTimestamp(note.updatedAt);
    }

    // Uses the same limits as storage.js and the Pomodoro page.
    function isValidPomodoroSettings(settings) {
        if (!isPlainObject(settings)) return false;

        const limits = Storage.POMODORO_LIMITS;
        const keys = Object.keys(settings);

        if (
            !keys.length ||
            keys.some(key => !Object.prototype.hasOwnProperty.call(limits, key))
        ) {
            return false;
        }

        return keys.every(key => {
            const value = settings[key];
            const [min, max] = limits[key];

            return Number.isInteger(value) && value >= min && value <= max;
        });
    }

    // Validate all backup keys and their stored values.
    function validateBackup(data) {
        if (!isPlainObject(data)) {
            throw new Error('Backup must contain a JSON object.');
        }

        const keys = Object.keys(data);

        if (!keys.length) {
            throw new Error('Backup contains no data.');
        }

        const unknownKeys = keys.filter(key => !ALLOWED_KEYS.has(key));

        if (unknownKeys.length) {
            throw new Error('Backup contains unsupported storage keys.');
        }

        const parsed = {};

        for (const key of keys) {
            if (typeof data[key] !== 'string') {
                throw new Error(`Invalid value for ${key}.`);
            }

            try {
                switch (key) {
                    case 'sdl-tasks': {
                        const value = JSON.parse(data[key]);

                        if (!Array.isArray(value) || !value.every(isValidTask) || !hasUniqueIds(value)) {
                            throw new Error();
                        }

                        parsed[key] = value;
                        break;
                    }

                    case 'sdl-exams': {
                        const value = JSON.parse(data[key]);

                        if (!Array.isArray(value) || !value.every(isValidExam) || !hasUniqueIds(value)) {
                            throw new Error();
                        }

                        parsed[key] = value;
                        break;
                    }

                    case 'sdl-notes': {
                        const value = JSON.parse(data[key]);

                        if (!Array.isArray(value) || !value.every(isValidNote) || !hasUniqueIds(value)) {
                            throw new Error();
                        }

                        parsed[key] = value;
                        break;
                    }

                    case 'sdl-pomo-settings': {
                        const value = JSON.parse(data[key]);

                        if (!isValidPomodoroSettings(value)) {
                            throw new Error();
                        }

                        parsed[key] = value;
                        break;
                    }

                    case 'sdl-pomo-date':
                        if (data[key].trim() === '') {
                            throw new Error();
                        }

                        parsed[key] = data[key];
                        break;

                    case 'sdl-pomo-count': {
                        const value = Number(data[key]);

                        if (
                            !/^\d+$/.test(data[key]) ||
                            !Number.isSafeInteger(value)
                        ) {
                            throw new Error();
                        }

                        parsed[key] = value;
                        break;
                    }

                    case 'sdl-username':
                        if (!data[key].trim()) {
                            throw new Error();
                        }

                        parsed[key] = data[key];
                        break;

                    case 'sdl-clock-24':
                        if (!['0', '1'].includes(data[key])) {
                            throw new Error();
                        }

                        parsed[key] = data[key];
                        break;

                    case 'sdl-theme':
                        if (!['dark', 'light'].includes(data[key])) {
                            throw new Error();
                        }

                        parsed[key] = data[key];
                        break;
                }
            } catch {
                throw new Error(`Invalid backup data: ${key}.`);
            }
        }

        return { keys, parsed };
    }

    // ── 1. Initialize Username with Amber Button Tracker ──

    const usernameInput = document.getElementById('usernameInput');

    if (usernameInput) {
        const savedName = localStorage.getItem('sdl-username') || 'Student';
        usernameInput.value = savedName;

        const resetTracker = initUnsavedChangesTracker(
            ['usernameInput'],
            'saveUsernameBtn',
            'saveUsernameBtnText'
        );

        const saveUsername = () => {
            const val = usernameInput.value.trim();

            if (!val) {
                showToast('Name cannot be empty.', 'error');
                return;
            }

            localStorage.setItem('sdl-username', val);

            if (typeof renderNav === 'function') {
                renderNav();
                initMobileMenu();
                // renderNav() rebuilds the theme buttons, so set up their icons and click handlers again.
                if (typeof initTheme === 'function') initTheme();
            }

            resetTracker();

            showToast('Display name saved.', 'success');
        };

        document.getElementById('saveUsernameBtn').addEventListener('click', saveUsername);

        usernameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveUsername();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                usernameInput.value = localStorage.getItem('sdl-username') || 'Student';
                resetTracker();
            }
        });
    }

    // ── 2. Export Data ────────────────────────────

    document.getElementById('exportBtn').addEventListener('click', () => {
        try {
            const data = {};

            Object.keys(localStorage)
                .filter(key => key.startsWith('sdl-'))
                .forEach(key => {
                    data[key] = localStorage.getItem(key);
                });

            const blob = new Blob(
                [JSON.stringify(data, null, 2)],
                { type: 'application/json' }
            );

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = `studydesk-backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => URL.revokeObjectURL(url), 100);

            showToast('Data exported successfully.', 'success');
        } catch (error) {
            console.error('Backup export failed:', error);
            showToast('Unable to export data.', 'error');
        }
    });

    // ── 3. Import Data ────────────────────────────

    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');

    importBtn.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', e => {
        const file = e.target.files[0];

        if (!file) return;

        // Allow selecting the same file again later.
        const resetFileInput = () => {
            importInput.value = '';
        };

        if (file.size === 0 || file.size > BACKUP_MAX_SIZE) {
            showToast(
                file.size > BACKUP_MAX_SIZE
                    ? 'Backup file is too large. Maximum size is 5 MB.'
                    : 'Backup file is empty.',
                'error'
            );

            resetFileInput();
            return;
        }

        if (
            file.type &&
            file.type !== 'application/json' &&
            !file.name.toLowerCase().endsWith('.json')
        ) {
            showToast('Please select a JSON backup file.', 'error');
            resetFileInput();
            return;
        }

        const reader = new FileReader();

        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);

                // Validate everything before touching existing data.
                const backup = validateBackup(data);

                showDialog({
                    title: 'Import Data',
                    message: 'This will overwrite your current data for the included backup sections. Continue?',
                    confirmText: 'Import',

                    onConfirm: () => {
                        // Preserve current values for rollback.
                        const previousValues = {};

                        backup.keys.forEach(key => {
                            previousValues[key] = localStorage.getItem(key);
                        });

                        try {
                            // Apply the validated backup.
                            backup.keys.forEach(key => {
                                localStorage.setItem(key, data[key]);
                            });

                            showToast('Import successful!', 'success');

                            setTimeout(() => location.reload(), 1000);
                        } catch (error) {
                            console.error('Backup import failed:', error);

                            // Restore previous values if import fails.
                            try {
                                backup.keys.forEach(key => {
                                    const previous = previousValues[key];

                                    if (previous === null) {
                                        localStorage.removeItem(key);
                                    } else {
                                        localStorage.setItem(key, previous);
                                    }
                                });

                                showToast(
                                    'Import failed. Previous data has been restored.',
                                    'error'
                                );
                            } catch (rollbackError) {
                                console.error('Backup rollback failed:', rollbackError);

                                showToast(
                                    'Import and rollback failed. Check your browser storage.',
                                    'error'
                                );
                            }
                        }
                    }
                });

            } catch (error) {
                console.error('Invalid backup:', error);

                showToast(
                    error.message || 'Invalid backup file.',
                    'error'
                );
            } finally {
                resetFileInput();
            }
        };

        reader.onerror = () => {
            showToast('Unable to read backup file.', 'error');
            resetFileInput();
        };

        reader.readAsText(file);
    });

    // ── 4. Reset All Data ─────────────────────────

    document.getElementById('resetAll').addEventListener('click', () => {
        showDialog({
            title: 'Reset All Data',
            message: 'This will permanently delete ALL your tasks, exams, and settings. Are you sure?',
            confirmText: 'Reset Everything',

            onConfirm: () => {
                Object.keys(localStorage)
                    .filter(key => key.startsWith('sdl-'))
                    .forEach(key => localStorage.removeItem(key));

                location.href = '../index.html';
            }
        });
    });
});