import { supabase } from './supabase.js';

const styleKey = name => (name || 'sin-estilo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function getPublicContent() {
  const [settings, sections, styles, portfolio, faqs] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', true).maybeSingle(),
    supabase.from('landing_sections').select('section_key, published_content').eq('state', 'published').eq('is_visible', true).order('sort_order'),
    supabase.from('tattoo_styles').select('name, description').eq('is_visible', true).order('sort_order'),
    supabase.from('portfolio_items').select('title, description, cover_image_url, cover_alt_text, tattoo_styles(name)').eq('state', 'published').order('sort_order'),
    supabase.from('faqs').select('question, answer').eq('is_visible', true).order('sort_order')
  ]);

  return {
    settings: settings.error ? null : settings.data,
    hero: sections.error ? null : sections.data?.find(section => section.section_key === 'hero')?.published_content,
    services: styles.error || !styles.data?.length ? null : styles.data.map(style => [style.name, style.description]),
    works: portfolio.error || !portfolio.data?.length ? null : portfolio.data.map(item => {
      const style = item.tattoo_styles?.name || 'Tatuaje personalizado';
      return [styleKey(style), item.title, style, item.description, item.cover_image_url, item.cover_alt_text || item.title];
    }),
    faqs: faqs.error || !faqs.data?.length ? null : faqs.data.map(item => [item.question, item.answer])
  };
}
