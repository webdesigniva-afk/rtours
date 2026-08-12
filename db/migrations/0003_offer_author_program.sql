alter table offers
  add column if not exists is_author_program boolean not null default false;
