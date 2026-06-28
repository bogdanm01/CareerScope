---- Custom SQL migration file, put your code below! --

ALTER TABLE "skill"
  ADD COLUMN IF NOT EXISTS "requires_years_of_experience" boolean NOT NULL DEFAULT true;

UPDATE "skill"
SET "requires_years_of_experience" = false
WHERE "category_id" IN (
  SELECT "id"
  FROM "skill_category"
  WHERE "slug" IN ('soft_skill')
);

ALTER TABLE "user_skill"
  ALTER COLUMN "years_of_experience" DROP NOT NULL;
