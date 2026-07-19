import { spawnSync } from 'node:child_process';

const testDatabaseUrl = process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:mysecretpassword@127.0.0.1:5432/mutux_test?schema=public';
const databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, '');

if (databaseName !== 'mutux_test') {
  throw new Error('TEST_DATABASE_URL must point exactly to the disposable mutux_test database.');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!process.env.CI) {
  run('docker', ['compose', 'up', '-d', 'postgres']);
  const created = spawnSync(
    'docker',
    ['compose', 'exec', '-T', 'postgres', 'createdb', '-U', 'postgres', 'mutux_test'],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  );
  if (created.status !== 0 && !created.stderr.includes('already exists')) {
    process.stderr.write(created.stderr ?? created.error?.message ?? 'Could not create mutux_test.');
    process.exit(created.status ?? 1);
  }
}

const env = { ...process.env, DATABASE_URL: testDatabaseUrl, TEST_DATABASE_URL: testDatabaseUrl };
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
run(npx, ['prisma', 'migrate', 'reset', '--force'], { env });
run(npx, ['jest', '--config', './test/jest-integration.json', '--runInBand'], { env });
