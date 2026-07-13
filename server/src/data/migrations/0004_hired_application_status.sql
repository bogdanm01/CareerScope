ALTER TABLE "application_status_history" DROP CONSTRAINT "status_check";--> statement-breakpoint
ALTER TABLE "job_application" DROP CONSTRAINT "status_check";--> statement-breakpoint
UPDATE "application_status_history" SET "status" = 'Hired' WHERE "status" = 'Accepted';--> statement-breakpoint
UPDATE "job_application" SET "status" = 'Hired' WHERE "status" = 'Accepted';--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "status_check" CHECK ("application_status_history"."status" IN ('Submitted', 'UnderReview', 'Rejected', 'Hired', 'Withdrawn'));--> statement-breakpoint
ALTER TABLE "job_application" ADD CONSTRAINT "status_check" CHECK ("job_application"."status" IN ('Submitted', 'UnderReview', 'Rejected', 'Hired', 'Withdrawn'));
