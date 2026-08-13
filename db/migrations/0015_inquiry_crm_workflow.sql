alter table inquiries
  add column if not exists assigned_to_name text,
  add column if not exists next_action_at timestamptz,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists lost_reason text,
  add column if not exists internal_note text,
  add column if not exists status_updated_at timestamptz not null default now();

create table if not exists inquiry_status_history (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references inquiries(id) on delete cascade,
  previous_status text,
  next_status text not null,
  note text,
  changed_by text,
  created_at timestamptz not null default now()
);

insert into inquiry_status_history (inquiry_id, previous_status, next_status, note)
select id, null, status, 'Initial lead status'
from inquiries inquiry
where not exists (
  select 1
  from inquiry_status_history history
  where history.inquiry_id = inquiry.id
);

create index if not exists inquiry_status_history_inquiry_idx on inquiry_status_history(inquiry_id, created_at desc);
create index if not exists inquiries_next_action_idx on inquiries(next_action_at);
create index if not exists inquiries_contact_email_idx on inquiries(lower(contact_email));
create index if not exists inquiries_contact_phone_idx on inquiries(contact_phone);
