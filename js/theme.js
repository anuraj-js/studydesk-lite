(function () {
  const t = localStorage.getItem('sdl-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

function initTheme() {
  // Since nav is injected dynamically, we look for both desktop and mobile toggles
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

// Wait for DOM to load, then wait a tiny bit for nav.js to inject the HTML
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initTheme, 10); 
});