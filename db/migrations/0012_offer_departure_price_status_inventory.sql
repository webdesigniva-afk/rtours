do $$
begin
  if not exists (select 1 from pg_type where typname = 'price_status') then
    create type price_status as enum (
      'fixed',
      'option_until',
      'dynamic',
      'budgetary'
    );
  end if;
end $$;

alter table offer_dates
  add column if not exists price_status price_status not null default 'budgetary',
  add column if not exists option_until timestamptz,
  add column if not exists seats_confirmed integer,
  add column if not exists seats_option integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'offer_dates_seats_confirmed_check') then
    alter table offer_dates add constraint offer_dates_seats_confirmed_check check (seats_confirmed is null or seats_confirmed >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'offer_dates_seats_option_check') then
    alter table offer_dates add constraint offer_dates_seats_option_check check (seats_option is null or seats_option >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'offer_dates_inventory_capacity_check') then
    alter table offer_dates add constraint offer_dates_inventory_capacity_check check (
      seats_total is null
      or (
        coalesce(seats_confirmed, 0)
        + coalesce(seats_option, 0)
        + coalesce(seats_available, 0)
      ) <= seats_total
    );
  end if;
end $$;
