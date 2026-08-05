ALTER TYPE "resolution_type_enum" ADD VALUE IF NOT EXISTS 'renter_compensation';
ALTER TYPE "resolution_type_enum" ADD VALUE IF NOT EXISTS 'lender_compensation';
ALTER TYPE "escrow_status_type" ADD VALUE IF NOT EXISTS 'renter_compensated';
