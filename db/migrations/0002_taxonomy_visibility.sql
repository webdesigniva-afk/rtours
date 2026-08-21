-- RedTours taxonomy and visibility layer
-- Target: PostgreSQL / Supabase-compatible SQL.

do $$
begin
  create type taxonomy_term_type as enum (
    'category',
    'theme',
    'audience',
    'mood',
    'badge',
    'collection',
    'transport',
    'service_type',
    'destination_style',
    'season'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type offer_visibility_placement as enum (
    'homepage',
    'offers_index',
    'collection_page',
    'destination_page',
    'search',
    'promo_section',
    'private_link',
    'hidden'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists taxonomy_terms (
  id uuid primary key default gen_random_uuid(),
  type taxonomy_term_type not null,
  slug text not null,
  name text not null,
  public_label text,
  description text,
  color text,
  icon text,
  is_public boolean not null default true,
  is_filterable boolean not null default true,
  is_searchable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, slug)
);

create table if not exists offer_taxonomy_terms (
  offer_id uuid not null references offers(id) on delete cascade,
  term_id uuid not null references taxonomy_terms(id) on delete cascade,
  source offer_source not null default 'manual',
  is_primary boolean not null default false,
  confidence numeric(5, 2),
  created_at timestamptz not null default now(),
  primary key (offer_id, term_id),
  constraint offer_taxonomy_confidence_check check (
    confidence is null or (confidence >= 0 and confidence <= 100)
  )
);

create table if not exists offer_visibility_rules (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  placement offer_visibility_placement not null,
  is_enabled boolean not null default true,
  priority integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  curated_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offer_id, placement),
  constraint offer_visibility_period_check check (
    starts_at is null or ends_at is null or starts_at < ends_at
  )
);

create table if not exists import_taxonomy_mappings (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_value text not null,
  term_id uuid references taxonomy_terms(id) on delete set null,
  confidence numeric(5, 2),
  review_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_value),
  constraint import_taxonomy_confidence_check check (
    confidence is null or (confidence >= 0 and confidence <= 100)
  )
);

create index if not exists taxonomy_terms_type_idx on taxonomy_terms(type);
create index if not exists taxonomy_terms_public_filter_idx on taxonomy_terms(type, is_public, is_filterable);
create index if not exists offer_taxonomy_terms_term_idx on offer_taxonomy_terms(term_id);
create index if not exists offer_taxonomy_terms_primary_idx on offer_taxonomy_terms(offer_id, is_primary);
create index if not exists offer_visibility_rules_placement_idx on offer_visibility_rules(placement, is_enabled, priority desc);
create index if not exists import_taxonomy_mappings_provider_idx on import_taxonomy_mappings(provider);

