document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  const navBackdrop = document.getElementById('navBackdrop');

  if (!hamburgerBtn || !navMenu) return;

  function openMenu() {
    navMenu.classList.add('open');
    if (navBackdrop) navBackdrop.classList.add('active');
    hamburgerBtn.classList.add('fa-xmark');      
    const icon = hamburgerBtn.querySelector('i');
    icon.classList.remove('fa-bars');
    icon.classList.add('fa-xmark');
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    if (navBackdrop) navBackdrop.classList.remove('active');
    hamburgerBtn.classList.remove('fa-xmark');    
    const icon = hamburgerBtn.querySelector('i');
    icon.classList.remove('fa-xmark');
    icon.classList.add('fa-bars');
  }

  hamburgerBtn.addEventListener('click', () => {
    if (navMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMenu);
  }
});