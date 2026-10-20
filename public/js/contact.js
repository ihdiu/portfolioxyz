// Contact Form AJAX Submission with Client Validation, CSRF & Inline Feedback
export function initContact() {
  const form = document.getElementById('contact-form');
  const statusBox = document.getElementById('contact-status');
  const submitBtn = document.getElementById('contact-submit-btn');

  if (!form || !statusBox || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    clearFieldErrors();
    statusBox.style.display = 'none';
    statusBox.className = '';
    statusBox.textContent = '';

    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());

    // Basic client validation
    let hasError = false;
    if (!body.name || body.name.trim().length === 0) {
      showFieldError('name', 'Please enter your name.');
      hasError = true;
    }
    if (!body.email || !body.email.includes('@')) {
      showFieldError('email', 'Please enter a valid email address.');
      hasError = true;
    }
    if (!body.message || body.message.trim().length < 10) {
      showFieldError('message', 'Message must be at least 10 characters long.');
      hasError = true;
    }

    if (hasError) return;

    // Disable button & show spinner state
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-send" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> Transmitting signal...';

    const csrfToken = form.getAttribute('data-csrf') || body._csrf;

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        statusBox.className = 'alert alert-success';
        statusBox.textContent = data.message || 'Signal transmission confirmed.';
        statusBox.style.display = 'block';
        form.reset();
      } else {
        statusBox.className = 'alert alert-error';
        statusBox.textContent = data.message || 'Transmission failed.';
        statusBox.style.display = 'block';

        if (data.errors) {
          for (const [field, msg] of Object.entries(data.errors)) {
            showFieldError(field, msg);
          }
        }
      }
    } catch (err) {
      statusBox.className = 'alert alert-error';
      statusBox.textContent = 'Transmission interrupted by network anomaly. Please try again.';
      statusBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  function showFieldError(field, msg) {
    const errorEl = document.getElementById(`error-${field}`);
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
    const inputEl = form.querySelector(`[name="${field}"]`);
    if (inputEl) {
      inputEl.style.borderColor = 'var(--danger)';
    }
  }

  function clearFieldErrors() {
    form.querySelectorAll('.field-error-msg').forEach((el) => {
      el.textContent = '';
      el.style.display = 'none';
    });
    form.querySelectorAll('.input-field').forEach((el) => {
      el.style.borderColor = '';
    });
  }
}
