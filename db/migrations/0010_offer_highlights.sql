create table if not exists offer_highlights (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create index if not exists offer_highlights_offer_id_sort_order_idx
  on offer_highlights (offer_id, sort_order);
