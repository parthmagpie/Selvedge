// Database row types for Selvedge tables

export interface FabricRow {
  id: string;
  title: string;
  material: string;
  weave_type: string | null;
  color_family: string;
  price_per_yard: number;
  yards_available: number;
  width_inches: number;
  weight_gsm: number | null;
  factory_id: string;
  image_url: string;
  ai_confidence: number;
  status: string;
  created_at: string;
}

export interface FactoryRow {
  id: string;
  name: string;
  location: string;
  country: string;
  certifications: string[] | null;
  logo_url: string | null;
  created_at: string;
}

export interface FavoriteRow {
  id: string;
  listing_id: string;
  session_id: string;
  created_at: string;
}
