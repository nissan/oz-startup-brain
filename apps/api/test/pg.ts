import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { migrate, registryPool } from '../src/auth/pg-registry';

/**
 * Postgres for tests. Set OZSB_TEST_DATABASE_URL to any Postgres 14+ database the tests may create
 * schemas in (CI uses a service container; locally see docs/api/README.md). Each suite works in its
 * own throwaway schema, so suites cannot see each other and nothing is left behind.
 *
 * Without the variable the suites are skipped with a warning. CI sets OZSB_REQUIRE_POSTGRES=1, which
 * turns a missing database into a failure, so the checks cannot pass by not running.
 */
export const TEST_DATABASE_URL = process.env.OZSB_TEST_DATABASE_URL;

if (!TEST_DATABASE_URL && process.env.OZSB_REQUIRE_POSTGRES === '1') {
  throw new Error('OZSB_REQUIRE_POSTGRES=1 but OZSB_TEST_DATABASE_URL is not set: the Postgres suites would not run');
}

export const describePg: jest.Describe = TEST_DATABASE_URL
  ? describe
  : (((name: string) => {
      // eslint-disable-next-line no-console
      console.warn(`SKIPPED (no OZSB_TEST_DATABASE_URL): ${name}`);
      // A suite file must hold at least one test, so the skip is itself a (skipped) test.
      describe.skip(name, () => {
        it('needs OZSB_TEST_DATABASE_URL', () => undefined);
      });
    }) as unknown as jest.Describe);

export interface TestSchema {
  url: string;
  schema: string;
  pool: Pool;
  drop(): Promise<void>;
}

export async function freshSchema(options: { migrated?: boolean } = {}): Promise<TestSchema> {
  const schema = `t_${randomBytes(6).toString('hex')}`;
  const root = new Pool({ connectionString: TEST_DATABASE_URL, max: 1 });
  await root.query(`CREATE SCHEMA ${schema}`);
  const pool = registryPool(TEST_DATABASE_URL!, { schema });
  if (options.migrated !== false) await migrate(pool);
  return {
    url: TEST_DATABASE_URL!,
    schema,
    pool,
    async drop() {
      await pool.end();
      await root.query(`DROP SCHEMA ${schema} CASCADE`);
      await root.end();
    },
  };
}
