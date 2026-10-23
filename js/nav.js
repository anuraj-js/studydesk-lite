document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  const navBackdrop = document.getElementById('navBackdrop'); // NEW

  if (!hamburgerBtn || !navMenu) return;

  function openMenu() {
    navMenu.classList.add('open');
    if (navBackdrop) navBackdrop.classList.add('active');
    const icon = hamburgerBtn.querySelector('i');
    icon.classList.remove('fa-bars');
    icon.classList.add('fa-xmark');
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    if (navBackdrop) navBackdrop.classList.remove('active');
    const icon = hamburgerBtn.querySelector('i');
    icon.classList.remove('fa-xmark');
    icon.classList.add('fa-bars');
  }

  // Toggle menu open/close with the hamburger button
  hamburgerBtn.addEventListener('click', () => {
    if (navMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when a link is clicked
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu when clicking the backdrop (the empty space on the left)
  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMenu);
  }
});