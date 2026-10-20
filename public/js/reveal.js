// IntersectionObserver for scroll reveals and animated skill bars
export function initReveal() {
  const root = document.documentElement;
  // Mark JS active so initial hidden states are enabled
  root.classList.add('js');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1,
  };

  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');

        // Animate skill bars if inside this revealed element
        const bars = entry.target.querySelectorAll('.skill-bar-fill');
        bars.forEach((bar) => {
          const target = bar.getAttribute('data-proficiency') || '50';
          bar.style.width = `${target}%`;
        });

        // Animate LED segments if present
        const ledTracks = entry.target.querySelectorAll('.skill-led-track');
        ledTracks.forEach((track) => {
          const pct = Number(track.getAttribute('data-proficiency')) || 50;
          const segments = track.querySelectorAll('.skill-led-segment');
          const litCount = Math.round((pct / 100) * segments.length);
          segments.forEach((seg, idx) => {
            if (idx < litCount) {
              setTimeout(() => {
                seg.classList.add('lit');
              }, idx * 40);
            }
          });
        });

        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach((el) => {
    revealObserver.observe(el);
  });
}
