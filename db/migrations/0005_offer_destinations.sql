create table if not exists offer_destinations (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  country text not null,
  region text,
  city text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offer_destinations_offer_sort_idx
  on offer_destinations (offer_id, sort_order);
