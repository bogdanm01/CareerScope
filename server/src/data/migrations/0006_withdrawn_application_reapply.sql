ALTER TABLE "job_application" DROP CONSTRAINT "user_id_job_posting_id_unq";--> statement-breakpoint
CREATE UNIQUE INDEX "user_id_job_posting_id_unq" ON "job_application" ("user_id", "job_posting_id") WHERE "status" <> 'Withdrawn';
