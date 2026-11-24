document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject the Navbar and Sidebar
    renderNav();

    // 2. Initialize the mobile menu logic
    initMobileMenu();
});

function renderNav() {
    const appShell = document.getElementById('appShell');
    if (!appShell) return; // Exit if the placeholder isn't on the page

    // Determine current page for active states
    const path = window.location.pathname;
    let activePage = 'home';
    
    if (path.includes('tasks.html')) activePage = 'tasks';
    else if (path.includes('exams.html')) activePage = 'exams';
    else if (path.includes('pomodoro.html')) activePage = 'pomodoro';
    else if (path.includes('notes.html')) activePage = 'notes';
    else if (path.includes('settings.html')) activePage = 'settings';
    else if (path.includes('help.html')) activePage = 'help';

    const isSubfolder = path.includes('/html/');
    const prefix = isSubfolder ? '' : 'html/';
    const homePrefix = isSubfolder ? '../index.html' : 'index.html';

    const activeClass = (page) => activePage === page ? 'active' : '';

    // Get username for the sidebar profile
    const userName = localStorage.getItem('sdl-username') || 'Student';

    const navHTML = `
    <nav class="navbar">
        <a href="${homePrefix}" class="nav-brand">
            <img src="${isSubfolder ? '../' : ''}images/studydesk_lite_logo.svg" alt="StudyDesk Lite" />
        </a>

        <button class="hamburger" id="hamburgerBtn">
            <i class="fa-solid fa-bars"></i>
        </button>

        <div class="nav-menu" id="navMenu">
            <div class="nav-links">
                <a href="${homePrefix}" class="${activeClass('home')}"><i class="fa-solid fa-house"></i> Home</a>
                <a href="${prefix}tasks.html" class="${activeClass('tasks')}"><i class="fa-solid fa-list-check"></i> Task Manager</a>
                <a href="${prefix}exams.html" class="${activeClass('exams')}"><i class="fa-solid fa-book-open"></i> Exam Planner</a>
                <a href="${prefix}pomodoro.html" class="${activeClass('pomodoro')}"><i class="fa-solid fa-clock"></i> Pomodoro</a>
                <a href="${prefix}notes.html" class="${activeClass('notes')}"><i class="fa-solid fa-note-sticky"></i> Notes</a>
                <a href="${prefix}settings.html" class="${activeClass('settings')}"><i class="fa-solid fa-user"></i> Settings</a>
                <a href="${prefix}help.html" class="${activeClass('help')}"><i class="fa-solid fa-circle-question"></i> Help & Support</a>
            </div>
            <div class="nav-right-actions">
                <button id="themeToggle" class="theme-btn"></button>
            </div>
        </div>
        <div class="nav-backdrop" id="navBackdrop"></div>
    </nav>

    <div class="mobile-sidebar" id="mobileSidebar">
        <button class="sidebar-close-btn" id="sidebarCloseBtn">
            <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="sidebar-profile">
            <div class="sidebar-avatar">
                <i class="fa-solid fa-user"></i>
            </div>
            <div class="sidebar-name">${userName}</div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-heading">WORKSPACE</div>
            <a href="${homePrefix}" class="sidebar-link ${activeClass('home')}"><i class="fa-solid fa-house"></i> Home</a>
            <a href="${prefix}tasks.html" class="sidebar-link ${activeClass('tasks')}"><i class="fa-solid fa-list-check"></i> Task Manager</a>
            <a href="${prefix}exams.html" class="sidebar-link ${activeClass('exams')}"><i class="fa-solid fa-book-open"></i> Exam Planner</a>
            <a href="${prefix}pomodoro.html" class="sidebar-link ${activeClass('pomodoro')}"><i class="fa-solid fa-clock"></i> Pomodoro</a>
            <a href="${prefix}notes.html" class="sidebar-link ${activeClass('notes')}"><i class="fa-solid fa-note-sticky"></i> Notes</a>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-heading">APPEARANCE</div>
            <div class="sidebar-theme-toggle">
                <span><i class="fa-solid fa-moon"></i> Dark Mode</span>
                <button id="themeToggleMobile" class="theme-btn"></button>
            </div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-heading">ACCOUNT</div>
            <a href="${prefix}settings.html" class="sidebar-link ${activeClass('settings')}"><i class="fa-solid fa-user"></i> Settings</a>
            <a href="${prefix}help.html" class="sidebar-link ${activeClass('help')}"><i class="fa-solid fa-circle-question"></i> Help & Support</a>
        </div>
    </div>
    `;

    appShell.innerHTML = navHTML;
}

function initMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const navBackdrop = document.getElementById('navBackdrop');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

    if (hamburgerBtn && mobileSidebar && navBackdrop) {
        function openMenu() {
            mobileSidebar.classList.add('open');
            navBackdrop.classList.add('active');
        }

        function closeMenu() {
            mobileSidebar.classList.remove('open');
            navBackdrop.classList.remove('active');
        }

        hamburgerBtn.addEventListener('click', openMenu);
        navBackdrop.addEventListener('click', closeMenu);
        if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMenu);

        mobileSidebar.querySelectorAll('a:not(#resetAllMobile)').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
}