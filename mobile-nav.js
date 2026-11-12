(() => {
  const button = document.querySelector('.mobile-menu-toggle');
  const nav = document.getElementById('mobile-menu');
  if (!button || !nav) return;
  const mobile = window.matchMedia('(width < 768px)');

  function setOpen(open) {
    nav.classList.toggle('open', open);
    button.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  mobile.addEventListener('change', () => {
    if (!mobile.matches) setOpen(false);
  });
  button.addEventListener('click', () => {
    if (mobile.matches) setOpen(!nav.classList.contains('open'));
  });
  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('open')) return;
    if (event.target.closest('#mobile-menu a') || (!nav.contains(event.target) && !button.contains(event.target))) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      button.focus();
    }
  });
})();
