alter table supplier_import_entities
  add column if not exists is_enabled boolean not null default true,
  add column if not exists editorial_title text,
  add column if not exists editorial_url text,
  add column if not exists editorial_data jsonb not null default '{}'::jsonb;

create index if not exists supplier_import_entities_enabled_idx
  on supplier_import_entities (import_id, entity_type, is_enabled, sort_order);
