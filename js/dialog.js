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

    const cancelBtn = overlay.querySelector('#dialogCancelBtn');
    const confirmBtn = overlay.querySelector('#dialogConfirmBtn');
    const closeBtn = overlay.querySelector('#dialogCloseBtn');

    // Focus the Cancel button by default so Enter doesn't instantly delete things
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

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) handleCancel(e);
    });

    // Handle Enter key if the confirm button is explicitly focused
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.key === 'Enter') {
                if (document.activeElement === confirmBtn) {
                    handleConfirm();
                } else if (document.activeElement === cancelBtn || document.activeElement === closeBtn) {
                    handleCancel();
                }
            }
        }
    });
}