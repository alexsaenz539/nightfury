import { useEffect, useRef, useState } from 'react';
import Admin from './Admin.jsx';
// import { CardCoverFlow } from '@/components/cards/CardCoverFlow';
import { getPublicContent } from './lib/public-content.js';

const steps = [
  ['Tu Idea', 'Nos compartes tus referencias, zona del cuerpo y tamaño aproximado a través del formulario o WhatsApp.'],
  ['Cotización', 'Analizamos la viabilidad, horas estimadas de sesión y te damos un presupuesto transparente.'],
  ['Reserva & Anticipo', 'Agendamos la fecha en el estudio y confirmamos con un anticipo para preparar tu diseño.'],
  ['Propuesta de Diseño', 'Recibes el boceto personalizado previamente para revisar detalles, escala y ajustes.'],
  ['La Sesión', 'Sesión en estudio privado con ambiente cómodo, playlist a tu gusto y máxima higiene.'],
  ['Cuidados & Seguimiento', 'Te entregamos la guía de cuidados y parches protectores de segunda piel para asegurar tu curación.']
];

const Arrow = () => <span className="btn-icon-wrapper" aria-hidden="true">→</span>;
const Check = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
const imageSource = image => image?.startsWith('http') || image?.startsWith('/') ? image : `/img/${image}`;
const whatsappNumber = value => value?.replace(/\D/g, '') || '';
const instagramHandle = value => value?.replace(/^@/, '') || '';

