ALTER TABLE "rental_orders"
ADD COLUMN "cancelled_reason" VARCHAR(100),
ADD COLUMN "return_deadline_at" TIMESTAMP(3);

UPDATE "rental_orders"
SET
  "ship_deadline_at" = "start_date" - INTERVAL '7 hours' - INTERVAL '1 millisecond',
  "return_deadline_at" = "end_date" + INTERVAL '17 hours' - INTERVAL '1 millisecond';
