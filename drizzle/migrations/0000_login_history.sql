CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  email text NOT NULL DEFAULT '',
  method text NOT NULL DEFAULT 'password',
  ip_address text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  browser text NOT NULL DEFAULT '',
  os text NOT NULL DEFAULT '',
  device text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  logged_in_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.login_history TO authenticated;
GRANT ALL ON public.login_history TO service_role;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own login history read" ON public.login_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own login history insert" ON public.login_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX login_history_user_time ON public.login_history (user_id, logged_in_at DESC);