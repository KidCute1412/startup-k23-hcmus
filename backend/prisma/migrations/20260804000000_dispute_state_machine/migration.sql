ALTER TABLE "disputes"
  ADD COLUMN "reviewed_by" UUID,
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "closed_by" UUID,
  ADD COLUMN "closed_at" TIMESTAMP(3),
  ADD COLUMN "close_note" TEXT;

CREATE TABLE "dispute_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dispute_id" UUID NOT NULL,
  "from_status" "dispute_status_type",
  "to_status" "dispute_status_type" NOT NULL,
  "actor_id" UUID NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispute_transitions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "disputes"
  ADD CONSTRAINT "disputes_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "disputes_closed_by_fkey"
  FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dispute_transitions"
  ADD CONSTRAINT "dispute_transitions_dispute_id_fkey"
  FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "dispute_transitions_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_dispute_transitions_dispute_created"
  ON "dispute_transitions"("dispute_id", "created_at");
CREATE INDEX "idx_dispute_transitions_actor_created"
  ON "dispute_transitions"("actor_id", "created_at");

INSERT INTO "dispute_transitions" ("dispute_id", "from_status", "to_status", "actor_id", "created_at")
SELECT "id", NULL, "status", COALESCE("resolved_by", "reported_by"), "created_at"
FROM "disputes";
