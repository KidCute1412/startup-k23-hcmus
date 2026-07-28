require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.gearCategory.findMany();
  console.log('--- ALL CATEGORIES ---');
  categories.forEach((c) => {
    console.log(`[${c.id}] name="${c.name}" parent_id=${c.parent_id}`);
  });

  const gears = await prisma.gear.findMany({
    select: { id: true, name: true, category_id: true, status: true, approval_status: true },
  });
  console.log('\n--- ALL GEARS ---');
  gears.forEach((g) => {
    console.log(`[${g.id}] cat_id=${g.category_id} status=${g.status} app=${g.approval_status} name="${g.name}"`);
  });

  // Test SQL query for category 20000000-0000-0000-0000-000000000020
  const targetCat = '20000000-0000-0000-0000-000000000020';
  const tree = await prisma.$queryRawUnsafe(`
    WITH RECURSIVE category_tree AS (
      SELECT id FROM gear_categories WHERE id = '${targetCat}'::uuid
      UNION ALL
      SELECT child.id
      FROM gear_categories child
      JOIN category_tree parent ON child.parent_id = parent.id
    )
    SELECT * FROM category_tree;
  `);
  console.log(`\n--- CATEGORY TREE FOR ${targetCat} ---`, tree);

  const matchedGears = await prisma.$queryRawUnsafe(`
    WITH RECURSIVE category_tree AS (
      SELECT id FROM gear_categories WHERE id = '${targetCat}'::uuid
      UNION ALL
      SELECT child.id
      FROM gear_categories child
      JOIN category_tree parent ON child.parent_id = parent.id
    )
    SELECT g.id, g.name, g.category_id, g.status, g.approval_status
    FROM gears g
    WHERE g.category_id IN (SELECT id FROM category_tree);
  `);
  console.log(`\n--- MATCHED GEARS FOR ${targetCat} ---`, matchedGears);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
