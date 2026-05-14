CREATE TABLE "application_status_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "application_status_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_application_id" integer NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "status_check" CHECK ("application_status_history"."status" IN ('Submitted', 'UnderReview', 'Rejected', 'Accepted', 'Withdrawn'))
);
--> statement-breakpoint
ALTER TABLE "job_application" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_application" ALTER COLUMN "job_posting_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_job_application_id_job_application_id_fk" FOREIGN KEY ("job_application_id") REFERENCES "public"."job_application"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application" ADD CONSTRAINT "user_id_job_posting_id_unq" UNIQUE("user_id","job_posting_id");--> statement-breakpoint
ALTER TABLE "job_application" ADD CONSTRAINT "status_check" CHECK ("job_application"."status" IN ('Submitted', 'UnderReview', 'Rejected', 'Accepted', 'Withdrawn'));