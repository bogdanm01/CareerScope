ALTER TABLE "skill" DROP CONSTRAINT "skill_category_id_skill_category_id_fk";
--> statement-breakpoint
ALTER TABLE "application_review" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "job_application" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "job_posting" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_category_id_skill_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_posting_skill_job_posting_id_idx" ON "job_posting_skill" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "job_posting_skill_skill_id_idx" ON "job_posting_skill" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "job_posting_status_created_at_idx" ON "job_posting" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "job_posting_status_expires_at_idx" ON "job_posting" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "job_posting_status_company_id_idx" ON "job_posting" USING btree ("status","company_id");