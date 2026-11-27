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

    const elements = inputIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    // Values the form had when it was last loaded or saved.
    let baseline = elements.map(el => el.value);

    const isDirty = () => elements.some((el, i) => el.value !== baseline[i]);

    const markDirty = () => {
        btn.disabled = false;
        btn.style.background = 'var(--warning)';
        btn.style.borderColor = 'var(--warning)';
        btnText.textContent = 'Save Changes *';
    };

    const markClean = () => {
        btn.disabled = true;
        btn.style.background = 'var(--accent)';
        btn.style.borderColor = 'var(--accent)';
        btnText.textContent = 'Save Changes';
    };

    // Amber only while the values really differ from the baseline.
    const sync = () => (isDirty() ? markDirty() : markClean());

    // Callers use this after saving or after filling the form with new values.
    const resetBtn = () => {
        baseline = elements.map(el => el.value);
        markClean();
    };

    elements.forEach(el => {
        el.addEventListener('input', sync);
        el.addEventListener('change', sync);
    });

    resetBtn(); // start disabled
    window.resetUnsavedTracker = resetBtn;

    return resetBtn;
}

/**
 * Returns today's date as a local YYYY-MM-DD string, with no UTC conversion.
 */
function localTodayStr() {
    const now = new Date();
    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
}

/**
 * Validation Helpers
 */
function isPastDate(dateString) {
    // Compare YYYY-MM-DD strings directly — both are local calendar dates,
    // so no UTC conversion is needed or wanted.
    return dateString < localTodayStr();
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
    // Use local date parts — toISOString() returns UTC which can be off by one
    // day for users in timezones behind UTC.
    const todayStr = localTodayStr();
    document.querySelectorAll('.date-input').forEach(input => {
        input.setAttribute('min', todayStr);
    });
}