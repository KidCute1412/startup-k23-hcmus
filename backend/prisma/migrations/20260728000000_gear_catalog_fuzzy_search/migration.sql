CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_gears_name_trgm
  ON gears USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gears_brand_trgm
  ON gears USING GIN (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gears_model_trgm
  ON gears USING GIN (model gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gears_description_trgm
  ON gears USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_reviews_target_gear_type
  ON reviews (target_gear_id, target_type);
