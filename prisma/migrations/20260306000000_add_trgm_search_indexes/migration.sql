-- Enable pg_trgm extension for trigram-based fuzzy search (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes to speed up ILIKE and similarity() queries on search columns
CREATE INDEX IF NOT EXISTS "idx_restaurants_name_trgm" ON "restaurants" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_restaurants_city_trgm" ON "restaurants" USING GIN (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_food_categories_name_trgm" ON "food_categories" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_users_display_name_trgm" ON "users" USING GIN (display_name gin_trgm_ops);
