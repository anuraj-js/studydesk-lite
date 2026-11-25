/**
 * Displays a custom confirmation dialog using the existing modal CSS.
 */
function showDialog({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    overlay.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3>${title}</h3>
                <button type="button" class="modal-close" id="dialogCloseBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="margin-bottom: 1.5rem; font-size: 0.95rem; color: var(--text-muted);">
                ${message}
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button type="button" class="btn btn-ghost" id="dialogCancelBtn">${cancelText}</button>
                <button type="button" class="btn btn-danger" id="dialogConfirmBtn">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 1. Instantly focus the Cancel button so the Enter key has a target.
    const cancelBtn = overlay.querySelector('#dialogCancelBtn');
    cancelBtn.focus();

    const closeDialog = () => {
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
        overlay.remove();
    };

    const handleConfirm = (e) => { 
        if (e) e.preventDefault();
        closeDialog(); 
        if (onConfirm) onConfirm(); 
    };
    const handleCancel = (e) => { 
        if (e) e.preventDefault();
        closeDialog(); 
        if (onCancel) onCancel(); 
    };

    overlay.querySelector('#dialogConfirmBtn').addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.querySelector('#dialogCloseBtn').addEventListener('click', handleCancel);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) handleCancel(e);
    });

    // 2. Kill any Enter/Space keystrokes inside the dialog so they don't trigger page shortcuts.
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            // If user pressed Enter, let's act like they clicked Confirm
            if (e.key === 'Enter' && document.activeElement === cancelBtn) {
               // Do nothing, cancel is focused, let click handle it 
            }
        }
    });
}