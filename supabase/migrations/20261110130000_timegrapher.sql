-- =============================================================================
-- Précision des montres : mesures au timegrapher (micro du téléphone) ou saisies à la main,
-- reliées à une montre de la collection pour suivre l'évolution de sa marche dans le temps.
-- =============================================================================
create table if not exists public.accuracy_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid references public.watches(id) on delete cascade,
  measured_at timestamptz not null default now(),
  rate_s_day numeric(7, 2) not null check (rate_s_day between -999 and 999),     -- marche, secondes par jour (+ : avance)
  beat_error_ms numeric(5, 2) check (beat_error_ms between 0 and 99),           -- défaut de repère
  amplitude_deg smallint check (amplitude_deg between 100 and 360),             -- saisie manuelle (timegrapher pro)
  bph integer check (bph between 3600 and 72000),
  position text check (position in ('dial_up', 'dial_down', 'crown_up', 'crown_down', 'crown_left', 'crown_right', 'wrist')),
  source text not null default 'timegrapher' check (source in ('timegrapher', 'manual')),
  quality numeric(3, 2) check (quality between 0 and 1),
  note text check (char_length(note) <= 280),
  created_at timestamptz not null default now()
);
create index if not exists accuracy_measurements_watch_idx on public.accuracy_measurements (watch_id, measured_at);
alter table public.accuracy_measurements enable row level security;

drop policy if exists "accuracy_owner_all" on public.accuracy_measurements;
create policy "accuracy_owner_all" on public.accuracy_measurements for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and (watch_id is null or exists (select 1 from public.watches w where w.id = watch_id and w.user_id = (select auth.uid()))));
