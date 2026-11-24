/**
 * Escapes HTML characters to prevent XSS.
 */
function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Tracks changes on form inputs and visually marks the submit button.
 * @param {string[]} inputIds - Array of input/select IDs to watch.
 * @param {string} btnId - The ID of the submit button.
 * @param {string} textSpanId - The ID of the span inside the button that holds the text.
 */
function initUnsavedChangesTracker(inputIds, btnId, textSpanId) {
    const btn = document.getElementById(btnId);
    const btnText = document.getElementById(textSpanId);
    if (!btn || !btnText) return;

    const markDirty = () => {
        btn.style.background = 'var(--warning)';
        btn.style.borderColor = 'var(--warning)';
        btnText.textContent = 'Save Changes *';
    };

    const resetBtn = () => {
        btn.style.background = 'var(--accent)';
        btn.style.borderColor = 'var(--accent)';
        btnText.textContent = 'Save Changes';
    };

    // Listen to text inputs, selects, and radio buttons
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', markDirty);
            el.addEventListener('change', markDirty);
        }
    });

    // Handle radio buttons (they share a name, not a single ID)
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', markDirty);
    });

    // Expose a way to reset the button when saved successfully
    window.resetProfileSaveBtn = resetBtn;
}