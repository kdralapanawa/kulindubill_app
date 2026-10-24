CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'admin123@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_assign_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();

CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_title text NOT NULL CHECK (char_length(bill_title) BETWEEN 1 AND 150),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  bill_date date NOT NULL,
  image_base64 text NOT NULL CHECK (char_length(image_base64) < 3000000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.bills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit bills" ON public.bills FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view bills" ON public.bills FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete bills" ON public.bills FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));