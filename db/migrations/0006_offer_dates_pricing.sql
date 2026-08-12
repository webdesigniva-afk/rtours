alter table offer_dates
  add column if not exists seats_total integer,
  add column if not exists seats_available integer,
  add column if not exists price_from numeric(12, 2),
  add column if not exists currency char(3) not null default 'EUR',
  add column if not exists deposit_amount numeric(12, 2),
  add column if not exists payment_due_days integer,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'offer_dates_currency_check') then
    alter table offer_dates add constraint offer_dates_currency_check check (currency in ('EUR', 'BGN'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'offer_dates_seats_total_check') then
    alter table offer_dates add constraint offer_dates_seats_total_check check (seats_total is null or seats_total >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'offer_dates_seats_available_check') then
    alter table offer_dates add constraint offer_dates_seats_available_check check (seats_available is null or seats_available >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'offer_dates_price_from_check') then
    alter table offer_dates add constraint offer_dates_price_from_check check (price_from is null or price_from >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'offer_dates_deposit_amount_check') then
    alter table offer_dates add constraint offer_dates_deposit_amount_check check (deposit_amount is null or deposit_amount >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'offer_dates_payment_due_days_check') then
    alter table offer_dates add constraint offer_dates_payment_due_days_check check (payment_due_days is null or payment_due_days >= 0);
  end if;
end $$;
