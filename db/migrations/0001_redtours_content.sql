-- RedTours content foundation
-- Target: PostgreSQL / Supabase-compatible SQL.

create extension if not exists pgcrypto;

create type offer_status as enum (
  'draft',
  'review',
  'published',
  'archived',
  'needs_changes'
);

create type offer_source as enum (
  'manual',
  'xml',
  'api',
  'labeling',
  'erp'
);

create type offer_product_type as enum (
  'excursion',
  'holiday',
  'hotel',
  'flight',
  'service',
  'package'
);

create type transport_type as enum (
  'flight',
  'bus',
  'own_transport',
  'mixed'
);

create type availability_status as enum (
  'available',
  'limited',
  'on_request',
  'sold_out'
);

create type import_change_state as enum (
  'new',
  'changed',
  'expired',
  'unavailable',
  'unchanged'
);

create table destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  region text,
  summary text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table themes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text,
  mood text,
  image_url text,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  product_type offer_product_type not null default 'package',
  title text not null,
  summary text,
  description text,
  destination_id uuid references destinations(id) on delete set null,
  country text,
  region text,
  city text,
  duration_days integer,
  duration_nights integer,
  transport transport_type not null default 'mixed',
  price_from numeric(12, 2),
  currency char(3) not null default 'EUR',
  price_note text,
  price_includes_taxes boolean,
  source offer_source not null default 'manual',
  status offer_status not null default 'draft',
  hero_image_url text,
  seo_meta_title text,
  seo_meta_description text,
  seo_keywords text[] not null default '{}',
  seo_canonical_url text,
  seo_structured_data_type text,
  assigned_to uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  publish_at timestamptz,
  archived_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_currency_check check (currency in ('EUR', 'BGN')),
  constraint offers_duration_check check (duration_days is null or duration_days > 0),
  constraint offers_price_check check (price_from is null or price_from >= 0)
);

create table offer_dates (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  label text,
  start_date date,
  end_date date,
  availability availability_status not null default 'on_request',
  sort_order integer not null default 0
);

create table offer_media (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  url text not null,
  alt text not null,
  caption text,
  source text,
  is_primary boolean not null default false,
  sort_order integer not null default 0
);

create table offer_itinerary_days (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  day_number integer not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  unique (offer_id, day_number, title)
);

create table offer_services (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  service_type text not null check (service_type in ('included', 'excluded')),
  label text not null,
  sort_order integer not null default 0
);

create table offer_categories (
  offer_id uuid not null references offers(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (offer_id, category_id)
);

create table offer_themes (
  offer_id uuid not null references offers(id) on delete cascade,
  theme_id uuid not null references themes(id) on delete cascade,
  primary key (offer_id, theme_id)
);

create table offer_collections (
  offer_id uuid not null references offers(id) on delete cascade,
  collection_id uuid not null references collections(id) on delete cascade,
  primary key (offer_id, collection_id)
);

create table offer_imports (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers(id) on delete set null,
  provider text not null,
  external_id text not null,
  source offer_source not null,
  change_state import_change_state not null default 'new',
  checksum text,
  raw_payload jsonb,
  raw_payload_url text,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers(id) on delete set null,
  offer_title text,
  travel_period text,
  travelers_count integer,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  notes text,
  consent_accepted boolean not null default false,
  source_page text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index offers_status_idx on offers(status);
create index offers_source_idx on offers(source);
create index offers_destination_idx on offers(destination_id);
create index offer_dates_start_date_idx on offer_dates(start_date);
create index offer_imports_change_state_idx on offer_imports(change_state);
