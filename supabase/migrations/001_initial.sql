-- Initial schema for Selvedge: Premium Deadstock Textile Marketplace

-- Factories table: stores factory profiles
CREATE TABLE IF NOT EXISTS factories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  country text NOT NULL,
  certifications text[],
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on factories
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

-- Public read for factories (no auth in MVP)
DROP POLICY IF EXISTS "factories_select_public" ON factories;
CREATE POLICY "factories_select_public" ON factories
  FOR SELECT USING (true);

-- Fabrics table: stores listing data
CREATE TABLE IF NOT EXISTS fabrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  material text NOT NULL,
  weave_type text,
  color_family text NOT NULL,
  price_per_yard numeric NOT NULL,
  yards_available numeric NOT NULL,
  width_inches numeric NOT NULL,
  weight_gsm numeric,
  factory_id uuid REFERENCES factories(id) NOT NULL,
  image_url text NOT NULL,
  ai_confidence numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on fabrics
ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;

-- Public read for fabrics (no auth in MVP)
DROP POLICY IF EXISTS "fabrics_select_public" ON fabrics;
CREATE POLICY "fabrics_select_public" ON fabrics
  FOR SELECT USING (true);

-- Favorites table: stores user favorites (using session_id for MVP, no auth)
CREATE TABLE IF NOT EXISTS favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES fabrics(id) NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Public read/write for favorites (no auth in MVP, session-based)
DROP POLICY IF EXISTS "favorites_select_public" ON favorites;
CREATE POLICY "favorites_select_public" ON favorites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "favorites_insert_public" ON favorites;
CREATE POLICY "favorites_insert_public" ON favorites
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "favorites_delete_public" ON favorites;
CREATE POLICY "favorites_delete_public" ON favorites
  FOR DELETE USING (true);

-- Add comments explaining table purposes
COMMENT ON TABLE factories IS 'Stores factory profiles for textile manufacturers';
COMMENT ON TABLE fabrics IS 'Stores fabric listing data with AI-analyzed metadata';
COMMENT ON TABLE favorites IS 'Stores user favorites using session_id (no auth in MVP)';
