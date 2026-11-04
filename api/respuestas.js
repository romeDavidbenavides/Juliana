import { listar } from '../lib/store.js';
import { readJson, send } from '../lib/http.js';

const PASSWORD = (process.env.ADMIN_PASSWORD || 'juliana').toLowerCase();

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  const { password } = await readJson(req);
  if (String(password || '').trim().toLowerCase() !== PASSWORD) {
    return send(res, 401, { error: 'Contraseña incorrecta' });
  }
  try {
    const items = await listar();
    items.sort((a, b) => b.fecha.localeCompare(a.fecha));
    return send(res, 200, { items });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: 'No se pudieron leer las respuestas' });
  }
}
