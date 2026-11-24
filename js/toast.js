/**
 * Displays a toast notification in the top-right corner.
 * @param {string} message 
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    let borderColor, iconClass;
    if (type === 'success') {
        borderColor = 'var(--success)';
        iconClass = 'fa-solid fa-circle-check';
    } else if (type === 'warning') {
        borderColor = 'var(--warning)';
        iconClass = 'fa-solid fa-triangle-exclamation';
    } else if (type === 'error') {
        borderColor = 'var(--danger)';
        iconClass = 'fa-solid fa-circle-exclamation';
    } else {
        borderColor = 'var(--accent)';
        iconClass = 'fa-solid fa-circle-info';
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeft = `4px solid ${borderColor}`;

    toast.innerHTML = `
        <i class="${iconClass}" style="color: ${borderColor}; font-size: 1.1rem;"></i>
        <span style="flex: 1;">${message}</span>
        <button class="toast-close">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const timeoutId = setTimeout(() => {
        removeToast(toast);
    }, 4000);

    closeBtn.addEventListener('click', () => {
        clearTimeout(timeoutId);
        removeToast(toast);
    });
}

function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
        toast.remove();
    }, 300);
}