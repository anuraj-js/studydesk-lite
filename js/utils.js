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

/**
 * Validation Helpers (Added for Phase 5)
 */
function isPastDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
}

function isPastDateTime(dateString, timeString) {
    if (!dateString || !timeString) return false;
    
    const now = new Date();
    const localNowStr = now.getFullYear() + '-' + 
                        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(now.getDate()).padStart(2, '0') + ' ' + 
                        String(now.getHours()).padStart(2, '0') + ':' + 
                        String(now.getMinutes()).padStart(2, '0');

    const selected = dateString + ' ' + timeString.substring(0, 5);
    
    return selected < localNowStr;
}

/**
 * Escapes text and highlights the matching search query.
 */
function highlightText(text, query) {
    if (!query) return esc(text);
    
    const escapedText = esc(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    return escapedText.replace(regex, '<span class="search-highlight">$1</span>');
}

/**
 * Initializes the accordion behavior for Help pages.
 * Safe to include globally; does nothing if help elements aren't on the page.
 */
function initHelpAccordion() {
    const toggleButtons = document.querySelectorAll('.help-toggle-btn');
    if (!toggleButtons.length) return; // Exit if not on a Help page

    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.nextElementSibling;
            const chevron = btn.querySelector('.help-chevron');
            const isOpen = content.style.display === 'block';

            // Close all other open sections
            document.querySelectorAll('.help-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.help-chevron').forEach(el => el.style.transform = 'rotate(0deg)');

            // If it was closed, open it now
            if (!isOpen) {
                content.style.display = 'block';
                chevron.style.transform = 'rotate(180deg)';
            }
        });
    });
}

// Automatically initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initHelpAccordion);