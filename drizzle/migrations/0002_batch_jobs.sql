CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.batch_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  days_of_week integer[] NOT NULL DEFAULT '{2,4}',
  run_time time NOT NULL DEFAULT '15:00',
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT batch_jobs_days_check CHECK (days_of_week <@ ARRAY[0,1,2,3,4,5,6])
);
GRANT SELECT, UPDATE ON public.batch_jobs TO authenticated;
GRANT ALL ON public.batch_jobs TO service_role;
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own batch jobs read" ON public.batch_jobs FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own batch jobs update" ON public.batch_jobs FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.batch_job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.batch_jobs(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('manual','schedule')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed')),
  recipient text NOT NULL DEFAULT '',
  debtor_count integer NOT NULL DEFAULT 0,
  total_debt bigint NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT '',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX batch_job_runs_owner_started ON public.batch_job_runs (owner_id, started_at DESC);
GRANT SELECT ON public.batch_job_runs TO authenticated;
GRANT ALL ON public.batch_job_runs TO service_role;
ALTER TABLE public.batch_job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own batch runs read" ON public.batch_job_runs FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.batch_runtime_secrets (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  token text NOT NULL
);
GRANT ALL ON public.batch_runtime_secrets TO service_role;
ALTER TABLE public.batch_runtime_secrets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.schedule_batch_job(_job_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  j public.batch_jobs%ROWTYPE;
  v_name text;
  v_hour integer;
  v_min integer;
  v_days integer[];
  v_expr text;
BEGIN
  SELECT * INTO j FROM public.batch_jobs WHERE id = _job_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'batch job not found'; END IF;
  v_name := 'batch-' || j.code;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_name) THEN PERFORM cron.unschedule(v_name); END IF;
  IF NOT j.is_active OR cardinality(j.days_of_week) = 0 THEN RETURN NULL; END IF;
  v_hour := extract(hour FROM j.run_time)::integer - 7;
  v_min := extract(minute FROM j.run_time)::integer;
  IF v_hour < 0 THEN
    v_hour := v_hour + 24;
    v_days := ARRAY(SELECT DISTINCT (d + 6) % 7 FROM unnest(j.days_of_week) d ORDER BY 1);
  ELSE
    v_days := ARRAY(SELECT DISTINCT d FROM unnest(j.days_of_week) d ORDER BY 1);
  END IF;
  v_expr := v_min || ' ' || v_hour || ' * * ' || array_to_string(v_days, ',');
  PERFORM cron.schedule(v_name, v_expr, format(
    $c$SELECT net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT token FROM public.batch_runtime_secrets WHERE id = 1)), body := jsonb_build_object('job_id', %L)) AS request_id$c$,
    'https://project--3aec29ae-8ef6-4626-b0fe-cbd49cc8c531.lovable.app/api/public/batch/run', j.id::text));
  RETURN v_expr;
END $$;
REVOKE ALL ON FUNCTION public.schedule_batch_job(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_batch_job(uuid) TO service_role;