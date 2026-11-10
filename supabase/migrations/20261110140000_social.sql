-- =============================================================================
-- Social : suivre des membres, publications, fil d'actualité, profil public enrichi
-- Seuls les membres au profil public (avec pseudo) publient et peuvent être suivis.
-- Les publications sont visibles par tous ; le fil « Abonnements » ne montre que les membres suivis.
-- =============================================================================

alter table public.profiles add column if not exists bio text check (char_length(bio) <= 300);

/** Membre visible publiquement (profil public avec pseudo). */
create or replace function private.is_public_member(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = p_user and coalesce(p.is_public, false) and p.username is not null);
$$;

-- ---------- Abonnements ----------
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists follows_followee_idx on public.follows (followee_id);
alter table public.follows enable row level security;
drop policy if exists "follows_select_own" on public.follows;
create policy "follows_select_own" on public.follows for select to authenticated
  using (follower_id = (select auth.uid()) or followee_id = (select auth.uid()));
drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and private.is_public_member(followee_id));
drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows for delete to authenticated using (follower_id = (select auth.uid()));

-- ---------- Publications ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  watch_id uuid references public.watches(id) on delete set null,
  photo_path text check (char_length(photo_path) <= 300),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists posts_user_idx on public.posts (user_id, created_at desc);
create index if not exists posts_created_idx on public.posts (created_at desc);
alter table public.posts enable row level security;
drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select to anon, authenticated
  using (user_id = (select auth.uid()) or private.is_public_member(user_id));
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_public_member(user_id)
    and (watch_id is null or exists (select 1 from public.watches w where w.id = watch_id and w.user_id = (select auth.uid())))
    and (photo_path is null or photo_path like (select auth.uid())::text || '/%'));
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
drop policy if exists "post_likes_own" on public.post_likes;
create policy "post_likes_own" on public.post_likes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);
alter table public.post_comments enable row level security;
drop policy if exists "post_comments_select" on public.post_comments;
create policy "post_comments_select" on public.post_comments for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
drop policy if exists "post_comments_insert_own" on public.post_comments;
create policy "post_comments_insert_own" on public.post_comments for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.username is not null)
    and exists (select 1 from public.posts p where p.id = post_id));
drop policy if exists "post_comments_delete" on public.post_comments;
create policy "post_comments_delete" on public.post_comments for delete to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid())));

-- ---------- Profil public : compteurs et relation ----------
create or replace function public.get_profile_social(p_username text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'user_id', p.id,
    'bio', p.bio,
    'followers', (select count(*) from public.follows f where f.followee_id = p.id),
    'following', (select count(*) from public.follows f where f.follower_id = p.id),
    'posts', (select count(*) from public.posts x where x.user_id = p.id),
    'i_follow', exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.id),
    'follows_me', exists (select 1 from public.follows f where f.followee_id = (select auth.uid()) and f.follower_id = p.id),
    'is_me', p.id = (select auth.uid())
  )
  from public.profiles p
  where p.username = p_username and coalesce(p.is_public, false);
$$;
revoke execute on function public.get_profile_social(text) from public;
grant execute on function public.get_profile_social(text) to anon, authenticated;

