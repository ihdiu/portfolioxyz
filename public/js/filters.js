// Skill Domain Tabs and Project Filter Bar
export function initFilters() {
  // 1. Skill Domain Tabs (CS vs Electronics)
  const skillTabs = document.querySelectorAll('.skill-domain-nav .tab-btn');
  const skillGroups = document.querySelectorAll('.skill-domain-group');

  skillTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetDomain = tab.getAttribute('data-domain');

      skillTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      skillGroups.forEach((group) => {
        if (group.getAttribute('data-domain') === targetDomain) {
          group.style.display = 'grid';
          setTimeout(() => {
            group.style.opacity = '1';
            group.style.transform = 'translateY(0)';
          }, 10);
        } else {
          group.style.opacity = '0';
          group.style.transform = 'translateY(8px)';
          setTimeout(() => {
            group.style.display = 'none';
          }, 200);
        }
      });
    });
  });

  // 2. Project Domain Filter
  const projectFilters = document.querySelectorAll('.project-filters .filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  projectFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      projectFilters.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      projectCards.forEach((card) => {
        const cardDomain = card.getAttribute('data-domain');
        const isMatch = filter === 'all' || cardDomain === filter;

        if (isMatch) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}
