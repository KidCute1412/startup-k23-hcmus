CREATE TABLE "carts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "renter_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cart_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "gear_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cart_items_valid_period" CHECK ("start_date" < "end_date")
);

CREATE UNIQUE INDEX "carts_renter_id_key" ON "carts"("renter_id");
CREATE UNIQUE INDEX "cart_items_cart_id_gear_id_key" ON "cart_items"("cart_id", "gear_id");
CREATE INDEX "idx_cart_items_cart" ON "cart_items"("cart_id");
CREATE INDEX "idx_cart_items_gear" ON "cart_items"("gear_id");
CREATE INDEX "idx_cart_items_gear_period" ON "cart_items"("gear_id", "start_date", "end_date");

ALTER TABLE "carts" ADD CONSTRAINT "carts_renter_id_fkey"
  FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey"
  FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_gear_id_fkey"
  FOREIGN KEY ("gear_id") REFERENCES "gears"("id") ON DELETE CASCADE ON UPDATE CASCADE;
