insert into public.site_settings (key, value)
values ('auto_publish_ai_content', 'true'::jsonb)
on conflict (key)
do update set
  value = excluded.value,
  updated_at = now();
