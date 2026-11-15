CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

CREATE POLICY "cada persona consulta su rol"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
