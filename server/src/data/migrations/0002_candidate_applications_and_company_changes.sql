ALTER TABLE "job_application" ADD COLUMN "candidate_deleted_at" timestamp with time zone;

CREATE TABLE "company_change_request" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "company_change_request_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "company_id" integer NOT NULL,
  "created_by_user_id" text NOT NULL,
  "status" text DEFAULT 'PendingApproval' NOT NULL,
  "rejection_reason" text,
  "name" text NOT NULL,
  "tax_id" text NOT NULL,
  "short_description" text,
  "description" text,
  "founding_year" integer,
  "number_of_employees" integer,
  "address" text NOT NULL,
  "logo_url" text,
  "website_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "status_check" CHECK ("company_change_request"."status" IN ('PendingApproval', 'Approved', 'Rejected'))
);

ALTER TABLE "company_change_request" ADD CONSTRAINT "company_change_request_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "company_change_request" ADD CONSTRAINT "company_change_request_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
