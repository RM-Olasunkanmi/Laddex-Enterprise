import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "laddex"."enum_checkout_sessions_payment_method" AS ENUM('paystack', 'bank-transfer');
  ALTER TYPE "laddex"."enum_checkout_sessions_status" ADD VALUE 'awaiting-verification' BEFORE 'paid';
  ALTER TYPE "laddex"."enum_checkout_sessions_status" ADD VALUE 'rejected' BEFORE 'failed';
  CREATE TABLE "laddex"."payment_receipts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "laddex"."checkout_sessions" ADD COLUMN "payment_method" "laddex"."enum_checkout_sessions_payment_method";
  ALTER TABLE "laddex"."checkout_sessions" ADD COLUMN "payment_payer_name" varchar;
  ALTER TABLE "laddex"."checkout_sessions" ADD COLUMN "payment_payer_bank" varchar;
  ALTER TABLE "laddex"."checkout_sessions" ADD COLUMN "payment_amount_paid_kobo" numeric;
  ALTER TABLE "laddex"."checkout_sessions" ADD COLUMN "payment_paid_at" timestamp(3) with time zone;
  ALTER TABLE "laddex"."checkout_sessions" ADD COLUMN "payment_transfer_reference" varchar;
  ALTER TABLE "laddex"."checkout_sessions" ADD COLUMN "payment_receipt_id" integer;
  ALTER TABLE "laddex"."checkout_sessions" ADD COLUMN "payment_staff_note" varchar;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD COLUMN "payment_receipts_id" integer;
  ALTER TABLE "laddex"."payment_receipts" ENABLE ROW LEVEL SECURITY;
  CREATE INDEX "payment_receipts_updated_at_idx" ON "laddex"."payment_receipts" USING btree ("updated_at");
  CREATE INDEX "payment_receipts_created_at_idx" ON "laddex"."payment_receipts" USING btree ("created_at");
  CREATE UNIQUE INDEX "payment_receipts_filename_idx" ON "laddex"."payment_receipts" USING btree ("filename");
  ALTER TABLE "laddex"."checkout_sessions" ADD CONSTRAINT "checkout_sessions_payment_receipt_id_payment_receipts_id_fk" FOREIGN KEY ("payment_receipt_id") REFERENCES "laddex"."payment_receipts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "laddex"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payment_receipts_fk" FOREIGN KEY ("payment_receipts_id") REFERENCES "laddex"."payment_receipts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "checkout_sessions_payment_payment_receipt_idx" ON "laddex"."checkout_sessions" USING btree ("payment_receipt_id");
  CREATE INDEX "payload_locked_documents_rels_payment_receipts_id_idx" ON "laddex"."payload_locked_documents_rels" USING btree ("payment_receipts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "laddex"."payment_receipts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "laddex"."payment_receipts" CASCADE;
  ALTER TABLE "laddex"."checkout_sessions" DROP CONSTRAINT "checkout_sessions_payment_receipt_id_payment_receipts_id_fk";
  
  ALTER TABLE "laddex"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payment_receipts_fk";
  
  ALTER TABLE "laddex"."checkout_sessions" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "laddex"."checkout_sessions" ALTER COLUMN "status" SET DEFAULT 'created'::text;
  DROP TYPE "laddex"."enum_checkout_sessions_status";
  CREATE TYPE "laddex"."enum_checkout_sessions_status" AS ENUM('created', 'initialized', 'paid', 'order-created', 'failed', 'expired');
  ALTER TABLE "laddex"."checkout_sessions" ALTER COLUMN "status" SET DEFAULT 'created'::"laddex"."enum_checkout_sessions_status";
  ALTER TABLE "laddex"."checkout_sessions" ALTER COLUMN "status" SET DATA TYPE "laddex"."enum_checkout_sessions_status" USING "status"::"laddex"."enum_checkout_sessions_status";
  DROP INDEX "laddex"."checkout_sessions_payment_payment_receipt_idx";
  DROP INDEX "laddex"."payload_locked_documents_rels_payment_receipts_id_idx";
  ALTER TABLE "laddex"."checkout_sessions" DROP COLUMN "payment_method";
  ALTER TABLE "laddex"."checkout_sessions" DROP COLUMN "payment_payer_name";
  ALTER TABLE "laddex"."checkout_sessions" DROP COLUMN "payment_payer_bank";
  ALTER TABLE "laddex"."checkout_sessions" DROP COLUMN "payment_amount_paid_kobo";
  ALTER TABLE "laddex"."checkout_sessions" DROP COLUMN "payment_paid_at";
  ALTER TABLE "laddex"."checkout_sessions" DROP COLUMN "payment_transfer_reference";
  ALTER TABLE "laddex"."checkout_sessions" DROP COLUMN "payment_receipt_id";
  ALTER TABLE "laddex"."checkout_sessions" DROP COLUMN "payment_staff_note";
  ALTER TABLE "laddex"."payload_locked_documents_rels" DROP COLUMN "payment_receipts_id";
  DROP TYPE "laddex"."enum_checkout_sessions_payment_method";`)
}
