export type WatchStatus =
  | 'in_collection' | 'for_sale' | 'for_exchange'
  | 'consignment' | 'in_repair' | 'for_expertise' | 'sold_by_pro' | 'purchased_by_pro' | 'returned';

export type Plan = 'free' | 'premium';
export type AccountType = 'free' | 'pro_basic' | 'pro_premium' | 'admin';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  profile_picture_url: string | null;
  wrist_size_cm: number | null;
  is_public: boolean | null;
  allow_private_messages?: boolean | null;
  preferred_language?: string | null;
  time_zone?: string | null;
  theme_preference?: string | null;
  account_type: AccountType | null;
  plan: Plan | null;
  created_at?: string | null;
}

export interface Photo {
  id: string;
  storage_path: string;
  photo_type: 'watch_only' | 'wrist_shot';
  is_main_photo: boolean;
  is_public_gallery?: boolean | null;
  created_at?: string | null;
}

export interface Watch {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  reference_number: string | null;
  movement: string | null;
  year_of_production: number | null;
  case_diameter_mm: number | null;
  lug_to_lug_mm: number | null;
  lug_width_mm: number | null;
  dial_color: string | null;
  case_material: string | null;
  bracelet_material: string | null;
  bracelet_type: string | null;
  condition: string | null;
  box_papers_status: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  purchase_location: string | null;
  current_estimated_value: number | null;
  last_service_date: string | null;
  notes_history: string | null;
  current_status: WatchStatus;
  sale_price: number | null;
  passport_public: boolean | null;
  created_at: string;
  updated_at?: string | null;
  photos?: Photo[];
}

export type WatchInput = Omit<Watch, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'photos'>;

export interface WearLog {
  id: string;
  watch_id: string;
  worn_on: string; // AAAA-MM-JJ
  note: string | null;
}

export type MaintenanceKind =
  | 'revision' | 'polissage' | 'reglage' | 'etancheite' | 'reparation' | 'pile' | 'bracelet' | 'autre';

export interface MaintenanceEntry {
  id: string;
  watch_id: string;
  performed_on: string;
  kind: MaintenanceKind;
  provider: string | null;
  cost: number | null;
  notes: string | null;
  next_due_on: string | null;
}

export interface ValuePoint {
  watch_id: string;
  value: number;
  recorded_at: string;
}

export interface WishlistItem {
  id: string;
  brand: string;
  model: string;
  reference_number: string | null;
  target_price: number | null;
  priority: 1 | 2 | 3;
  notes: string | null;
  acquired_at: string | null;
  created_at: string;
}

export interface Passport {
  id: string;
  brand: string;
  model: string;
  reference_number: string | null;
  year_of_production: number | null;
  movement: string | null;
  case_diameter_mm: number | null;
  lug_to_lug_mm: number | null;
  lug_width_mm: number | null;
  case_material: string | null;
  dial_color: string | null;
  bracelet_material: string | null;
  bracelet_type: string | null;
  condition: string | null;
  box_papers_status: string | null;
  owner_username: string | null;
  owner_is_public: boolean;
  is_owner: boolean;
  service_count: number;
  last_service_on: string | null;
  wear_count: number;
  photos: Pick<Photo, 'storage_path' | 'photo_type' | 'is_main_photo'>[];
}

export interface PublicCollection {
  id: string;
  username: string;
  profile_picture_url: string | null;
  created_at: string | null;
  is_public: boolean;
  watches: {
    id: string;
    brand: string;
    model: string;
    reference_number: string | null;
    year_of_production: number | null;
    main_photo_path: string | null;
  }[];
}

export interface GalleryShot {
  id: string;
  url: string;
  watch_id: string;
  brand: string;
  model: string;
  username: string | null;
  wrist_size_cm: number | null;
}
