CREATE TABLE "job_posting_hiring_stage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_posting_hiring_stage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_posting_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_application_hiring_stage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_application_hiring_stage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_application_id" integer NOT NULL,
	"job_posting_hiring_stage_id" integer,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer NOT NULL,
	"status" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"internal_note" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "status_check" CHECK ("job_application_hiring_stage"."status" IN ('Pending', 'Scheduled', 'Completed', 'Skipped', 'Cancelled'))
);
--> statement-breakpoint
ALTER TABLE "job_posting_hiring_stage" ADD CONSTRAINT "job_posting_hiring_stage_job_posting_id_job_posting_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_posting"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_hiring_stage" ADD CONSTRAINT "job_application_hiring_stage_job_application_id_job_application_id_fk" FOREIGN KEY ("job_application_id") REFERENCES "public"."job_application"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_hiring_stage" ADD CONSTRAINT "job_application_hiring_stage_job_posting_hiring_stage_id_job_posting_hiring_stage_id_fk" FOREIGN KEY ("job_posting_hiring_stage_id") REFERENCES "public"."job_posting_hiring_stage"("id") ON DELETE no action ON UPDATE no action;