-- ---------- Fil ----------
-- Trois sortes d'éléments : publications, photos au poignet publiées dans la Galerie, nouvelles annonces du Marché.
-- p_mode : 'following' (membres suivis + soi) ou 'all' (tous les membres publics). p_user : profil d'un seul membre.
create or replace function public.get_feed(p_mode text default 'following', p_before timestamptz default null, p_limit integer default 20, p_user uuid default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  with me as (select (select auth.uid()) as uid),
  authors as (
    select p.id, p.username, p.profile_picture_url from public.profiles p, me
    where p.username is not null and coalesce(p.is_public, false)
      and (p_user is null or p.id = p_user)
      and (p_user is not null or p_mode = 'all' or p.id = me.uid
           or exists (select 1 from public.follows f where f.follower_id = me.uid and f.followee_id = p.id))
  ),
  items as (
    select 'post'::text as kind, x.id, x.created_at, x.user_id, x.body, x.photo_path, x.watch_id, null::numeric as price
    from public.posts x join authors a on a.id = x.user_id
    where p_before is null or x.created_at < p_before
    union all
    select 'wrist', ph.id, ph.created_at, ph.user_id, null, ph.storage_path, ph.watch_id, null
    from public.photos ph join authors a on a.id = ph.user_id
    where ph.photo_type = 'wrist_shot' and coalesce(ph.is_public_gallery, false) and (p_before is null or ph.created_at < p_before)
    union all
    select 'listing', w.id, w.listed_at, w.user_id, w.sale_note, null, w.id, case when w.current_status::text = 'for_sale' then w.sale_price end
    from public.watches w join authors a on a.id = w.user_id
    where w.current_status::text in ('for_sale', 'for_exchange') and w.listed_at is not null and (p_before is null or w.listed_at < p_before)
  ),
  page as (select * from items order by created_at desc limit least(greatest(p_limit, 1), 50))
  select coalesce(jsonb_agg(jsonb_build_object(
    'kind', i.kind, 'id', i.id, 'created_at', i.created_at, 'body', i.body, 'price', i.price,
    'photo_path', coalesce(i.photo_path, case when i.kind = 'listing' then (
        select ph.storage_path from public.photos ph where ph.watch_id = i.watch_id and ph.photo_type <> 'wrist_shot'
        order by ph.is_main_photo desc, ph.created_at limit 1) end),
    'author', jsonb_build_object('id', a.id, 'username', a.username, 'avatar', a.profile_picture_url),
    'watch', case when w.id is not null then jsonb_build_object('id', w.id, 'brand', w.brand, 'model', w.model) end,
    'likes', case when i.kind = 'post' then (select count(*) from public.post_likes l where l.post_id = i.id) end,
    'liked', case when i.kind = 'post' then exists (select 1 from public.post_likes l, me where l.post_id = i.id and l.user_id = me.uid) end,
    'comments', case when i.kind = 'post' then (select count(*) from public.post_comments c where c.post_id = i.id) end,
    'mine', i.user_id = (select uid from me)
  ) order by i.created_at desc), '[]'::jsonb)
  from page i join authors a on a.id = i.user_id left join public.watches w on w.id = i.watch_id;
$$;
revoke execute on function public.get_feed(text, timestamptz, integer, uuid) from public;
grant execute on function public.get_feed(text, timestamptz, integer, uuid) to anon, authenticated;

create or replace function public.get_post_comments(p_post uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'body', c.body, 'created_at', c.created_at,
           'author', jsonb_build_object('username', p.username, 'avatar', case when coalesce(p.is_public, false) then p.profile_picture_url end),
           'mine', c.user_id = (select auth.uid())) order by c.created_at), '[]'::jsonb)
  from public.post_comments c join public.profiles p on p.id = c.user_id
  where c.post_id = p_post and exists (select 1 from public.posts x where x.id = p_post
    and (x.user_id = (select auth.uid()) or private.is_public_member(x.user_id)));
$$;
revoke execute on function public.get_post_comments(uuid) from public;
grant execute on function public.get_post_comments(uuid) to anon, authenticated;

-- Membres à suivre : profils publics les plus actifs que l'on ne suit pas encore
create or replace function public.get_follow_suggestions(p_limit integer default 8)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x order by x.score desc), '[]'::jsonb) from (
    select p.username, p.profile_picture_url as avatar,
           (select count(*) from public.watches w where w.user_id = p.id) as watches,
           (select count(*) from public.follows f where f.followee_id = p.id) as followers,
           (select count(*) from public.watches w where w.user_id = p.id)
             + 3 * (select count(*) from public.photos ph where ph.user_id = p.id and coalesce(ph.is_public_gallery, false))
             + 2 * (select count(*) from public.posts x where x.user_id = p.id) as score
    from public.profiles p
    where coalesce(p.is_public, false) and p.username is not null and p.id <> coalesce((select auth.uid()), '00000000-0000-0000-0000-000000000000'::uuid)
      and not exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.id)
    order by score desc limit least(greatest(p_limit, 1), 20)
  ) x;
$$;
revoke execute on function public.get_follow_suggestions(integer) from public;
grant execute on function public.get_follow_suggestions(integer) to anon, authenticated;
