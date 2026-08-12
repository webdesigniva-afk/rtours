create table if not exists offer_product_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  product_type offer_product_type not null default 'package',
  is_system boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table offers
  add column if not exists product_type_label text;

insert into offer_product_types (slug, label, product_type, is_system, sort_order)
values
  ('excursion', 'Екскурзия', 'excursion', true, 10),
  ('holiday', 'Почивка', 'holiday', true, 20),
  ('package', 'Пакет', 'package', true, 30),
  ('hotel', 'Хотел', 'hotel', true, 40),
  ('flight', 'Самолетен билет', 'flight', true, 50)
on conflict (slug) do update
set label = excluded.label,
    product_type = excluded.product_type,
    is_system = excluded.is_system,
    sort_order = excluded.sort_order,
    updated_at = now();
