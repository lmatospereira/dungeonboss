// API do Masmorra do Rei Ogro.
// Contas (nome + senha), salvamento na nuvem, perfil público, Invasão (PvP assíncrono) e ranking.
// A pontuação (troféus) é calculada aqui no servidor; o cliente só informa o resultado da luta.
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, q, migrate, waitForDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET ausente ou curto demais');
const PORT = +(process.env.PORT || 3000);

const HEROES = new Set(['brom', 'lyra', 'alva', 'vex', 'kai', 'mira', 'rook', 'nyx']);
const MAX_LVL = 30, MAX_EVO = 3;
const RAID_MIN_SECONDS = 8;           // uma invasão real leva mais que isso
const RAID_TTL_MINUTES = 30;          // tickets de invasão expiram
const ELO_K = 32;

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' }, trustProxy: true, bodyLimit: 64 * 1024 });
await app.register(rateLimit, { global: true, max: 240, timeWindow: '1 minute' });

/* ---------- utilidades ---------- */
const clampInt = (v, a, b) => Math.max(a, Math.min(b, Math.round(Number(v) || 0)));
const USER_RE = /^[\p{L}\p{N}_ .-]{3,20}$/u;
const sign = u => jwt.sign({ sub: String(u.id), name: u.username }, JWT_SECRET, { expiresIn: '60d' });

function cleanDefense(list) {
  if (!Array.isArray(list) || list.length !== 4) return null;
  const out = [], seen = new Set();
  for (const t of list) {
    if (!t || !HEROES.has(t.k) || seen.has(t.k)) return null;
    seen.add(t.k);
    out.push({ k: t.k, lvl: clampInt(t.lvl, 1, MAX_LVL), evo: clampInt(t.evo ?? 1, 1, MAX_EVO) });
  }
  return out;
}

async function auth(req, reply) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return reply.code(401).send({ error: 'Entre na sua conta para continuar.' });
  try {
    const p = jwt.verify(token, JWT_SECRET);
    req.userId = Number(p.sub);
    req.userName = p.name;
  } catch {
    return reply.code(401).send({ error: 'Sua sessão expirou. Entre de novo.' });
  }
}

async function profileOf(userId) {
  const { rows } = await q(
    `SELECT u.username AS name, p.rating, p.wins, p.losses, p.def_wins, p.def_losses, p.power, p.defense
       FROM users u JOIN players p ON p.user_id = u.id WHERE u.id = $1`, [userId]);
  return rows[0] || null;
}

/* ---------- saúde ---------- */
app.get('/api/health', async () => {
  await q('SELECT 1');
  return { ok: true };
});

/* ---------- contas ---------- */
const authLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

