document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  const navBackdrop = document.getElementById('navBackdrop');

  if (!hamburgerBtn || !navMenu) return;

  function openMenu() {
    navMenu.classList.add('open');
    if (navBackdrop) navBackdrop.classList.add('active');
    
    // FIX: Add the generic 'open' class to the button for CSS positioning,
    // instead of 'fa-xmark' which was causing the duplicate icon box bug.
    hamburgerBtn.classList.add('open');      
    
    // Change the icon inside the button to the X
    const icon = hamburgerBtn.querySelector('i');
    icon.classList.remove('fa-bars');
    icon.classList.add('fa-xmark');
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    if (navBackdrop) navBackdrop.classList.remove('active');
    
    // FIX: Remove the generic 'open' class from the button
    hamburgerBtn.classList.remove('open');    
    
    // Change the icon back to the hamburger bars
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