-- Night Fury Tattoo · Supabase database schema
-- Run this entire file once in: Supabase Dashboard > SQL Editor > New query.
-- Afterwards, create the administrator in Authentication > Users and run the
-- promotion statement at the bottom of this file with that account's email.

create extension if not exists pgcrypto;

-- Only the application uses this type. It is never supplied by public clients.
create type public.app_role as enum ('admin', 'editor');
create type public.content_state as enum ('draft', 'published', 'hidden');
create type public.quote_status as enum ('new', 'reviewing', 'quoted', 'scheduled', 'completed', 'cancelled', 'discarded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id boolean primary key default true check (id),
  whatsapp text,
  instagram text,
  email text,
  location text,
  hours text,
  privacy_policy_url text,
  legal_text text,
  seo_title text,
  seo_description text,
  seo_keywords text[] not null default '{}',
  social_image_url text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.landing_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique check (section_key ~ '^[a-z0-9_-]+$'),
  title text not null,
  draft_content jsonb not null default '{}'::jsonb,
  published_content jsonb not null default '{}'::jsonb,
  state public.content_state not null default 'draft',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tattoo_styles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  image_url text,
  icon_name text,
  cta_label text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  tattoo_style_id uuid references public.tattoo_styles(id) on delete set null,
  body_area text,
  color_style text,
  completed_on date,
  cover_image_url text,
  cover_alt_text text not null default '',
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  state public.content_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  image_type text not null default 'gallery' check (image_type in ('cover', 'gallery')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  testimonial text not null,
  rating smallint not null check (rating between 1 and 5),
  is_authorized boolean not null default false,
  state public.content_state not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  phone text,
  email text,
  instagram text,
  idea_description text not null,
  reference_urls text[] not null default '{}',
  body_area text,
  size_description text,
  color_preference text,
  preferred_date date,
  status public.quote_status not null default 'new',
  internal_notes text not null default '',
  quoted_amount numeric(12,2),
  contacted_at timestamptz,
  consent_to_contact boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_request_contact check (phone is not null or email is not null or instagram is not null)
);

create table public.publication_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null check (action in ('created', 'updated', 'published', 'hidden', 'deleted')),
  details jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index landing_sections_public_idx on public.landing_sections (state, is_visible, sort_order);
create index tattoo_styles_public_idx on public.tattoo_styles (is_visible, sort_order);
create index portfolio_items_public_idx on public.portfolio_items (state, sort_order);
create index portfolio_images_item_idx on public.portfolio_images (portfolio_item_id, sort_order);
create index faqs_public_idx on public.faqs (is_visible, sort_order);
create index testimonials_public_idx on public.testimonials (state, is_authorized, sort_order);
create index quote_requests_status_idx on public.quote_requests (status, submitted_at desc);
create index publication_history_entity_idx on public.publication_history (entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger settings_updated_at before update on public.site_settings for each row execute procedure public.set_updated_at();
create trigger sections_updated_at before update on public.landing_sections for each row execute procedure public.set_updated_at();
create trigger styles_updated_at before update on public.tattoo_styles for each row execute procedure public.set_updated_at();
create trigger portfolio_updated_at before update on public.portfolio_items for each row execute procedure public.set_updated_at();
create trigger faqs_updated_at before update on public.faqs for each row execute procedure public.set_updated_at();
create trigger testimonials_updated_at before update on public.testimonials for each row execute procedure public.set_updated_at();
create trigger requests_updated_at before update on public.quote_requests for each row execute procedure public.set_updated_at();

-- This function is intentionally narrow: it only answers whether the current
-- authenticated user has an admin profile. It is used to avoid recursive RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- A new account gets an editor profile. Admin accounts are promoted manually
-- by the project owner in the Supabase SQL Editor, see final statement below.
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.landing_sections enable row level security;
alter table public.tattoo_styles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.faqs enable row level security;
alter table public.testimonials enable row level security;
alter table public.quote_requests enable row level security;
alter table public.publication_history enable row level security;

-- Profiles are private, except for the account owner and administrators.
create policy "profile owner can read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "admins can manage profiles" on public.profiles for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Public landing reads only published and visible content.
create policy "public reads site settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admins manage site settings" on public.site_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public reads published sections" on public.landing_sections for select to anon, authenticated using (state = 'published' and is_visible);
create policy "admins manage landing sections" on public.landing_sections for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public reads visible styles" on public.tattoo_styles for select to anon, authenticated using (is_visible);
create policy "admins manage tattoo styles" on public.tattoo_styles for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public reads published portfolio" on public.portfolio_items for select to anon, authenticated using (state = 'published');
create policy "admins manage portfolio" on public.portfolio_items for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public reads images for public portfolio" on public.portfolio_images for select to anon, authenticated using (exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id and p.state = 'published'));
create policy "admins manage portfolio images" on public.portfolio_images for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public reads visible faqs" on public.faqs for select to anon, authenticated using (is_visible);
create policy "admins manage faqs" on public.faqs for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public reads authorized testimonials" on public.testimonials for select to anon, authenticated using (state = 'published' and is_authorized);
create policy "admins manage testimonials" on public.testimonials for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Quote requests are never public. The public form may create one only with
-- contact consent; administrators can read and manage every request.
create policy "anonymous visitors can submit quote requests" on public.quote_requests for insert to anon, authenticated with check (consent_to_contact = true and char_length(client_name) > 0 and char_length(idea_description) > 0);
create policy "admins manage quote requests" on public.quote_requests for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins read publication history" on public.publication_history for select to authenticated using ((select public.is_admin()));
create policy "admins add publication history" on public.publication_history for insert to authenticated with check ((select public.is_admin()) and actor_id = (select auth.uid()));

grant select on public.site_settings, public.landing_sections, public.tattoo_styles, public.portfolio_items, public.portfolio_images, public.faqs, public.testimonials to anon, authenticated;
grant insert on public.quote_requests to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.site_settings, public.landing_sections, public.tattoo_styles, public.portfolio_items, public.portfolio_images, public.faqs, public.testimonials, public.quote_requests, public.publication_history to authenticated;

-- Private Storage bucket for portfolio and landing assets. Media is readable by
-- the public landing but writes are restricted to administrators.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('night-fury-media', 'night-fury-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4'])
on conflict (id) do nothing;
create policy "public reads Night Fury media" on storage.objects for select to anon, authenticated using (bucket_id = 'night-fury-media');
create policy "admins upload Night Fury media" on storage.objects for insert to authenticated with check (bucket_id = 'night-fury-media' and (select public.is_admin()));
create policy "admins update Night Fury media" on storage.objects for update to authenticated using (bucket_id = 'night-fury-media' and (select public.is_admin())) with check (bucket_id = 'night-fury-media' and (select public.is_admin()));
create policy "admins delete Night Fury media" on storage.objects for delete to authenticated using (bucket_id = 'night-fury-media' and (select public.is_admin()));

-- AFTER creating the owner account in Authentication > Users, run this line
-- replacing the email. Never set an admin role from the browser client.
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'tu-correo@dominio.com');
