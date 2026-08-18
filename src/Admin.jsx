import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.js';

const emptyHero = { eyebrow: '', title: '', description: '', primary: '', secondary: '' };
const emptyStyle = { name: '', description: '', is_visible: true, sort_order: 0 };
const emptyWork = { title: '', description: '', tattoo_style_id: '', cover_image_url: '', cover_alt_text: '', sort_order: 0, state: 'published' };
const emptyFaq = { question: '', answer: '', is_visible: true, sort_order: 0 };

export default function Admin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('landing');
  const [data, setData] = useState({ settings: null, hero: null, styles: [], works: [], faqs: [] });
  const [message, setMessage] = useState('');

  const load = async () => {
    const [settings, hero, styles, works, faqs] = await Promise.all([
      supabase.from('site_settings').select('*').eq('id', true).maybeSingle(),
      supabase.from('landing_sections').select('*').eq('section_key', 'hero').maybeSingle(),
      supabase.from('tattoo_styles').select('*').order('sort_order'),
      supabase.from('portfolio_items').select('*, tattoo_styles(name)').order('sort_order'),
      supabase.from('faqs').select('*').order('sort_order')
    ]);
    const error = [settings, hero, styles, works, faqs].find(result => result.error)?.error;
    if (error) throw error;
    setData({ settings: settings.data, hero: hero.data, styles: styles.data || [], works: works.data || [], faqs: faqs.data || [] });
  };

  useEffect(() => {
    let mounted = true;
    const checkSession = async currentSession => {
      if (!mounted) return;
      setSession(currentSession);
      if (!currentSession) { setIsAdmin(false); setLoading(false); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentSession.user.id).maybeSingle();
      if (!mounted) return;
      setIsAdmin(profile?.role === 'admin');
      if (profile?.role === 'admin') {
        try { await load(); } catch (error) { setMessage(error.message); }
      }
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => checkSession(currentSession));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => checkSession(currentSession));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const saved = async action => {
    setMessage('Guardando...');
    try { await action(); await load(); setMessage('Cambios guardados y publicados.'); }
    catch (error) { setMessage(error.message); }
  };

  if (loading) return <main className="login-page"><p>Cargando administración...</p></main>;
  if (!session) return <Login />;
  if (!isAdmin) return <main className="login-page"><section className="login-art"><video autoPlay muted loop playsInline aria-hidden="true"><source src="/videos/fondo.mp4" type="video/mp4" /></video><div><img src="/img/logo.png" alt="Night Fury Tattoo" /><p>Gestiona el contenido de tu estudio, solicitudes y presencia digital desde un solo lugar.</p></div></section><section className="login-panel"><div className="login-card"><a className="login-mobile-brand" href="/"><img src="/img/logo.png" alt="Night Fury" />NIGHT FURY</a><p className="admin-kicker">PERMISOS REQUERIDOS</p><h1>Acceso no autorizado</h1><p>Tu usuario inició sesión correctamente, pero todavía no tiene permisos de administración.</p><p className="login-error">Promueve esta cuenta a administradora desde el SQL Editor de Supabase y vuelve a iniciar sesión.</p><button className="login-submit" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button><a className="back-link" href="/">← Volver al sitio público</a></div></section></main>;

  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><img src="/img/logo.png" alt="Night Fury" /><span>NIGHT FURY<small>ADMINISTRACIÓN</small></span></a><nav className="admin-nav">{[['landing', 'Landing'], ['portfolio', 'Portafolio'], ['styles', 'Estilos'], ['faq', 'Preguntas'], ['settings', 'Configuración']].map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}><span>{label[0]}</span>{label}</button>)}</nav><div className="sidebar-foot"><a href="/" target="_blank" rel="noreferrer">Ver sitio público ↗</a><button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button></div></aside>
    <main className="admin-main"><header className="admin-header"><div><p className="admin-kicker">CONTENIDO EN SUPABASE</p><h1>{active === 'faq' ? 'Preguntas frecuentes' : active === 'styles' ? 'Estilos y servicios' : active === 'settings' ? 'Configuración' : active === 'portfolio' ? 'Portafolio' : 'Landing'}</h1></div>{message && <span>{message}</span>}</header><section className="admin-content">
      {active === 'landing' && <HeroEditor section={data.hero} save={value => saved(() => supabase.from('landing_sections').upsert({ id: data.hero?.id, section_key: 'hero', title: 'Hero principal', draft_content: value, published_content: value, state: 'published', is_visible: true }, { onConflict: 'section_key' }))} />}
      {active === 'settings' && <SettingsEditor settings={data.settings} save={value => saved(() => supabase.from('site_settings').upsert({ ...value, id: true }))} />}
      {active === 'styles' && <StylesEditor items={data.styles} save={saved} />}
      {active === 'portfolio' && <PortfolioEditor items={data.works} styles={data.styles} save={saved} />}
      {active === 'faq' && <FaqEditor items={data.faqs} save={saved} />}
    </section></main>
  </div>;
}

