ALTER TABLE "user" RENAME COLUMN "onboarding_step" TO "onboarding_status";

ALTER TABLE "user" ALTER COLUMN "onboarding_status" DROP DEFAULT;

ALTER TABLE "user"
  ALTER COLUMN "onboarding_status" SET DATA TYPE text
  USING CASE "onboarding_status"
    WHEN 1 THEN 'ProfileCreated'
    WHEN 2 THEN 'SkillsAdded'
    WHEN 3 THEN 'CvUploaded'
    WHEN 4 THEN 'Completed'
    ELSE 'ProfileCreated'
  END;

ALTER TABLE "user" ALTER COLUMN "onboarding_status" SET DEFAULT 'ProfileCreated';
ALTER TABLE "user" ALTER COLUMN "onboarding_status" SET NOT NULL;
