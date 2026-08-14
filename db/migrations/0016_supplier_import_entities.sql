create table if not exists supplier_import_entities (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references offer_imports(id) on delete cascade,
  offer_id uuid references offers(id) on delete cascade,
  provider text not null,
  external_id text not null,
  entity_type text not null,
  entity_key text,
  title text,
  url text,
  start_date date,
  end_date date,
  price numeric(12, 2),
  currency char(3),
  sort_order integer not null default 0,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_import_entities_import_idx
  on supplier_import_entities (import_id, entity_type, sort_order);

create index if not exists supplier_import_entities_offer_idx
  on supplier_import_entities (offer_id, entity_type, sort_order);

create unique index if not exists supplier_import_entities_unique_idx
  on supplier_import_entities (import_id, entity_type, coalesce(entity_key, ''), sort_order);
