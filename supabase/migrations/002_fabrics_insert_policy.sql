-- Add insert policy for fabrics table to allow publishing listings
DROP POLICY IF EXISTS "fabrics_insert_public" ON fabrics;
CREATE POLICY "fabrics_insert_public" ON fabrics
  FOR INSERT WITH CHECK (true);

-- Add insert policy for factories table
DROP POLICY IF EXISTS "factories_insert_public" ON factories;
CREATE POLICY "factories_insert_public" ON factories
  FOR INSERT WITH CHECK (true);
