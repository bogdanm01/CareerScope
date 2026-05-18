ALTER TABLE "company" ADD COLUMN "approval_status" text DEFAULT 'PendingApproval' NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "approval_rejection_reason" text;