export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <Admin />;
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedWork, setSelectedWork] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [content, setContent] = useState({ works: [], services: [], faqs: [], hero: null, settings: null });
  const revealRef = useRef(null);

  useEffect(() => {
    const elements = revealRef.current?.querySelectorAll('[data-reveal]') ?? [];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    elements.forEach((element, index) => {
      element.classList.add('reveal-on-scroll');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedWork || quoteOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedWork, quoteOpen]);

  useEffect(() => {
    let active = true;
    getPublicContent().then(data => {
      if (!active) return;
      setContent(current => ({
        works: data.works || [],
        services: data.services || [],
        faqs: data.faqs || [],
        hero: data.hero,
        settings: data.settings
      }));
      if (data.settings?.seo_title) document.title = data.settings.seo_title;
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const openQuote = () => { setStep(1); setQuoteOpen(true); };
  const closeOverlays = () => { setSelectedWork(null); setQuoteOpen(false); };
  const hero = content.hero || {};
  const settings = content.settings || {};
  const instagram = instagramHandle(settings.instagram);
  const whatsapp = whatsappNumber(settings.whatsapp);

  return <div ref={revealRef}>
    <header className="header-nav">
      <a href="#hero" className="brand-logo" aria-label="Night Fury Tattoo"><span className="brand-monogram"><img src="/img/logo.png" alt="" /></span></a>
      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        {[['portafolio', 'Portafolio'], ['artista', 'La Artista'], ['estilos', 'Estilos'], ['proceso', 'Proceso'], ['higiene', 'Higiene & FAQ']].map(([id, label]) => <li key={id}><a href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a></li>)}
        <li className="mobile-cta-item"><button className="btn btn-primary" onClick={openQuote}>Cotizar mi tatuaje →</button></li>
      </ul>
      <div className="nav-actions"><button className="btn btn-primary desktop-cta" onClick={openQuote}>Cotizar mi tatuaje <Arrow /></button><button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú" aria-expanded={menuOpen}>☰</button></div>
    </header>

    <main>
      {content.hero && <section id="hero" className="hero-section"><div className="hero-bg-media"><video autoPlay muted loop playsInline aria-hidden="true"><source src="/videos/fondo.mp4" type="video/mp4" /></video></div><div className="hero-watermark">NF</div><div className="container hero-content"><div className="eyebrow">{hero.eyebrow}</div><h1 className="hero-headline">{hero.title}</h1><p className="hero-lead">{hero.description}</p><div className="hero-actions"><button className="btn btn-primary" onClick={openQuote}>Cotizar <Arrow /></button><a href="#portafolio" className="btn btn-secondary">Portafolio</a></div><div className="hero-meta">{settings.location && <span className="pill-badge">{settings.location}</span>}{instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="pill-badge">@{instagram}</a>}{settings.hours && <span className="pill-badge">{settings.hours}</span>}</div></div></section>}
      <div className="section-divider" />

      {content.works.length > 0 && <section id="portafolio" className="section"><div className="container"><div className="portfolio-header"><div data-reveal><div className="eyebrow">02 · PORTAFOLIO</div><h2>Trabajos recientemente ejecutados</h2></div><ul className="filter-bar">{[['all', 'Todos'], ...Array.from(new Map(content.works.map(work => [work[0], work[2]])).entries())].map(([value, label]) => <li key={value}><button className={`filter-btn ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)}>{label}</button></li>)}</ul></div><div className="mx-auto h-[650px] max-w-7xl"><CardCoverFlow key={filter} images={content.works.filter(work => filter === 'all' || filter === work[0]).map(work => ({ src: imageSource(work[4]), title: work[1] }))} /></div></div></section>}
      <div className="section-divider" />

      <section id="artista" className="section"><div className="container about-grid"><div className="about-image-card" data-reveal><img src="/img/artist-studio.png" alt="Night Fury Tattoo Artist Studio" /><div className="artist-badge"><div><strong>Jacqueline</strong><span>Tatuadora & Creadora de Night Fury</span></div><a href="https://instagram.com/jacqueline_bdz" target="_blank" rel="noreferrer" className="btn btn-secondary">@jacqueline_bdz</a></div></div><div data-reveal><div className="eyebrow">03 · LA ARTISTA</div><h2>Sensibilidad artística con actitud propia</h2><p>Crear un tatuaje es un proceso de confianza mutua. Mi compromiso en <strong>Night Fury Tattoo</strong> es ofrecerte un espacio seguro, limpio y libre de juicios donde tu referencia o idea abstracta se traduzca en una pieza limpia y perdurable.</p><br /><p>Me especializo en trazos delicados, composiciones oscuras, contraste de tinta roja y piezas con significado personal.</p><div className="artist-stats"><div><strong>100%</strong><span>Diseños adaptados al cuerpo</span></div><div><strong>Durango</strong><span>Atención por cita previa</span></div></div></div></div></section>
      <div className="section-divider" />

      <section id="estilos" className="section"><div className="container"><div className="eyebrow" data-reveal>04 · SERVICIOS</div><h2 data-reveal>Estilos y especialidades</h2><p>Piezas personalizadas diseñadas partiendo de tu idea o referencia visual.</p><div className="services-grid">{content.services.map(([title, text]) => <div className="double-bezel" data-reveal key={title}><div className="double-bezel-inner"><div className="service-mark">✦</div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div></section>
      <div className="section-divider" />

      <section id="proceso" className="section"><div className="container"><div className="eyebrow" data-reveal>05 · PASO A PASO</div><h2 data-reveal>El proceso sin complicaciones</h2><p>Desde el primer mensaje hasta los cuidados posteriores.</p><div className="process-grid">{steps.map(([title, text], index) => <div className="step-card" data-reveal key={title}><div className="step-num">PASO {String(index + 1).padStart(2, '0')}</div><h3 className="step-title">{title}</h3><p>{text}</p></div>)}</div></div></section>
      <div className="section-divider" />

      <section id="higiene" className="section"><div className="container"><div className="hygiene-grid"><div data-reveal><div className="eyebrow">06 · SEGURIDAD SANITARIA</div><h2>Tu salud e higiene son prioridad absoluta</h2><p>Trabajamos bajo estándares clínicos rigurosos para garantizar que tu sesión sea completamente segura.</p><ul className="hygiene-list">{['Agujas y consumibles 100% esterilizados y desechables.', 'Pigmentos veganos homologados sin metales pesados.', 'Sanitización previa y barreras de protección grado médico.'].map(text => <li key={text}><Check />{text}</li>)}</ul></div><div className="hygiene-image" data-reveal><img src="/img/hygiene-equipment.png" alt="Equipo de tatuaje estéril" /></div></div><div className="faq-heading"><h2>Preguntas Frecuentes</h2><p>Resolvemos tus dudas antes de agendar tu cita.</p></div><div className="faq-accordion">{content.faqs.map(([question, answer], index) => <div className={`faq-item ${faqOpen === index ? 'active' : ''}`} data-reveal key={question}><button className="faq-header" onClick={() => setFaqOpen(faqOpen === index ? null : index)} aria-expanded={faqOpen === index}>{question}<span>⌄</span></button><div className="faq-content"><p>{answer}</p></div></div>)}</div></div></section>

      <section id="contacto" className="section contact-section"><div className="container" data-reveal><div className="eyebrow">07 · COTIZACIÓN DIRECTA</div><h2>¿Listo para darle vida a tu próximo tatuaje?</h2><p>Cuéntanos tu idea. Sin presiones y con respuesta rápida para resolver todas tus dudas sobre diseño, costo y agenda.</p><div className="contact-actions"><button className="btn btn-primary" onClick={openQuote}>Iniciar Cotización Ahora <Arrow /></button><a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="btn btn-secondary">Ver Instagram @{instagram}</a></div></div></section>
    </main>
    <footer><div className="container">Night Fury Tattoo · Estudio Privado de Tatuajes en Durango, Dgo. México · Arte <br />Servicios prestados bajo estricto protocolo de asepsia. Exclusivo para mayores de 18 años.</div></footer>
    <a href={`https://wa.me/${whatsapp}?text=Hola%20Night%20Fury%2C%20quisiera%20cotizar%20un%20tatuaje%20en%20Night%20Fury%20Tattoo.`} target="_blank" rel="noreferrer" className="floating-wa-btn" aria-label="Cotizar por WhatsApp">◔</a>
    {selectedWork && <Lightbox work={selectedWork} onClose={() => setSelectedWork(null)} onQuote={openQuote} />}
    {quoteOpen && <QuoteWizard step={step} setStep={setStep} onClose={closeOverlays} whatsapp={whatsapp} />}
  </div>;
}

function Lightbox({ work, onClose, onQuote }) { return <div className="lightbox-modal active" onClick={event => event.target === event.currentTarget && onClose()}><div className="lightbox-content"><button className="lightbox-close" onClick={onClose} aria-label="Cerrar">×</button><div className="lightbox-image-wrap"><img src={imageSource(work[4])} alt={work[5]} /></div><div className="lightbox-info"><div><span className="portfolio-tag">{work[2]}</span><h3>{work[1]}</h3><p>{work[3]}</p></div><button className="btn btn-primary" onClick={() => { onClose(); onQuote(); }}>Cotizar pieza similar</button></div></div></div>; }

function QuoteWizard({ step, setStep, onClose, whatsapp }) {
  const [form, setForm] = useState({ idea: '', style: 'Fine Line (Trazo Fino)', placement: 'Antebrazo', size: 'Mediano (8 - 14 cm)', color: 'Solo Tinta Negra', name: '' });
  const update = event => setForm({ ...form, [event.target.name]: event.target.value });
  const send = event => { event.preventDefault(); if (!form.name || !form.idea) return; const message = `Hola Night Fury, soy ${form.name}. Quisiera cotizar: ${form.idea}. Estilo: ${form.style}. Zona: ${form.placement}. Tamaño: ${form.size}. Tinta: ${form.color}.`; window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank'); onClose(); };
  return <div className="quote-modal active" onClick={event => event.target === event.currentTarget && onClose()}><div className="quote-box"><button className="lightbox-close" onClick={onClose} aria-label="Cerrar">×</button><div className="eyebrow">COTIZADOR RÁPIDO</div><h3>Cuéntame tu idea para tu tatuaje</h3><div className="quote-progress"><div className="quote-progress-bar" style={{ width: `${step / 3 * 100}%` }} /></div><form onSubmit={send}>{step === 1 && <><label className="form-label">1. ¿Cuál es tu idea o referencia visual?</label><textarea required name="idea" value={form.idea} onChange={update} className="form-textarea" rows="3" placeholder="Ej. Un dragón delicado..." /><label className="form-label">Estilo de preferencia:</label><select name="style" value={form.style} onChange={update} className="form-select"><option>Fine Line (Trazo Fino)</option><option>Blackwork / Sombras</option><option>Microrealismo</option><option>Ilustrativo / Tinta Roja</option></select></>}{step === 2 && <><label className="form-label">2. Zona del cuerpo donde lo deseas:</label><div className="placement-grid">{['Antebrazo', 'Brazo / Hombro', 'Costillas', 'Espalda / Cuello', 'Pierna', 'Muñeca'].map(place => <button type="button" key={place} className={`option-chip ${form.placement === place ? 'selected' : ''}`} onClick={() => setForm({ ...form, placement: place })}>{place}</button>)}</div><label className="form-label">Tamaño aproximado:</label><select name="size" value={form.size} onChange={update} className="form-select"><option>Pequeño (3 - 7 cm)</option><option>Mediano (8 - 14 cm)</option><option>Grande (15 - 25 cm)</option><option>Pieza completa / Manga</option></select></>}{step === 3 && <><label className="form-label">Preferencia de tinta:</label><div className="placement-grid two-columns">{['Solo Tinta Negra', 'Negra + Detalles Rojos'].map(color => <button type="button" key={color} className={`option-chip ${form.color === color ? 'selected' : ''}`} onClick={() => setForm({ ...form, color })}>{color}</button>)}</div><label className="form-label">Tu nombre:</label><input required name="name" value={form.name} onChange={update} className="form-input" placeholder="Ej. Valeria" /></>}<div className="wizard-actions">{step > 1 && <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>Anterior</button>}{step < 3 ? <button type="button" className="btn btn-primary" onClick={() => { if (step !== 1 || form.idea) setStep(step + 1); }}>Siguiente</button> : <button type="submit" className="btn btn-primary">Enviar a WhatsApp →</button>}</div></form></div></div>;
}
