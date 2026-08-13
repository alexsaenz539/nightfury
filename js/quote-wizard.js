/**
 * Night Fury Tattoo - Interactive Quotation Wizard & WhatsApp Generator
 */

document.addEventListener('DOMContentLoaded', () => {
  initQuoteWizard();
});

function initQuoteWizard() {
  const openBtns = document.querySelectorAll('.open-quote-modal');
  const modal = document.getElementById('quoteModal');
  const closeBtn = document.getElementById('quoteClose');
  const wizardForm = document.getElementById('quoteWizardForm');
  const nextBtn = document.getElementById('wizardNextBtn');
  const prevBtn = document.getElementById('wizardPrevBtn');
  const submitBtn = document.getElementById('wizardSubmitBtn');
  const progressBar = document.getElementById('quoteProgressBar');

  if (!modal || !wizardForm) return;

  let currentStep = 1;
  const totalSteps = 3;

  // Open Modal
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      showStep(1);
    });
  });

  // Close Modal
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Step Navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
          currentStep++;
          showStep(currentStep);
        }
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }
    });
  }

  // Chip selections
  const placementChips = document.querySelectorAll('.option-chip');
  placementChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.getAttribute('data-group');
      document.querySelectorAll(`.option-chip[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');

      const targetInput = document.getElementById(group);
      if (targetInput) targetInput.value = chip.getAttribute('data-value');
    });
  });

  function showStep(step) {
    currentStep = step;

    document.querySelectorAll('.wizard-step').forEach((el, index) => {
      if (index + 1 === step) {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });

    if (progressBar) {
      progressBar.style.width = `${(step / totalSteps) * 100}%`;
    }

    if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = step === totalSteps ? 'none' : 'inline-flex';
    if (submitBtn) submitBtn.style.display = step === totalSteps ? 'inline-flex' : 'none';
  }

  function validateStep(step) {
    const stepEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
    if (!stepEl) return true;

    const requiredInputs = stepEl.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        input.style.borderColor = 'var(--accent-red)';
        isValid = false;
      } else {
        input.style.borderColor = 'var(--border-subtle)';
      }
    });

    return isValid;
  }

  // Form Submit -> WhatsApp Redirect
  wizardForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    const name = document.getElementById('quoteName')?.value || 'Cliente';
    const idea = document.getElementById('quoteIdea')?.value || 'Diseño personalizado';
    const style = document.getElementById('quoteStyle')?.value || 'Fine Line / Blackwork';
    const placement = document.getElementById('quotePlacement')?.value || 'Brazo';
    const size = document.getElementById('quoteSize')?.value || '10 cm';
    const color = document.getElementById('quoteColor')?.value || 'Tinta negra';

    // WhatsApp formatted string
    const message = `⚡ *NUEVA COTIZACIÓN - NIGHT FURY TATTOO*\n\n` +
      `👤 *Nombre:* ${name}\n` +
      `✦ *Idea / Referencia:* ${idea}\n` +
      `✦ *Estilo deseado:* ${style}\n` +
      `📍 *Zona del cuerpo:* ${placement}\n` +
      `📏 *Tamaño aprox:* ${size}\n` +
      `🎨 *Tinta / Color:* ${color}\n` +
      `📍 *Ubicación:* Durango, Dgo.\n\n` +
      `*Mensaje enviado desde la landing page.*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/526180000000?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    closeModal();
    wizardForm.reset();
    showStep(1);
  });
}