app.post('/api/auth/register', authLimit, async (req, reply) => {
  const { username, password, save } = req.body || {};
  const name = String(username || '').trim();
  if (!USER_RE.test(name)) return reply.code(400).send({ error: 'O nome precisa ter de 3 a 20 letras, números, espaço, ponto, hífen ou _.' });
  if (typeof password !== 'string' || password.length < 6 || password.length > 72)
    return reply.code(400).send({ error: 'A senha precisa ter de 6 a 72 caracteres.' });
  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO users (username, pass_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING RETURNING id, username`, [name, hash]);
    if (!rows.length) { await client.query('ROLLBACK'); return reply.code(409).send({ error: 'Esse nome já está em uso. Escolha outro.' }); }
    const user = rows[0];
    await client.query(`INSERT INTO players (user_id) VALUES ($1)`, [user.id]);
    if (save && typeof save === 'object') await client.query(`INSERT INTO saves (user_id, data) VALUES ($1, $2)`, [user.id, save]);
    await client.query('COMMIT');
    return { token: sign(user), name: user.username };
  } catch (e) {
    await client.query('ROLLBACK'); throw e;
  } finally { client.release(); }
});

app.post('/api/auth/login', authLimit, async (req, reply) => {
  const { username, password } = req.body || {};
  const { rows } = await q(`SELECT id, username, pass_hash FROM users WHERE username = $1`, [String(username || '').trim()]);
  const ok = rows.length && typeof password === 'string' && await bcrypt.compare(password, rows[0].pass_hash);
  if (!ok) return reply.code(401).send({ error: 'Nome ou senha incorretos.' });
  await q(`UPDATE users SET last_seen = now() WHERE id = $1`, [rows[0].id]);
  return { token: sign(rows[0]), name: rows[0].username };
});

/* ---------- salvamento ---------- */
app.get('/api/me', { preHandler: auth }, async (req, reply) => {
  const profile = await profileOf(req.userId);
  if (!profile) return reply.code(401).send({ error: 'Conta não encontrada. Entre de novo.' });
  const s = await q(`SELECT data, updated_at FROM saves WHERE user_id = $1`, [req.userId]);
  await q(`UPDATE users SET last_seen = now() WHERE id = $1`, [req.userId]);
  return { profile, save: s.rows[0]?.data ?? null, saveUpdatedAt: s.rows[0]?.updated_at ?? null };
});

app.put('/api/save', { preHandler: auth, config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req, reply) => {
  const { save, defense, power } = req.body || {};
  if (!save || typeof save !== 'object' || Array.isArray(save)) return reply.code(400).send({ error: 'Salvamento inválido.' });
  await q(`INSERT INTO saves (user_id, data, updated_at) VALUES ($1, $2, now())
           ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`, [req.userId, save]);
  const def = cleanDefense(defense);
  if (def) await q(`UPDATE players SET defense = $2, power = $3, updated_at = now() WHERE user_id = $1`,
    [req.userId, JSON.stringify(def), clampInt(power, 0, 1e7)]);
  return { ok: true, profile: await profileOf(req.userId) };
});

/* ---------- invasão ---------- */
app.get('/api/arena/opponents', { preHandler: auth }, async (req) => {
  const me = await profileOf(req.userId);
  const { rows } = await q(
    `SELECT p.user_id AS id, u.username AS name, p.rating, p.power, p.defense
       FROM players p JOIN users u ON u.id = p.user_id
      WHERE p.user_id <> $1 AND jsonb_array_length(p.defense) = 4
      ORDER BY abs(p.rating - $2) + random() * 120
      LIMIT 3`, [req.userId, me?.rating ?? 1000]);
  return { opponents: rows };
});

app.post('/api/arena/start', { preHandler: auth, config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
  const opp = Number(req.body?.opponentId);
  if (!Number.isInteger(opp) || opp === req.userId) return reply.code(400).send({ error: 'Oponente inválido.' });
  const { rows: o } = await q(`SELECT user_id FROM players WHERE user_id = $1 AND jsonb_array_length(defense) = 4`, [opp]);
  if (!o.length) return reply.code(404).send({ error: 'Esse oponente não está mais disponível.' });
  const { rows } = await q(`INSERT INTO raids (attacker_id, defender_id) VALUES ($1, $2) RETURNING id`, [req.userId, opp]);
  return { raidId: Number(rows[0].id) };
});

app.post('/api/arena/finish', { preHandler: auth }, async (req, reply) => {
  const raidId = Number(req.body?.raidId), won = req.body?.won === true;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT id, defender_id, started_at FROM raids
        WHERE id = $1 AND attacker_id = $2 AND finished_at IS NULL
          AND started_at > now() - ($3 || ' minutes')::interval FOR UPDATE`, [raidId, req.userId, RAID_TTL_MINUTES]);
    if (!rows.length) { await client.query('ROLLBACK'); return reply.code(409).send({ error: 'Essa invasão já terminou ou expirou.' }); }
    const raid = rows[0];
    const secs = (Date.now() - new Date(raid.started_at).getTime()) / 1000;
    const counted = !won || secs >= RAID_MIN_SECONDS;
    const { rows: rr } = await client.query(
      `SELECT user_id, rating FROM players WHERE user_id = ANY($1) FOR UPDATE`, [[req.userId, raid.defender_id]]);
    const ra = rr.find(r => Number(r.user_id) === req.userId).rating;
    const rd = rr.find(r => Number(r.user_id) === Number(raid.defender_id)).rating;
    const exp = 1 / (1 + Math.pow(10, (rd - ra) / 400));
    const delta = counted ? clampInt(ELO_K * ((won ? 1 : 0) - exp), -ELO_K, ELO_K) : 0;
    await client.query(`UPDATE players SET rating = GREATEST(0, rating + $2), wins = wins + $3, losses = losses + $4 WHERE user_id = $1`,
      [req.userId, delta, won && counted ? 1 : 0, won ? 0 : 1]);
    await client.query(`UPDATE players SET rating = GREATEST(0, rating - $2), def_wins = def_wins + $3, def_losses = def_losses + $4 WHERE user_id = $1`,
      [raid.defender_id, delta, won ? 0 : 1, won && counted ? 1 : 0]);
    await client.query(`UPDATE raids SET finished_at = now(), attacker_won = $2, delta = $3 WHERE id = $1`, [raid.id, won, delta]);
    await client.query('COMMIT');
    return { delta, counted, profile: await profileOf(req.userId) };
  } catch (e) {
    await client.query('ROLLBACK'); throw e;
  } finally { client.release(); }
});

app.get('/api/arena/defenses', { preHandler: auth }, async (req) => {
  const { rows } = await q(
    `UPDATE raids r SET seen = true FROM users u
      WHERE r.defender_id = $1 AND r.finished_at IS NOT NULL AND NOT r.seen AND u.id = r.attacker_id
      RETURNING u.username AS name, NOT r.attacker_won AS won, -r.delta AS delta, r.finished_at AS at`, [req.userId]);
  return { defenses: rows.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 20) };
});

app.get('/api/arena/leaderboard', async () => {
  const { rows } = await q(
    `SELECT p.user_id AS id, u.username AS name, p.rating, p.power
       FROM players p JOIN users u ON u.id = p.user_id
      ORDER BY p.rating DESC, p.updated_at ASC LIMIT 50`);
  return { players: rows };
});

/* ---------- erros ---------- */
app.setErrorHandler((err, req, reply) => {
  if (err.statusCode === 429) return reply.code(429).send({ error: 'Muitas tentativas. Espere um pouco e tente de novo.' });
  if (err.validation || err.statusCode === 400) return reply.code(400).send({ error: 'Pedido inválido.' });
  req.log.error(err);
  reply.code(500).send({ error: 'Erro no servidor. Tente de novo em instantes.' });
});

/* ---------- limpeza periódica de tickets abandonados ---------- */
setInterval(() => {
  q(`DELETE FROM raids WHERE finished_at IS NULL AND started_at < now() - interval '1 day'`).catch(e => app.log.warn(e));
}, 60 * 60 * 1000).unref();

await waitForDb(app.log);
await migrate(app.log);
await app.listen({ host: '0.0.0.0', port: PORT });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => { await app.close(); await pool.end(); process.exit(0); });
