// Guarda y lee las respuestas.
// En Vercel usa Upstash Redis (variables KV_REST_API_URL / KV_REST_API_TOKEN
// o UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
// En local, sin esas variables, usa el archivo data/respuestas.json.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'juliana:respuestas';
const FILE = path.join(process.cwd(), 'data', 'respuestas.json');

async function redis(command) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || `Redis HTTP ${r.status}`);
  return j.result;
}

async function readFile() {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return []; }
}

export async function guardar(item) {
  if (REDIS_URL && REDIS_TOKEN) return redis(['RPUSH', KEY, JSON.stringify(item)]);
  if (process.env.VERCEL) throw new Error('Almacenamiento no configurado: conecta Upstash Redis en Vercel');
  const all = await readFile();
  all.push(item);
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2));
}

export async function listar() {
  if (REDIS_URL && REDIS_TOKEN) {
    const rows = await redis(['LRANGE', KEY, '0', '-1']);
    return rows.map((s) => JSON.parse(s));
  }
  if (process.env.VERCEL) throw new Error('Almacenamiento no configurado: conecta Upstash Redis en Vercel');
  return readFile();
}
