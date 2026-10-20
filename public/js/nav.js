// Navigation Scroll Spy, Sticky Blur & Mobile Menu
export function initNav() {
  const nav = document.querySelector('.site-nav');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const mobileToggle = document.querySelector('.nav-mobile-toggle');
  const navLinksContainer = document.querySelector('.nav-links');

  // 1. Sticky blur on scroll
  function handleScroll() {
    if (window.scrollY > 40) {
      nav?.classList.add('is-scrolled');
    } else {
      nav?.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 2. Mobile Menu Toggle
  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinksContainer.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });

    links.forEach((link) => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Scroll-spy
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          links.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  // 4. Back to Top Button
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    const handleBackToTopVisibility = () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
    };

    window.addEventListener('scroll', handleBackToTopVisibility, { passive: true });
    handleBackToTopVisibility();

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  sections.forEach((sec) => spyObserver.observe(sec));
}
