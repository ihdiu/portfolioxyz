// Hero Terminal Typing Effect
export function initTyping() {
  const container = document.getElementById('terminal-typed');
  if (!container) return;

  const rawRoles = container.getAttribute('data-roles') || '';
  const roles = rawRoles.split(',').map((r) => r.trim()).filter(Boolean);

  if (roles.length === 0) return;

  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionOff = document.documentElement.getAttribute('data-motion') === 'off';
  if (prefersReduced || motionOff) {
    container.textContent = roles[0];
    return;
  }

  let roleIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let typingSpeed = 90;

  function typeTick() {
    const currentRole = roles[roleIdx];

    if (isDeleting) {
      container.textContent = currentRole.substring(0, charIdx - 1);
      charIdx--;
      typingSpeed = 40;
    } else {
      container.textContent = currentRole.substring(0, charIdx + 1);
      charIdx++;
      typingSpeed = 80;
    }

    if (!isDeleting && charIdx === currentRole.length) {
      // Finished typing full word - pause at end
      isDeleting = true;
      typingSpeed = 1800;
    } else if (isDeleting && charIdx === 0) {
      // Finished deleting - move to next role
      isDeleting = false;
      roleIdx = (roleIdx + 1) % roles.length;
      typingSpeed = 400;
    }

    setTimeout(typeTick, typingSpeed);
  }

  // Initial delay
  setTimeout(typeTick, 600);
}