function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  const submit = async event => { event.preventDefault(); const { error: authError } = await supabase.auth.signInWithPassword({ email, password }); setError(authError?.message || ''); };
  return <main className="login-page"><section className="login-art"><video autoPlay muted loop playsInline aria-hidden="true"><source src="/videos/fondo.mp4" type="video/mp4" /></video><div><img src="/img/logo.png" alt="Night Fury Tattoo" /><p>Gestiona el contenido de tu estudio, solicitudes y presencia digital desde un solo lugar.</p></div></section><section className="login-panel"><div className="login-card"><a className="login-mobile-brand" href="/"><img src="/img/logo.png" alt="Night Fury" />NIGHT FURY</a><p className="admin-kicker">ACCESO PRIVADO</p><h1>Bienvenida de vuelta.</h1><p>Inicia sesión con la cuenta administradora creada en Supabase.</p><form onSubmit={submit}><Field label="Correo electrónico" value={email} onChange={setEmail} type="email" /><Field label="Contraseña" value={password} onChange={setPassword} type="password" />{error && <div className="login-error">{error}</div>}<button className="login-submit">Iniciar sesión</button></form><a className="back-link" href="/">← Volver al sitio público</a></div></section></main>;
}

function HeroEditor({ section, save }) { const [form, setForm] = useState(section?.published_content || emptyHero); useEffect(() => setForm(section?.published_content || emptyHero), [section]); return <section className="admin-panel"><h2>Hero principal</h2><p>Este contenido se publica directamente en la portada. Los textos de sus botones están bloqueados.</p><Field label="Etiqueta superior" value={form.eyebrow} onChange={value => setForm({ ...form, eyebrow: value })} /><Field label="Título" value={form.title} onChange={value => setForm({ ...form, title: value })} /><Field label="Descripción" value={form.description} multiline onChange={value => setForm({ ...form, description: value })} /><button className="dark-button" onClick={() => save(form)}>Guardar y publicar</button></section>; }
function SettingsEditor({ settings, save }) { const [form, setForm] = useState(settings || {}); useEffect(() => setForm(settings || {}), [settings]); const field = (label, key, multiline) => <Field label={label} value={form[key] || ''} multiline={multiline} onChange={value => setForm({ ...form, [key]: value })} />; return <section className="admin-panel"><h2>Información general</h2><div className="two-fields">{field('WhatsApp', 'whatsapp')}{field('Correo', 'email')}</div>{field('Instagram', 'instagram')}{field('Ubicación', 'location')}{field('Horario', 'hours')}{field('Título SEO', 'seo_title')}{field('Descripción SEO', 'seo_description', true)}<button className="dark-button" onClick={() => save(form)}>Guardar configuración</button></section>; }
function StylesEditor({ items, save }) { const [form, setForm] = useState(emptyStyle); const submit = event => { event.preventDefault(); save(() => supabase.from('tattoo_styles').insert(form)); setForm(emptyStyle); }; return <><Form title="Añadir estilo" onSubmit={submit}><Field label="Nombre" value={form.name} onChange={value => setForm({ ...form, name: value })} /><Field label="Descripción" value={form.description} multiline onChange={value => setForm({ ...form, description: value })} /><Field label="Orden" value={String(form.sort_order)} type="number" onChange={value => setForm({ ...form, sort_order: Number(value) })} /><button className="dark-button">Añadir estilo</button></Form><List>{items.map(item => <article className="work-card" key={item.id}><section><h3>{item.name}</h3><p>{item.description}</p><button className="small-button" onClick={() => save(() => supabase.from('tattoo_styles').update({ is_visible: !item.is_visible }).eq('id', item.id))}>{item.is_visible ? 'Ocultar' : 'Mostrar'}</button><button className="delete-button" onClick={() => confirm('¿Eliminar estilo?') && save(() => supabase.from('tattoo_styles').delete().eq('id', item.id))}>Eliminar</button></section></article>)}</List></>; }
function PortfolioEditor({ items, styles, save }) { const [form, setForm] = useState(emptyWork); const submit = event => { event.preventDefault(); save(() => supabase.from('portfolio_items').insert({ ...form, tattoo_style_id: form.tattoo_style_id || null })); setForm(emptyWork); }; return <><Form title="Añadir trabajo" onSubmit={submit}><Field label="Título" value={form.title} onChange={value => setForm({ ...form, title: value })} /><Field label="Descripción" value={form.description} multiline onChange={value => setForm({ ...form, description: value })} /><Select label="Estilo" value={form.tattoo_style_id} onChange={value => setForm({ ...form, tattoo_style_id: value })} options={[['', 'Sin estilo'], ...styles.map(style => [style.id, style.name])]} /><Field label="URL de imagen" value={form.cover_image_url} onChange={value => setForm({ ...form, cover_image_url: value })} /><Field label="Texto alternativo" value={form.cover_alt_text} onChange={value => setForm({ ...form, cover_alt_text: value })} /><button className="dark-button">Añadir y publicar</button></Form><List>{items.map(item => <article className="work-card" key={item.id}>{item.cover_image_url && <img src={item.cover_image_url} alt="" />}<section><small>{item.tattoo_styles?.name || 'Sin estilo'}</small><h3>{item.title}</h3><p>{item.description}</p><button className="small-button" onClick={() => save(() => supabase.from('portfolio_items').update({ state: item.state === 'published' ? 'hidden' : 'published' }).eq('id', item.id))}>{item.state === 'published' ? 'Ocultar' : 'Publicar'}</button><button className="delete-button" onClick={() => confirm('¿Eliminar trabajo?') && save(() => supabase.from('portfolio_items').delete().eq('id', item.id))}>Eliminar</button></section></article>)}</List></>; }
function FaqEditor({ items, save }) { const [form, setForm] = useState(emptyFaq); const submit = event => { event.preventDefault(); save(() => supabase.from('faqs').insert(form)); setForm(emptyFaq); }; return <><Form title="Añadir pregunta" onSubmit={submit}><Field label="Pregunta" value={form.question} onChange={value => setForm({ ...form, question: value })} /><Field label="Respuesta" value={form.answer} multiline onChange={value => setForm({ ...form, answer: value })} /><button className="dark-button">Añadir pregunta</button></Form><List>{items.map(item => <article className="work-card" key={item.id}><section><h3>{item.question}</h3><p>{item.answer}</p><button className="small-button" onClick={() => save(() => supabase.from('faqs').update({ is_visible: !item.is_visible }).eq('id', item.id))}>{item.is_visible ? 'Ocultar' : 'Mostrar'}</button><button className="delete-button" onClick={() => confirm('¿Eliminar pregunta?') && save(() => supabase.from('faqs').delete().eq('id', item.id))}>Eliminar</button></section></article>)}</List></>; }
function Form({ title, children, onSubmit }) { return <form className="admin-panel" onSubmit={onSubmit}><h2>{title}</h2>{children}</form>; }
function List({ children }) { return <section className="portfolio-admin-grid">{children}</section>; }
function Field({ label, value, onChange, multiline, type = 'text' }) { return <label className="form-field"><span>{label}</span>{multiline ? <textarea rows="4" value={value} onChange={event => onChange(event.target.value)} /> : <input required={label !== 'Descripción' && label !== 'Texto alternativo'} type={type} value={value} onChange={event => onChange(event.target.value)} />}</label>; }
function Select({ label, value, onChange, options }) { return <label className="form-field"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)}>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>; }
