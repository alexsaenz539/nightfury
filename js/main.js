/**
 * Night Fury Tattoo - Core Interactive Logic & Animations
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initPortfolioFilter();
  initLightbox();
  initFaqAccordion();
  initScrollReveals();
});

/* --------------------------------------------------------------------------
   1. Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const isExpanded = navLinks.classList.contains('active');
    menuBtn.setAttribute('aria-expanded', isExpanded);
  });

  // Close nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}

/* --------------------------------------------------------------------------
   2. Portfolio Filtering
   -------------------------------------------------------------------------- */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  if (!filterBtns.length || !portfolioItems.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      portfolioItems.forEach(item => {
        const category = item.getAttribute('data-category');

        if (filterValue === 'all' || category === filterValue) {
          item.style.display = 'block';
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (item.style.opacity === '0') {
              item.style.display = 'none';
            }
          }, 250);
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   3. Lightbox Modal
   -------------------------------------------------------------------------- */
function initLightbox() {
  const modal = document.getElementById('lightboxModal');
  const closeBtn = document.getElementById('lightboxClose');
  const modalImg = document.getElementById('lightboxImg');
  const modalTag = document.getElementById('lightboxTag');
  const modalTitle = document.getElementById('lightboxTitle');
  const modalDesc = document.getElementById('lightboxDesc');
  const modalCta = document.getElementById('lightboxCta');

  if (!modal || !closeBtn) return;

  const portfolioItems = document.querySelectorAll('.portfolio-item');

  portfolioItems.forEach(item => {
    item.addEventListener('click', () => {
      const imgSrc = item.querySelector('img')?.src;
      const title = item.getAttribute('data-title');
      const tag = item.getAttribute('data-tag');
      const desc = item.getAttribute('data-desc');

      if (modalImg) modalImg.src = imgSrc;
      if (modalTitle) modalTitle.textContent = title || 'Pieza Personalizada';
      if (modalTag) modalTag.textContent = tag || 'Fine Line';
      if (modalDesc) modalDesc.textContent = desc || 'Diseño exclusivo creado por Jacqueline.';

      if (modalCta) {
        modalCta.href = `https://wa.me/526180000000?text=${encodeURIComponent(`Hola Jacqueline, vi la pieza "${title}" en el portafolio de Night Fury Tattoo y me gustaría cotizar una idea similar.`)}`;
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* --------------------------------------------------------------------------
   4. FAQ Accordion Toggle
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all items
      faqItems.forEach(i => i.classList.remove('active'));

      // Toggle current item
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   5. Scroll Entry Animations (Intersection Observer)
   -------------------------------------------------------------------------- */
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}
