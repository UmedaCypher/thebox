-- =============================================================================
-- Magazine : articles rédigés depuis le backoffice
-- Les articles publiés sont lus au moment de la construction du site (site/scripts/sync-articles.mjs)
-- et deviennent des pages statiques, optimisées comme les autres. Publier relance la construction
-- automatiquement (Deploy Hook Cloudflare rangé dans Vault, voir docs/magazine.md) : en ligne en 2 à 3 minutes.
-- =============================================================================

create table if not exists public.magazine_articles (
  id uuid primary key default gen_random_uuid(),
  lang text not null check (lang in ('fr', 'en')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  translation_key text not null check (char_length(translation_key) between 2 and 80),
  title text not null check (char_length(title) between 5 and 70),
  description text not null check (char_length(description) between 70 and 165),
  category text not null check (char_length(category) between 2 and 40),
  author text not null default 'Arcora',
  body_md text not null default '',
  cover_path text,          -- « local:fichier.webp » (image du dépôt) ou chemin dans le stockage « magazine »
  cover_alt text,
  cover_caption text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at date not null default current_date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (lang, slug),
  -- Comme le site : une image principale exige une description de l'image
  check (cover_path is null or char_length(btrim(coalesce(cover_alt, ''))) > 0)
);
alter table public.magazine_articles enable row level security;

-- Tout le monde lit les articles publiés (la construction du site utilise la clé publique) ;
-- l'administrateur lit et écrit tout.
drop policy if exists "magazine_read_published" on public.magazine_articles;
create policy "magazine_read_published" on public.magazine_articles for select to anon, authenticated
  using (status = 'published' or private.is_admin((select auth.uid())));
drop policy if exists "magazine_admin_write" on public.magazine_articles;
create policy "magazine_admin_write" on public.magazine_articles for all to authenticated
  using (private.is_admin((select auth.uid()))) with check (private.is_admin((select auth.uid())));

-- Relance la construction du site quand un article publié change (ou quitte la publication)
create or replace function private.magazine_rebuild()
returns trigger language plpgsql security definer set search_path = '' as $$
declare hook text;
begin
  if (tg_op = 'DELETE' and old.status = 'published')
     or (tg_op <> 'DELETE' and (new.status = 'published' or (tg_op = 'UPDATE' and old.status = 'published'))) then
    begin
      if to_regclass('vault.decrypted_secrets') is not null then
        execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1' into hook using 'magazine_deploy_hook';
      end if;
      if hook is not null then
        execute 'select net.http_post(url := $1, body := $2, timeout_milliseconds := 10000)' using hook, '{}'::jsonb;
      end if;
    exception when others then
      -- Une panne du déclencheur ne doit jamais empêcher d'enregistrer l'article
      raise warning 'magazine_rebuild: %', sqlerrm;
    end;
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists magazine_articles_rebuild on public.magazine_articles;
create trigger magazine_articles_rebuild after insert or update or delete on public.magazine_articles
  for each row execute function private.magazine_rebuild();

-- Images du magazine : lecture publique, écriture réservée à l'administrateur
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('magazine', 'magazine', true, 10485760)
    on conflict (id) do nothing;
    execute $p$drop policy if exists "magazine_admin_insert" on storage.objects$p$;
    execute $p$create policy "magazine_admin_insert" on storage.objects for insert to authenticated
      with check (bucket_id = 'magazine' and private.is_admin((select auth.uid())))$p$;
    execute $p$drop policy if exists "magazine_admin_update" on storage.objects$p$;
    execute $p$create policy "magazine_admin_update" on storage.objects for update to authenticated
      using (bucket_id = 'magazine' and private.is_admin((select auth.uid())))$p$;
    execute $p$drop policy if exists "magazine_admin_delete" on storage.objects$p$;
    execute $p$create policy "magazine_admin_delete" on storage.objects for delete to authenticated
      using (bucket_id = 'magazine' and private.is_admin((select auth.uid())))$p$;
  end if;
end $$;
