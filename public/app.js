const screens = [...document.querySelectorAll('.screen')];
const data = {};
let current = 0;

function show(i) {
  screens[current].classList.remove('is-active');
  current = Math.max(0, Math.min(i, screens.length - 1));
  screens[current].classList.add('is-active');
  window.scrollTo({ top: 0 });
  const field = screens[current].querySelector('input:not(.hp), textarea');
  if (field) setTimeout(() => field.focus({ preventScroll: true }), 450);
}

document.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => show(current + 1)));
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show(current - 1)));
document.querySelectorAll('[data-home]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('form').forEach((f) => f.reset());
  document.querySelectorAll('.error').forEach((e) => (e.textContent = ''));
  for (const k in data) delete data[k];
  show(0);
}));

// Estrellita: Juliana entra a ver sus mensajes
const starDialog = document.getElementById('star-dialog');
const starForm = document.getElementById('star-form');
document.querySelector('[data-star]').addEventListener('click', () => {
  starForm.reset(); starForm.querySelector('.error').textContent = '';
  starDialog.showModal();
});
starDialog.querySelector('[data-close]').addEventListener('click', () => starDialog.close());
starForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = starForm.elements.password.value;
  const err = starForm.querySelector('.error');
  const r = await fetch('/api/respuestas', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).catch(() => null);
  if (r && r.ok) {
    sessionStorage.setItem('juliana-pass', password);
    location.href = '/respuestas';
  } else {
    err.textContent = r && r.status === 401 ? 'Contraseña incorrecta' : 'No se pudo entrar, intenta de nuevo';
  }
});

document.querySelectorAll('form[data-form]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = form.dataset.form;
    const field = form.elements[key];
    const error = form.querySelector('.error');
    const value = field.value.trim();
    if (!value) {
      error.textContent = key === 'nombre' ? 'Escribe tu nombre para continuar' : 'Escribe tu respuesta para continuar';
      field.focus();
      return;
    }
    error.textContent = '';
    data[key] = value;
    if (form.elements.web) data.web = form.elements.web.value;

    if (!('last' in form.dataset)) return show(current + 1);

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      const r = await fetch('/api/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Error al enviar');
      show(current + 1);
      confetti.burst();
    } catch (err) {
      error.textContent = err.message + '. Intenta de nuevo.';
      btn.disabled = false; btn.textContent = 'Enviar';
      return;
    }
    btn.disabled = false; btn.textContent = 'Enviar';
  });
});

// ---------- Confeti suave alrededor de la invitación ----------
const confetti = (() => {
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#e8a3b0', '#a9c1dc', '#f3c9a0', '#c9b6e4', '#f4c6cf', '#9fc5b8', '#ffffff'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, dpr, pieces = [];

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Casi siempre en los bordes, para no tapar la foto
  function pickX() {
    const col = Math.min(W, 480), left = (W - col) / 2;
    if (Math.random() < 0.3) return Math.random() * W;
    const band = col * 0.2;
    return Math.random() < 0.5 ? left - band * 0.5 + Math.random() * band * 1.5
                               : left + col - band + Math.random() * band * 1.5;
  }

  function make(y, fast) {
    return {
      x: pickX(), y,
      s: 4 + Math.random() * 5,
      vy: (fast ? 1.2 : 0.35) + Math.random() * (fast ? 1.2 : 0.45),
      sway: 0.4 + Math.random() * 0.9, ph: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.04,
      a: 0.35 + Math.random() * 0.3,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      round: Math.random() < 0.35, once: fast,
    };
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    pieces = pieces.filter((p) => !(p.once && p.y > H + 20));
    for (const p of pieces) {
      p.y += p.vy; p.rot += p.vr;
      const x = p.x + Math.sin(t / 900 + p.ph) * 12 * p.sway;
      if (p.y > H + 20) { Object.assign(p, make(-20, false)); }
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.s / 2, -p.s * 0.3, p.s, p.s * 0.6 * (0.4 + Math.abs(Math.cos(p.rot * 2))));
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }

  if (!reduce) {
    resize();
    addEventListener('resize', resize);
    const n = Math.round(Math.min(45, 18 + W / 25));
    for (let i = 0; i < n; i++) pieces.push(make(Math.random() * H, false));
    requestAnimationFrame(frame);
  }
  return {
    burst() { if (!reduce) for (let i = 0; i < 40; i++) pieces.push(make(-20 - Math.random() * H * 0.6, true)); },
  };
})();
