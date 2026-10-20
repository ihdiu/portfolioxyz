// Project Detail Modal with Native <dialog>, Deep Linking & Focus Management
export function initModal() {
  const dialog = document.getElementById('project-modal');
  const modalContentContainer = document.getElementById('project-modal-content');
  if (!dialog || !modalContentContainer) return;

  let lastActiveElement = null;

  function openProjectModal(projectId, updateHash = true) {
    const template = document.getElementById(`project-modal-${projectId}`);
    if (!template) return;

    lastActiveElement = document.activeElement;

    // Clone template content into dialog
    modalContentContainer.innerHTML = '';
    const content = template.content.cloneNode(true);
    modalContentContainer.appendChild(content);

    // Setup close button inside template
    const closeBtn = modalContentContainer.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Show modal
    dialog.showModal();

    const slug = template.getAttribute('data-slug');
    if (updateHash && slug) {
      window.history.replaceState(null, '', `#project-${slug}`);
    }
  }

  function closeModal() {
    dialog.close();
    document.body.style.overflow = '';
    modalContentContainer.innerHTML = '';

    // Remove hash if project hash
    if (window.location.hash.startsWith('#project-')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Return focus to triggering card
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  // Card click triggers
  document.querySelectorAll('[data-project-id]').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Don't open modal if clicked a direct link (like repo/demo buttons if any on card)
      if (e.target.closest('a')) return;
      const projectId = card.getAttribute('data-project-id');
      openProjectModal(projectId);
    });

    // Keyboard Accessibility (Enter/Space on card)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const projectId = card.getAttribute('data-project-id');
        openProjectModal(projectId);
      }
    });
  });

  // Backdrop click closes dialog
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      closeModal();
    }
  });

  // ESC key
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeModal();
  });

  // Deep linking: check URL hash on load
  function checkHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#project-')) {
      const slug = hash.replace('#project-', '');
      const matchingTemplate = document.querySelector(`template[data-slug="${slug}"]`);
      if (matchingTemplate) {
        const id = matchingTemplate.getAttribute('id').replace('project-modal-', '');
        openProjectModal(id, false);
      }
    }
  }

  window.addEventListener('hashchange', checkHash);
  checkHash();
}
