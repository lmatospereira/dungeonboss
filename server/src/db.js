// Conexão com o Postgres e migrações versionadas (aplicadas na inicialização).
import pg from 'pg';

export const pool = new pg.Pool({
  host: process.env.PGHOST || 'db',
  port: +(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'masmorra',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'masmorra',
  max: 10,
});

export const q = (text, params) => pool.query(text, params);

const MIGRATIONS = [
  // 1: contas, salvamento, perfil público e invasões
  `CREATE EXTENSION IF NOT EXISTS citext;
   CREATE TABLE users (
     id          BIGSERIAL PRIMARY KEY,
     username    CITEXT NOT NULL UNIQUE,
     pass_hash   TEXT NOT NULL,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     last_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE TABLE saves (
     user_id     BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     data        JSONB NOT NULL,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE TABLE players (
     user_id     BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     rating      INT NOT NULL DEFAULT 1000,
     wins        INT NOT NULL DEFAULT 0,
     losses      INT NOT NULL DEFAULT 0,
     def_wins    INT NOT NULL DEFAULT 0,
     def_losses  INT NOT NULL DEFAULT 0,
     power       INT NOT NULL DEFAULT 0,
     defense     JSONB NOT NULL DEFAULT '[]',
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX players_rating_idx ON players (rating DESC);
   CREATE TABLE raids (
     id           BIGSERIAL PRIMARY KEY,
     attacker_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     defender_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     finished_at  TIMESTAMPTZ,
     attacker_won BOOLEAN,
     delta        INT,
     seen         BOOLEAN NOT NULL DEFAULT false
   );
   CREATE INDEX raids_defender_idx ON raids (defender_id, seen) WHERE finished_at IS NOT NULL;
   CREATE INDEX raids_attacker_idx ON raids (attacker_id, started_at DESC);`,
];

export async function migrate(log) {
  await q(`CREATE TABLE IF NOT EXISTS schema_version (version INT NOT NULL)`);
  const { rows } = await q(`SELECT max(version) AS v FROM schema_version`);
  let v = rows[0].v ?? 0;
  for (; v < MIGRATIONS.length; v++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(MIGRATIONS[v]);
      await client.query('INSERT INTO schema_version VALUES ($1)', [v + 1]);
      await client.query('COMMIT');
      log.info(`migração ${v + 1} aplicada`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export async function waitForDb(log, tries = 30) {
  for (let i = 0; i < tries; i++) {
    try { await q('SELECT 1'); return; } catch (e) {
      log.warn(`banco ainda indisponível (${e.code || e.message}), tentando de novo`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('banco de dados não respondeu');
}
