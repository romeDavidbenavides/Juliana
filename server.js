// Servidor local de prueba: sirve /public y las funciones de /api igual que Vercel.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import enviar from './api/enviar.js';
import respuestas from './api/respuestas.js';

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve('public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
const API = { '/api/enviar': enviar, '/api/respuestas': respuestas };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (API[url.pathname]) return API[url.pathname](req, res);
  let p = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!p.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  for (const cand of [p, p + '.html', path.join(p, 'index.html')]) {
    try {
      const st = await fs.stat(cand);
      if (!st.isFile()) continue;
      res.setHeader('Content-Type', TYPES[path.extname(cand)] || 'application/octet-stream');
      return res.end(await fs.readFile(cand));
    } catch {}
  }
  res.statusCode = 404; res.end('No encontrado');
}).listen(PORT, () => console.log(`Listo en http://localhost:${PORT}`));
