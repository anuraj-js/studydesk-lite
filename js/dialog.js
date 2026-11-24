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
                <button class="modal-close" id="dialogCloseBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="margin-bottom: 1.5rem; font-size: 0.95rem; color: var(--text-muted);">
                ${message}
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="btn btn-ghost" id="dialogCancelBtn">${cancelText}</button>
                <button class="btn btn-danger" id="dialogConfirmBtn">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeDialog = () => overlay.remove();
    const handleConfirm = () => { closeDialog(); if (onConfirm) onConfirm(); };
    const handleCancel = () => { closeDialog(); if (onCancel) onCancel(); };

    overlay.querySelector('#dialogConfirmBtn').addEventListener('click', handleConfirm);
    overlay.querySelector('#dialogCancelBtn').addEventListener('click', handleCancel);
    overlay.querySelector('#dialogCloseBtn').addEventListener('click', handleCancel);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) handleCancel();
    });
}