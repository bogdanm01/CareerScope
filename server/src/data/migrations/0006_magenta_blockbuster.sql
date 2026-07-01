ALTER TABLE "job_posting" ADD COLUMN "work_location" text;--> statement-breakpoint
ALTER TABLE "job_posting" ADD COLUMN "employment_type" text;--> statement-breakpoint
ALTER TABLE "job_posting" ADD COLUMN "salary_range" text;--> statement-breakpoint
ALTER TABLE "job_posting" ADD CONSTRAINT "work_location_check" CHECK ("job_posting"."work_location" IN ('Remote', 'OnSite', 'Hybrid'));--> statement-breakpoint
ALTER TABLE "job_posting" ADD CONSTRAINT "employment_type_check" CHECK ("job_posting"."employment_type" IN ('FullTime', 'PartTime', 'Contract', 'Internship', 'Temporary', 'Other'));
