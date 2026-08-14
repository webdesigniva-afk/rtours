create table if not exists supplier_connectors (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  display_name text not null,
  source_type text not null default 'api' check (source_type in ('api', 'xml', 'json', 'csv', 'file', 'manual')),
  auth_type text not null default 'request_credentials' check (auth_type in ('none', 'request_credentials', 'stored_credentials', 'api_key', 'oauth')),
  status text not null default 'active' check (status in ('active', 'paused', 'disabled')),
  default_base_url text,
  config_schema jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists supplier_import_runs (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid references supplier_connectors(id) on delete set null,
  provider text not null,
  source offer_source not null default 'api',
  mode text not null default 'manual' check (mode in ('manual', 'scheduled', 'rebuild', 'dry_run')),
  status text not null default 'running' check (status in ('running', 'success', 'partial_success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_found integer,
  total_processed integer not null default 0,
  new_count integer not null default 0,
  changed_count integer not null default 0,
  unchanged_count integer not null default 0,
  expired_count integer not null default 0,
  unavailable_count integer not null default 0,
  error_count integer not null default 0,
  error_message text,
  config_snapshot jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table offer_imports
  add column if not exists import_run_id uuid references supplier_import_runs(id) on delete set null,
  add column if not exists normalized_payload jsonb not null default '{}'::jsonb,
  add column if not exists important_changes jsonb not null default '[]'::jsonb;

alter table supplier_import_entities
  add column if not exists import_run_id uuid references supplier_import_runs(id) on delete set null;

create index if not exists supplier_connectors_status_idx
  on supplier_connectors (status, provider);

create index if not exists supplier_import_runs_provider_started_idx
  on supplier_import_runs (provider, started_at desc);

create index if not exists offer_imports_import_run_idx
  on offer_imports (import_run_id);

create index if not exists supplier_import_entities_import_run_idx
  on supplier_import_entities (import_run_id);

insert into supplier_connectors (
  provider,
  display_name,
  source_type,
  auth_type,
  status,
  default_base_url,
  config_schema,
  notes
)
values (
  'bohemia',
  'Bohemia',
  'xml',
  'request_credentials',
  'active',
  'https://demo.internationaltravelgroup.net',
  '{
    "environments": [
      { "label": "Test", "baseUrl": "https://demo.internationaltravelgroup.net" },
      { "label": "Production", "baseUrl": "https://ims.internationaltravelgroup.net" }
    ],
    "offerTypes": ["excursion", "holiday"],
    "credentialsStored": false
  }'::jsonb,
  'First supplier connector. Credentials are submitted per sync request and are not stored.'
)
on conflict (provider) do update set
  display_name = excluded.display_name,
  source_type = excluded.source_type,
  auth_type = excluded.auth_type,
  status = excluded.status,
  default_base_url = excluded.default_base_url,
  config_schema = excluded.config_schema,
  notes = excluded.notes,
  updated_at = now();
