(function () {
  const t = localStorage.getItem('sdl-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  function syncBtn() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  syncBtn();
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sdl-theme', next);
    syncBtn();
  });
}

function initReset() {
  const btn = document.getElementById('resetAll');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (confirm('This will permanently delete ALL your tasks, exams, and settings. Are you sure?')) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sdl-'))
        .forEach(k => localStorage.removeItem(k));
      
      // FIXED: Dynamically redirect to index.html whether you are in the root or the /html/ folder
      const isSubfolder = window.location.pathname.includes('/html/');
      location.href = isSubfolder ? '../index.html' : './index.html';
    }
  });
}

function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .bottom-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // FIXED: Dynamically find sw.js whether you are on index.html or tasks.html
    const isSubfolder = window.location.pathname.includes('/html/');
    const swPath = isSubfolder ? '../sw.js' : './sw.js';
    
    navigator.serviceWorker.register(swPath).catch((err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initReset();
  setActiveNav();
});