insert into taxonomy_terms (type, slug, name, public_label, color, icon, sort_order)
values
  ('category', 'excursion', 'Екскурзия', 'Екскурзия', '#b52b26', 'map', 10),
  ('category', 'holiday', 'Почивка', 'Почивка', '#1f68d1', 'sun', 20),
  ('category', 'cruise', 'Круиз', 'Круиз', '#13936a', 'ship', 30),
  ('category', 'hotel', 'Хотел', 'Хотел', '#7a5c2e', 'building', 40),
  ('category', 'flight', 'Самолетен билет', 'Самолетен билет', '#575f6f', 'plane', 50),
  ('category', 'corporate', 'Корпоративно пътуване', 'Корпоративно', '#6d3fc9', 'briefcase', 60),
  ('theme', 'culture', 'Култура', 'Култура', '#b52b26', 'landmark', 10),
  ('theme', 'nature', 'Природа', 'Природа', '#38835d', 'tree', 20),
  ('theme', 'food', 'Гастрономия', 'Гастрономия', '#c26a2b', 'utensils', 30),
  ('theme', 'photography', 'Фотография', 'Фотография', '#5c6bc0', 'camera', 40),
  ('theme', 'wine', 'Вино', 'Вино', '#9b2f5f', 'wine', 50),
  ('theme', 'adventure', 'Приключение', 'Приключение', '#b52b26', 'mountain', 60),
  ('theme', 'history', 'История', 'История', '#8b4c35', 'heart', 70),
  ('theme', 'shopping', 'Шопинг', 'Шопинг', '#636b7a', 'shopping-bag', 80),
  ('theme', 'sport', 'Спорт', 'Спорт', '#245bc2', 'activity', 90),
  ('audience', 'couples', 'Двойки', 'Двойки', '#b52b26', 'heart', 10),
  ('audience', 'families', 'Семейства', 'Семейства', '#2d7d59', 'users', 20),
  ('audience', 'friends', 'Приятели', 'Приятели', '#3565c9', 'users-round', 30),
  ('audience', 'solo', 'Соло пътешественици', 'Соло', '#6c5b7b', 'user', 40),
  ('audience', 'corporate', 'Корпоративни клиенти', 'Корпоративни', '#7a4e20', 'briefcase', 50),
  ('mood', 'calm', 'Пълно спокойствие', 'Пълно спокойствие', '#4f8f80', 'waves', 10),
  ('mood', 'romance', 'Романтика', 'Романтика', '#b94872', 'heart', 20),
  ('mood', 'new-world', 'Да открия нов свят', 'Да открия нов свят', '#395cb8', 'compass', 30),
  ('mood', 'new-flavours', 'Нови вкусове', 'Нови вкусове', '#c26a2b', 'utensils', 40),
  ('mood', 'signature', 'Red Signature', 'Red Signature', '#b52b26', 'sparkles', 50),
  ('mood', 'private', 'Бутиково и лично', 'Бутиково и лично', '#59443b', 'gem', 60),
  ('badge', 'last-seats', 'Последни места', 'Последни места', '#b52b26', 'alert-circle', 10),
  ('badge', 'author-program', 'Авторска програма', 'Авторска програма', '#6d51d9', 'pen-tool', 20),
  ('badge', 'red-choice', 'Наш избор', 'Наш избор', '#3c8a62', 'badge-check', 30),
  ('badge', 'guaranteed-departure', 'Гарантирано отпътуване', 'Гарантирано отпътуване', '#d1792b', 'calendar-check', 40),
  ('badge', 'promo', 'Промо', 'Промо', '#b52b26', 'tag', 50),
  ('collection', 'red-icons', 'Red Icons', 'Red Icons', '#b52b26', 'sparkles', 10),
  ('collection', 'red-hidden', 'Red Hidden', 'Red Hidden', '#2657b8', 'compass', 20),
  ('collection', 'red-taste', 'Red Taste', 'Red Taste', '#c26a2b', 'utensils', 30),
  ('collection', 'red-wild', 'Red Wild', 'Red Wild', '#38835d', 'mountain', 40),
  ('collection', 'red-live', 'Red Live', 'Red Live', '#7c4fd4', 'music', 50),
  ('collection', 'red-circle', 'Red Circle', 'Red Circle', '#59443b', 'users', 60),
  ('transport', 'flight', 'Самолет', 'Самолет', '#2d65c8', 'plane', 10),
  ('transport', 'bus', 'Автобус', 'Автобус', '#575f6f', 'bus', 20),
  ('transport', 'own_transport', 'Собствен транспорт', 'Собствен транспорт', '#575f6f', 'car', 30),
  ('transport', 'mixed', 'Комбинирано', 'Комбинирано', '#575f6f', 'route', 40),
  ('service_type', 'guide', 'Екскурзовод', 'Екскурзовод', '#575f6f', 'flag', 10),
  ('service_type', 'hotel', 'Настаняване', 'Настаняване', '#575f6f', 'building', 20),
  ('service_type', 'transfer', 'Трансфер', 'Трансфер', '#575f6f', 'bus', 30),
  ('service_type', 'insurance', 'Застраховка', 'Застраховка', '#575f6f', 'shield', 40),
  ('destination_style', 'city-break', 'Градско пътуване', 'Градско пътуване', '#575f6f', 'building-2', 10),
  ('destination_style', 'seaside', 'Море', 'Море', '#247a9b', 'waves', 20),
  ('destination_style', 'mountains', 'Планина', 'Планина', '#386d4f', 'mountain', 30),
  ('destination_style', 'exotic', 'Екзотика', 'Екзотика', '#b46b28', 'palm-tree', 40),
  ('season', 'spring', 'Пролет', 'Пролет', '#4f9d6d', 'flower', 10),
  ('season', 'summer', 'Лято', 'Лято', '#d48927', 'sun', 20),
  ('season', 'autumn', 'Есен', 'Есен', '#9b6036', 'leaf', 30),
  ('season', 'winter', 'Зима', 'Зима', '#4777ad', 'snowflake', 40)
on conflict (type, slug) do nothing;

create or replace view offer_search_index as
select
  o.id as offer_id,
  o.slug,
  o.title,
  o.summary,
  o.description,
  o.country,
  o.region,
  o.city,
  o.status,
  lower(
    concat_ws(
      ' ',
      o.title,
      o.summary,
      o.description,
      o.country,
      o.region,
      o.city,
      coalesce((
        select string_agg(concat_ws(' ', tt.name, tt.public_label, tt.slug), ' ')
        from offer_taxonomy_terms ott
        join taxonomy_terms tt on tt.id = ott.term_id
        where ott.offer_id = o.id
          and tt.is_searchable = true
      ), '')
    )
  ) as search_text,
  coalesce((
    select array_agg(term_slug)
    from (
      select tt.slug as term_slug
      from offer_taxonomy_terms ott
      join taxonomy_terms tt on tt.id = ott.term_id
      where ott.offer_id = o.id
      order by tt.type, tt.sort_order, tt.name
    ) ordered_terms
  ), '{}') as term_slugs,
  coalesce((
    select array_agg(public_term)
    from (
      select coalesce(tt.public_label, tt.name) as public_term
      from offer_taxonomy_terms ott
      join taxonomy_terms tt on tt.id = ott.term_id
      where ott.offer_id = o.id
        and tt.is_public = true
      order by tt.type, tt.sort_order, tt.name
    ) ordered_public_terms
  ), '{}') as public_terms,
  coalesce((
    select array_agg(placement)
    from (
      select ovr.placement::text as placement
      from offer_visibility_rules ovr
      where ovr.offer_id = o.id
        and ovr.is_enabled = true
        and (ovr.starts_at is null or ovr.starts_at <= now())
        and (ovr.ends_at is null or ovr.ends_at >= now())
      order by ovr.priority desc, ovr.placement::text
    ) ordered_placements
  ), '{}') as visibility_placements
from offers o;
