CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    CASE
      WHEN NULLIF(NEW.raw_user_meta_data->>'user_name', '') IS NOT NULL THEN
        NEW.raw_user_meta_data->>'user_name'
      ELSE
        COALESCE(
          NULLIF(
            regexp_replace(lower(split_part(COALESCE(NEW.email, ''), '@', 1)), '[^a-z0-9-]+', '-', 'g'),
            ''
          ),
          'user'
        ) || '-' || substr(NEW.id::text, 1, 6)
    END,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'FlamingFoodies Member'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
