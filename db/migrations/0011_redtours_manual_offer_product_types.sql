insert into offer_product_types (slug, label, product_type, is_system, sort_order)
values
  ('standard-red-tours-program', 'Standard Red tours Program', 'package', true, 5),
  ('tailor-made', 'Tailor-made', 'package', true, 6),
  ('corporate-incentive', 'Corporate / Incentive', 'package', true, 7),
  ('group-request', 'Group Request', 'package', true, 8)
on conflict (slug) do update
set label = excluded.label,
    product_type = excluded.product_type,
    is_system = excluded.is_system,
    sort_order = excluded.sort_order,
    updated_at = now();
