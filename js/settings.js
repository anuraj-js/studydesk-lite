document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Username with Amber Button Tracker
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.value = localStorage.getItem('sdl-username') || 'Student';
        
        // Initialize the tracker from utils.js
        initUnsavedChangesTracker(['usernameInput'], 'saveUsernameBtn', 'saveUsernameBtnText');

        document.getElementById('saveUsernameBtn').addEventListener('click', () => {
            const val = usernameInput.value.trim();
            if (!val) {
                showToast('Name cannot be empty.', 'error');
                return;
            }
            localStorage.setItem('sdl-username', val);
            
            // Re-render navbar to update the sidebar name
            if (typeof renderNav === 'function') renderNav();
            
            // Reset button color
            window.resetProfileSaveBtn();
            
            showToast('Display name saved.', 'success');
        });
    }

    // 2. Export Data
    document.getElementById('exportBtn').addEventListener('click', () => {
        const data = {};
        Object.keys(localStorage)
            .filter(k => k.startsWith('sdl-'))
            .forEach(k => data[k] = localStorage.getItem(k));

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `studydesk-backup-${new Date().toISOString().slice(0,10)}.json`;

        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        showToast('Data exported successfully.', 'success');
    });

    // 3. Import Data
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });

    document.getElementById('importInput').addEventListener('change', e => {
        if (!e.target.files[0]) return;
        
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                const keys = Object.keys(data).filter(k => k.startsWith('sdl-'));
                if (!keys.length) { showToast('Invalid backup file.', 'error'); return; }
                
                showDialog({
                    title: 'Import Data',
                    message: 'This will overwrite your current data. Continue?',
                    confirmText: 'Import',
                    onConfirm: () => {
                        keys.forEach(k => localStorage.setItem(k, data[k]));
                        showToast('Import successful!', 'success');
                        setTimeout(() => location.reload(), 1000);
                    }
                });
            } catch {
                showToast('Invalid backup file.', 'error');
            }
        };
        reader.readAsText(e.target.files[0]);
    });

    // 4. Reset All Data
    document.getElementById('resetAll').addEventListener('click', () => {
        showDialog({
            title: 'Reset All Data',
            message: 'This will permanently delete ALL your tasks, exams, and settings. Are you sure?',
            confirmText: 'Reset Everything',
            onConfirm: () => {
                Object.keys(localStorage)
                    .filter(k => k.startsWith('sdl-'))
                    .forEach(k => localStorage.removeItem(k));

                location.href = '../index.html';
            }
        });
    });
});