import { guardar } from '../lib/store.js';
import { readJson, send } from '../lib/http.js';

const clean = (v, max) => String(v ?? '').replace(/\s+$/g, '').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  const body = await readJson(req);
  if (body.web) return send(res, 200, { ok: true }); // trampa para bots
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    fecha: new Date().toISOString(),
    nombre: clean(body.nombre, 80),
    admiras: clean(body.admiras, 2000),
    palabras: clean(body.palabras, 2000),
    recuerdo: clean(body.recuerdo, 3000),
  };
  if (!item.nombre || !item.admiras || !item.palabras || !item.recuerdo) {
    return send(res, 400, { error: 'Faltan respuestas' });
  }
  try {
    await guardar(item);
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: 'No se pudo guardar, intenta de nuevo' });
  }
}
