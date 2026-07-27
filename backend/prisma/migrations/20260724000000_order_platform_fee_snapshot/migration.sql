ALTER TABLE "rental_orders" ADD COLUMN "platform_fee" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "rental_orders" ADD COLUMN "lender_income" DECIMAL(15,2) NOT NULL DEFAULT 0;
