(function () {
  const t = localStorage.getItem('sdl-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

function initTheme() {
  const buttons = [
    document.getElementById('themeToggle'),
    document.getElementById('themeToggleMobile')
  ].filter(Boolean);

  if (!buttons.length) return;

  function syncBtns() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    buttons.forEach(btn => {
      if (!btn.querySelector('.toggle-knob')) {
        btn.innerHTML = `<span class="toggle-knob"><i class="fa-solid fa-moon"></i></span>`;
      }
      const icon = btn.querySelector('.toggle-knob i');
      icon.className = `fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`;
      btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    });
  }

  syncBtns();

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('sdl-theme', next);
      syncBtns();
    });
  });
}

function initReset() {
  const btn = document.getElementById('resetAll');
  if (!btn) return;
  btn.addEventListener('click', () => {
    showDialog({
      title: 'Reset All Data',
      message: 'This will permanently delete ALL your tasks, exams, and settings. Are you sure?',
      confirmText: 'Reset Everything',
      onConfirm: () => {
        Object.keys(localStorage)
          .filter(k => k.startsWith('sdl-'))
          .forEach(k => localStorage.removeItem(k));

        const isSubfolder = window.location.pathname.includes('/html/');
        location.href = isSubfolder ? '../index.html' : './index.html';
      }
    });
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isSubfolder = window.location.pathname.includes('/html/');
    const swPath = isSubfolder ? '../sw.js' : './sw.js';

    navigator.serviceWorker.register(swPath).catch((err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initTheme, 10); 
  initReset();
});