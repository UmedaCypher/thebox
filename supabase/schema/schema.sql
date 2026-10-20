-- =============================================================================
-- THE BOX — Schéma de la base Supabase (schéma public)
-- Instantané du : 2026-10-20
-- Source : export "Schema" du tableau de bord Supabase (contexte uniquement)
--
-- Ce fichier est une TRACE de la structure des tables, pas une migration.
-- Il n'est pas exécutable tel quel (ordre des tables, types USER-DEFINED).
-- Il ne contient PAS : les types enum, les politiques RLS, les fonctions RPC,
-- les triggers, ni les règles des buckets Storage.
--
-- Mise à jour : voir supabase/schema/README.md
-- =============================================================================

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text UNIQUE,
  profile_picture_url text,
  wrist_size_cm numeric,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  is_public boolean DEFAULT false,
  full_name text,
  phone_number text,
  preferred_language character varying,
  time_zone character varying,
  theme_preference character varying DEFAULT 'system'::character varying,
  wrist_size_mm numeric,
  allow_private_messages boolean DEFAULT true,
  account_type USER-DEFINED NOT NULL DEFAULT 'free'::user_account_type,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.watches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  reference_number text,
  movement text,
  year_of_production smallint,
  case_size_mm numeric,
  dial_color text,
  case_material text,
  bracelet_material text,
  purchase_price numeric,
  purchase_date date,
  purchase_location text,
  notes_history text,
  current_estimated_value numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bracelet_type text,
  condition text,
  case_diameter_mm numeric,
  lug_to_lug_mm numeric,
  lug_width_mm numeric,
  box_papers_status text,
  last_service_date date,
  sale_price numeric,
  current_location_id uuid,
  current_status USER-DEFINED NOT NULL,
  CONSTRAINT watches_pkey PRIMARY KEY (id),
  CONSTRAINT watches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT watches_current_location_id_fkey FOREIGN KEY (current_location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);
CREATE TABLE public.watch_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  sort_order smallint DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT watch_conditions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.box_papers_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order smallint DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT box_papers_options_pkey PRIMARY KEY (id)
);
CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT materials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dial_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  hex_code text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dial_colors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  watch_id uuid NOT NULL,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes integer,
  photo_type text CHECK (photo_type = ANY (ARRAY['watch_only'::text, 'wrist_shot'::text])),
  is_main_photo boolean DEFAULT false,
  caption text,
  wrist_shot_on_wrist_size_cm numeric,
  is_public_gallery boolean DEFAULT false,
  uploaded_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT photos_pkey PRIMARY KEY (id),
  CONSTRAINT photos_watch_id_fkey FOREIGN KEY (watch_id) REFERENCES public.watches(id),
  CONSTRAINT photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_read_at timestamp with time zone,
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_profiles_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pro_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.external_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pro_id uuid NOT NULL,
  full_name text NOT NULL,
  email text,
  phone_number text,
  address text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status USER-DEFINED DEFAULT 'prospect'::client_status_type,
  budget numeric,
  source text,
  CONSTRAINT external_clients_pkey PRIMARY KEY (id),
  CONSTRAINT external_clients_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pro_id uuid NOT NULL,
  client_profile_id uuid,
  external_client_id uuid,
  invoice_number text NOT NULL UNIQUE,
  invoice_date date NOT NULL,
  due_date date,
  total_amount numeric NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::invoice_status_type,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_client_profile_id_fkey FOREIGN KEY (client_profile_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_external_client_id_fkey FOREIGN KEY (external_client_id) REFERENCES public.external_clients(id)
);
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  watch_id uuid,
  item_description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT invoice_items_watch_id_fkey FOREIGN KEY (watch_id) REFERENCES public.watches(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  watch_id uuid NOT NULL,
  pro_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes integer,
  document_type text NOT NULL,
  caption text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_watch_id_fkey FOREIGN KEY (watch_id) REFERENCES public.watches(id),
  CONSTRAINT documents_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.watch_service_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  watch_id uuid NOT NULL,
  pro_id uuid NOT NULL,
  service_date date NOT NULL,
  service_type text NOT NULL,
  cost numeric,
  description text,
  service_provider_name text,
  service_provider_pro_id uuid,
  invoice_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT watch_service_history_pkey PRIMARY KEY (id),
  CONSTRAINT watch_service_history_watch_id_fkey FOREIGN KEY (watch_id) REFERENCES public.watches(id),
  CONSTRAINT watch_service_history_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES public.profiles(id),
  CONSTRAINT watch_service_history_service_provider_pro_id_fkey FOREIGN KEY (service_provider_pro_id) REFERENCES public.profiles(id),
  CONSTRAINT watch_service_history_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.market_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  model text,
  reference_number text,
  watch_condition_id uuid,
  sale_platform text NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL,
  listing_date date,
  item_url text,
  extracted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT market_prices_pkey PRIMARY KEY (id),
  CONSTRAINT market_prices_watch_condition_id_fkey FOREIGN KEY (watch_condition_id) REFERENCES public.watch_conditions(id),
  CONSTRAINT market_prices_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);