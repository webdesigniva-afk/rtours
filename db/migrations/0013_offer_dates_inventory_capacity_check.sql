do $$
begin
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
