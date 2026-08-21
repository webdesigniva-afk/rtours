-- Align public offer collections with the RED collection cards used by the site.

insert into taxonomy_terms (type, slug, name, public_label, color, icon, sort_order)
values
  ('collection', 'red-icons', 'Red Icons', 'Red Icons', '#b52b26', 'sparkles', 10),
  ('collection', 'red-hidden', 'Red Hidden', 'Red Hidden', '#2657b8', 'compass', 20),
  ('collection', 'red-taste', 'Red Taste', 'Red Taste', '#c26a2b', 'utensils', 30),
  ('collection', 'red-wild', 'Red Wild', 'Red Wild', '#38835d', 'mountain', 40),
  ('collection', 'red-live', 'Red Live', 'Red Live', '#7c4fd4', 'music', 50),
  ('collection', 'red-circle', 'Red Circle', 'Red Circle', '#59443b', 'users', 60)
on conflict (type, slug) do update
set name = excluded.name,
    public_label = excluded.public_label,
    color = excluded.color,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_public = true,
    is_filterable = true,
    is_searchable = true,
    updated_at = now();
