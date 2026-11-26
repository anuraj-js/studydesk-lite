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
 * Tracks changes on form inputs and marks the submit button as dirty.
 * The button is disabled when clean, enabled + amber when dirty.
 * Returns a reset function so callers can reset the button independently.
 * For backward compatibility, also exposes the latest reset via
 * window.resetProfileSaveBtn (preserving existing behavior).
 */
function initUnsavedChangesTracker(inputIds, btnId, textSpanId) {
    const btn = document.getElementById(btnId);
    const btnText = document.getElementById(textSpanId);
    if (!btn || !btnText) return () => {};

    const markDirty = () => {
        btn.disabled = false;
        btn.style.background = 'var(--warning)';
        btn.style.borderColor = 'var(--warning)';
        btnText.textContent = 'Save Changes *';
    };

    const resetBtn = () => {
        btn.disabled = true;
        btn.style.background = 'var(--accent)';
        btn.style.borderColor = 'var(--accent)';
        btnText.textContent = 'Save Changes';
    };

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', markDirty);
            el.addEventListener('change', markDirty);
        }
    });

    resetBtn(); // start disabled
    window.resetUnsavedTracker = resetBtn;

    return resetBtn;
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

            document.querySelectorAll('.help-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.help-chevron').forEach(el => el.style.transform = 'rotate(0deg)');

            if (!isOpen) {
                content.style.display = 'block';
                chevron.style.transform = 'rotate(180deg)';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initHelpAccordion);

function initDateInputsMinToday() {
    const todayStr = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.date-input').forEach(input => {
        input.setAttribute('min', todayStr);
    });
}