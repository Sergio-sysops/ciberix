// El recuadro con el logo vivo: primero se "reproduce" la animación y, al bajar, crece
(function () {
  const pista = document.getElementById('asistente');
  const ventana = document.getElementById('ventana');
  const lienzo = document.getElementById('lienzo');
  const ctx = lienzo.getContext('2d');
  const logoCentro = document.getElementById('logoCentro');
  const logoImg = document.getElementById('logoImg');
  const frase = document.getElementById('frase');
  const fraseResto = document.getElementById('fraseResto');
  const entre = (a, b, p) => a + (b - a) * p;      // valor intermedio entre a y b
  const tramo = (x, desde, hasta) => Math.min(1, Math.max(0, (x - desde) / (hasta - desde)));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---------- 1) LA ANIMACIÓN: unos y ceros en doble hélice que forman la X ----------
  const N = innerWidth < 620 ? 380 : 700;
  let W, H, S, cx, cy, puntos = [], bits = [], logoListo = false;

  // Dibuja la X en un lienzo invisible y apunta los píxeles pintados: ahí irá cada bit
  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    lienzo.width = W * dpr; lienzo.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const rv = ventana.getBoundingClientRect(), ri = logoImg.getBoundingClientRect();
    S = ri.width;
    cx = W / 2 + (ri.left + ri.width / 2) - (rv.left + rv.width / 2);   // centro del logo
    cy = H / 2 + (ri.top + ri.height / 2) - (rv.top + rv.height / 2);
    const k = S / 100, oculto = document.createElement('canvas');
    oculto.width = oculto.height = Math.ceil(S);
    const o = oculto.getContext('2d');
    o.lineCap = 'round'; o.lineWidth = 15 * k;
    o.beginPath(); o.moveTo(20 * k, 20 * k); o.lineTo(80 * k, 80 * k);
    o.moveTo(20 * k, 80 * k); o.lineTo(58 * k, 42 * k); o.stroke();
    o.fillRect(68 * k, 12 * k, 20 * k, 20 * k);
    const L = oculto.width;
    if (L < 1) { puntos = [[cx, cy]]; return; }          // si el logo no se ve, no rompe nada
    const datos = o.getImageData(0, 0, L, L).data;
    const paso = Math.max(3, Math.round(S / 38));
    puntos = [];
    for (let y = 0; y < L; y += paso)
      for (let x = 0; x < L; x += paso)
        if (datos[(y * L + x) * 4 + 3] > 128) puntos.push([cx - S / 2 + x, cy - S / 2 + y]);
  }
  const alAzar = () => puntos[Math.floor(Math.random() * puntos.length)];
  medir();
  for (let i = 0; i < N; i++) bits.push({
    u: Math.random(), hebra: i % 2, txt: Math.random() < .5 ? '0' : '1',
    retraso: Math.random() * .6, destino: alAzar()
  });

  const suave = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const cian = [34, 227, 255], morado = [180, 76, 255];
  const color = f => { f = Math.min(1, Math.max(0, f));
    return `rgb(${cian.map((v, i) => Math.round(v + (morado[i] - v) * f)).join(',')})`; };

  let inicio = null;
  function dibujar(ahora) {
    const t = (ahora - inicio) / 1000;                 // segundos desde que empezó
    ctx.clearRect(0, 0, W, H);
    const ancho = Math.min(W, 900) * .85, alto = Math.min(H, 506) * .26;
    for (const b of bits) {
      const ang = b.u * Math.PI * 4 + t * 1.4 + b.hebra * Math.PI;   // giro de la hélice
      const hx = W / 2 + (b.u - .5) * ancho;
      const hy = H / 2 + Math.sin(ang) * alto;
      const z = (Math.cos(ang) + 1) / 2;                              // 0 lejos, 1 cerca
      const k = suave(tramo(t, 2 + b.retraso, 3.3 + b.retraso));      // vuelo hacia la X
      const x = hx + (b.destino[0] - hx) * k, y = hy + (b.destino[1] - hy) * k;
      let alfa = (.25 + z * .75) * (1 - k) + .95 * k;
      if (t > 4) alfa *= 1 - tramo(t, 4, 5.2);                        // se apagan
      ctx.globalAlpha = alfa;
      ctx.fillStyle = color(((b.u)) * (1 - k) + ((b.destino[0] + b.destino[1] - cx - cy + S) / (2 * S)) * k);
      ctx.font = `${((9 + z * 6) * (1 - k) + 8 * k).toFixed(1)}px ui-monospace, monospace`;
      ctx.fillText(b.txt, x, y);
    }
    if (t > 3.7 && !logoListo) {                        // aparece el logo de verdad
      logoListo = true; mover();
      setTimeout(() => logoCentro.style.transition = 'none', 1200);
    }
    if (t < 5.4) requestAnimationFrame(dibujar); else ctx.clearRect(0, 0, W, H);
  }
  // Empieza cuando el recuadro se ve en pantalla (como un vídeo con reproducción automática)
  new IntersectionObserver((es, obs) => es.forEach(e => {
    if (e.isIntersecting) { obs.disconnect(); requestAnimationFrame(a => { inicio = a; dibujar(a); }); }
  }), {threshold: .5}).observe(ventana);

  // ---------- 2) EL CRECIMIENTO AL BAJAR (la fórmula del vídeo de ayer) ----------
  function mover() {
    const r = pista.getBoundingClientRect();
    const avance = tramo(-r.top, 0, pista.offsetHeight - innerHeight);   // 0 a 1
    const p = tramo(avance, .05, .55);                                    // crecer
    const w0 = Math.min(900, innerWidth * .9), h0 = Math.min(506, innerWidth * .506);
    ventana.style.width = entre(w0, innerWidth, p) + 'px';
    ventana.style.height = entre(h0, innerHeight, p) + 'px';
    ventana.style.borderRadius = entre(28, 0, p) + 'px';
    const quedarse = 1 - tramo(avance, .5, .6);                          // el logo se va
    logoCentro.style.opacity = logoListo ? quedarse : 0;
    lienzo.style.opacity = quedarse;
    frase.style.opacity = tramo(avance, .6, .72);                         // llega la frase
    fraseResto.style.opacity = tramo(avance, .72, .84);                  // y luego el texto y las cifras
    fraseResto.style.transform = `translateY(${entre(30, 0, tramo(avance, .72, .84))}px)`;
    frase.style.transform = `translate(-50%,-50%) scale(${entre(.92, 1, tramo(avance, .6, .72))})`;
  }
  addEventListener('scroll', () => requestAnimationFrame(mover), {passive: true});
  addEventListener('resize', () => { medir(); bits.forEach(b => b.destino = alAzar()); mover(); });
  mover();
})();

// Banco de bits en la sección de seguridad (como un banco de peces: 3 reglas sencillas)
(function () {
  const sec = document.getElementById('seguridad');
  const lienzo = document.createElement('canvas');
  lienzo.className = 'banco';
  sec.prepend(lienzo);
  const ctx = lienzo.getContext('2d');
  let W, H;
  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = sec.clientWidth; H = sec.clientHeight;
    lienzo.width = W * dpr; lienzo.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  medir();
  addEventListener('resize', medir);

  const movil = innerWidth < 620;
  const MAXIMO = movil ? 90 : 220;
  const peces = [];
  function nuevo(x, y, ang, disparo = 0) {
    const a = ang ?? Math.random() * Math.PI * 2, v = disparo ? 5 + Math.random() * 3 : 1.2 + Math.random();
    peces.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: Math.random(), tam: 12 + Math.random() * 7, impulso: disparo, rojo: !!disparo });
    if (peces.length > MAXIMO) peces.shift();          // si hay demasiados, se va el más viejo
  }
  for (let i = 0; i < (movil ? 50 : 120); i++) nuevo(Math.random() * W, Math.random() * H);

  // El ratón: los peces lo esquivan, como si lo vigilaran
  const raton = { x: -1e4, y: -1e4 };
  const posicion = e => { const r = sec.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  sec.addEventListener('mousemove', e => { [raton.x, raton.y] = posicion(e); });
  sec.addEventListener('mouseleave', () => { raton.x = raton.y = -1e4; });

  // Al pinchar: aparece la X de Ciberix y nace un grupo nuevo que sale disparado
  const destellos = [];
  sec.addEventListener('click', e => {
    if (e.target.closest('a,button')) return;
    const [x, y] = posicion(e);
    if (!matchMedia('(hover: hover)').matches) {        // móvil: no hay cursor, enseño la mira un momento
      const m = document.createElement('div'); m.className = 'mira';
      m.style.left = x + 'px'; m.style.top = y + 'px';
      sec.appendChild(m); m.addEventListener('animationend', () => m.remove());
      setTimeout(() => m.remove(), 800);
    }
    // ¿Has pinchado encima de una X? Entonces la cazas: se vuelve roja y sale huyendo
    let cazada = null, mejor = 22 * 22;
    for (const p of peces) {
      const d2 = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (!p.rojo && d2 < mejor) { mejor = d2; cazada = p; }
    }
    if (cazada) {
      const a = Math.random() * Math.PI * 2;
      cazada.rojo = true; cazada.impulso = 1;
      cazada.vx = Math.cos(a) * 7; cazada.vy = Math.sin(a) * 7;
    } else {
      nuevo(x, y, undefined, 1);                          // si no, nace una roja y sale disparada
    }
  });

  // El mini icono de Ciberix se dibuja una vez en un lienzo aparte y luego se "estampa" en cada pez
  function hacerIcono(color1, color2, colorBit) {
    const lienzoIcono = document.createElement('canvas');
    lienzoIcono.width = lienzoIcono.height = 64;
    const c = lienzoIcono.getContext('2d'), k = .64;
    const g = c.createLinearGradient(0, 0, 64, 64);
    g.addColorStop(0, color1); g.addColorStop(1, color2);
    c.strokeStyle = g; c.lineCap = 'round'; c.lineWidth = 15 * k;
    c.beginPath(); c.moveTo(20 * k, 20 * k); c.lineTo(80 * k, 80 * k);   // trazo largo de la X
    c.moveTo(20 * k, 80 * k); c.lineTo(58 * k, 42 * k); c.stroke();       // trazo cortado
    c.fillStyle = colorBit; c.fillRect(68 * k, 12 * k, 20 * k, 20 * k);  // el bit de la esquina
    return lienzoIcono;
  }
  const icono = hacerIcono('#22e3ff', '#b44cff', '#22e3ff');          // los del banco
  const iconoRojo = hacerIcono('#ff6b7d', '#ff1f3d', '#ff9aa6');      // los que nacen al pinchar
  const cian = [34, 227, 255], morado = [180, 76, 255];
  const color = f => `rgb(${cian.map((v, i) => Math.round(v + (morado[i] - v) * f)).join(',')})`;

  function dibujarX(x, y, tam, alfa) {               // el símbolo de Ciberix (X + el bit)
    const k = tam / 100;
    ctx.save(); ctx.translate(x - tam / 2, y - tam / 2); ctx.globalAlpha = alfa;
    const g = ctx.createLinearGradient(0, 0, tam, tam);
    g.addColorStop(0, '#22e3ff'); g.addColorStop(1, '#b44cff');
    ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = 15 * k;
    ctx.beginPath(); ctx.moveTo(20 * k, 20 * k); ctx.lineTo(80 * k, 80 * k);
    ctx.moveTo(20 * k, 80 * k); ctx.lineTo(58 * k, 42 * k); ctx.stroke();
    ctx.fillStyle = '#22e3ff'; ctx.fillRect(68 * k, 12 * k, 20 * k, 20 * k);
    ctx.restore();
  }

  function paso() {
    // Encima del texto no puede haber estela (lo taparía de negro): se borra cada vez
    ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);

    for (const p of peces) {
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
      for (const o of peces) {
        if (o === p) continue;
        const dx = o.x - p.x, dy = o.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 3600) {                               // vecinos a menos de 60 px
          n++; ax += o.vx; ay += o.vy; cx += o.x; cy += o.y;
          if (d2 < 484) { sx -= dx; sy -= dy; }        // regla 1: no chocar
        }
      }
      if (n) {
        p.vx += (ax / n - p.vx) * .05; p.vy += (ay / n - p.vy) * .05;        // regla 2: misma dirección
        p.vx += (cx / n - p.x) * .004; p.vy += (cy / n - p.y) * .004;        // regla 3: no quedarse solo
      }
      p.vx += sx * .05; p.vy += sy * .05;
      const rx = p.x - raton.x, ry = p.y - raton.y, rd = Math.hypot(rx, ry);
      if (rd < 120) { p.vx += rx / rd * .6; p.vy += ry / rd * .6; }          // esquivar el ratón
      const v = Math.hypot(p.vx, p.vy), lim = Math.min(3 + p.impulso * 6, Math.max(1.2, v));
      p.impulso *= .96;                                    // los disparados van frenando poco a poco
      p.vx = p.vx / v * lim; p.vy = p.vy / v * lim;
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;             // salen por un lado
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;             // y entran por el otro

      // Dibujo: el mini icono, girado para que el bit de la esquina vaya delante, como la cabeza del pez
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 4);
      ctx.globalAlpha = .9;
      const t = p.tam * (1 + p.impulso * .7);              // el recién nacido sale algo más grande y encoge
      ctx.drawImage(p.rojo ? iconoRojo : icono, -t / 2, -t / 2, t, t);   // el tuyo, en rojo
      ctx.restore();
    }
    for (let i = destellos.length - 1; i >= 0; i--) {
      const d = destellos[i];
      dibujarX(d.x, d.y, 70 + (1 - d.vida) * 40, d.vida);
      d.vida -= .02;
      if (d.vida <= 0) destellos.splice(i, 1);
    }
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { paso(); return; }
  // Solo se mueve cuando la sección se ve (no gasta batería si estás en otra parte)
  let visible = false;
  new IntersectionObserver(es => es.forEach(e => {
    const antes = visible; visible = e.isIntersecting;
    if (visible && !antes) requestAnimationFrame(bucle);
  })).observe(sec);
  function bucle() { if (!visible) return; paso(); requestAnimationFrame(bucle); }
})();

// Aparecer suave al bajar
const obs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('ya'); obs.unobserve(e.target); }
}), {threshold: .15});
document.querySelectorAll('.aparece').forEach(el => obs.observe(el));

// Formulario → Zoho Forms (servidores en la UE). Se envía por detrás: el cliente no sale de la web.
// Nombres internos de Zoho: SingleLine=negocio, Dropdown=interés, SingleLine1=nombre, SingleLine2=teléfono, DecisionBox=acepto
(function () {
  const ZOHO = 'https://forms.zohopublic.eu/sergiocib1/form/DemoCiberix/formperma/YqlYOTMx99mU0NARBgCeSbyR6YlPFA3cVsJuLzxpPsw/htmlRecords/submit';
  const f = document.getElementById('formulario'), estado = document.getElementById('formEstado');
  const boton = f.querySelector('button[type="submit"]');
  const esParticular = () => f.tipo && f.tipo.value === 'particular';
  f.querySelectorAll('input[name="tipo"]').forEach(r => r.addEventListener('change', () => {
    f.negocio.hidden = esParticular(); f.negocio.required = !esParticular();
  }));
  const gracias = () => {
    f.innerHTML = '<p class="gracias" role="status">✅ <b>¡Recibido!</b><br>Te llamamos en menos de 24 horas para preparar tu demo.</p>';
  };
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (f.web.value) { gracias(); return; }                 // robot: hacemos como que sí, pero no se envía nada
    const datos = new FormData();
    datos.append('zf_referrer_name', 'web ciberix.es');
    datos.append('zf_redirect_url', '');
    datos.append('zc_gad', '');
    datos.append('SingleLine', esParticular() ? 'Particular' : f.negocio.value.trim());
    datos.append('Dropdown', f.interes.value);
    datos.append('SingleLine1', f.nombre.value.trim());
    datos.append('SingleLine2', f.telefono.value.trim());
    datos.append('DecisionBox', 'on');
    boton.disabled = true; boton.textContent = 'Enviando…';
    try {
      // Zoho no deja leer su respuesta desde otra web (no-cors): si la red no falla, damos el envío por bueno
      await fetch(ZOHO, { method: 'POST', body: datos, mode: 'no-cors' });
      gracias();
    } catch (e) {
      boton.disabled = false; boton.textContent = 'Pedir mi demo';
      estado.innerHTML = '⚠️ No se ha podido enviar (¿sin conexión?). Prueba otra vez o escríbenos a <a href="mailto:hola@ciberix.es">hola@ciberix.es</a>';
    }
  });
})();

// 📝 Botones "Pedir demo": abren el formulario en una ventana encima, sin saltar al final de la web.
// Es el MISMO formulario (se mueve dentro de la ventana y vuelve a su sitio al cerrar), así el envío a Zoho no cambia.
(function () {
  const ventana = document.getElementById('ventanaDemo');
  if (!ventana || typeof ventana.showModal !== 'function') return;   // navegador muy viejo: salta al final como antes
  const form = document.getElementById('formulario'), hueco = document.getElementById('vdHueco');
  const sitio = document.createComment('aquí vive el formulario');
  form.parentNode.insertBefore(sitio, form);
  document.addEventListener('click', e => {
    const enlace = e.target.closest('a[href="#demo"]');
    if (!enlace || ventana.open) return;
    e.preventDefault();
    hueco.appendChild(form);
    const interes = enlace.dataset.interes;
    if (interes && form.interes && !form.interes.value) form.interes.value = interes;
    document.documentElement.classList.add('vd-abierta');
    ventana.showModal();
    const primero = form.querySelector('input:not(.trampa):not([type=radio]):not([hidden])');
    if (primero && matchMedia('(min-width: 621px)').matches) primero.focus();
  });
  document.getElementById('vdCerrar').addEventListener('click', () => ventana.close());
  ventana.addEventListener('click', e => { if (e.target === ventana) ventana.close(); });   // tocar fuera = cerrar
  ventana.addEventListener('close', () => {
    sitio.parentNode.insertBefore(form, sitio.nextSibling);
    document.documentElement.classList.remove('vd-abierta');
  });
})();

// 🌙 Modo día / noche: sigue al aparato salvo que el usuario elija con el botón (se recuerda)
(function () {
  const raiz = document.documentElement, boton = document.getElementById('botonTema');
  const oscuroSistema = matchMedia('(prefers-color-scheme: dark)');
  const esNoche = () => raiz.dataset.tema ? raiz.dataset.tema === 'noche' : oscuroSistema.matches;
  function pintar() {
    const noche = esNoche();
    raiz.classList.toggle('es-noche', noche);
    boton.setAttribute('aria-label', noche ? 'Cambiar a modo día' : 'Cambiar a modo noche');
    boton.title = noche ? 'Modo día' : 'Modo noche';
    texto.textContent = noche ? '☀️  Modo día' : '🌙  Modo noche';
  }
  const texto = document.getElementById('temaTexto');
  function cambiar() {
    raiz.dataset.tema = esNoche() ? 'dia' : 'noche';
    try { localStorage.setItem('tema', raiz.dataset.tema); } catch (e) { /* sin memoria, no pasa nada */ }
    pintar();
  }
  boton.addEventListener('click', cambiar);
  texto.addEventListener('click', cambiar);
  oscuroSistema.addEventListener('change', pintar);   // si el móvil cambia solo a oscuro por la noche
  pintar();
})();

// ☰ Menú del móvil: abre/cierra el panel con las secciones
(function () {
  const cabecera = document.querySelector('.menu'), boton = document.getElementById('hamburguesa');
  const panel = document.getElementById('enlacesMenu');
  function poner(abierto) {
    cabecera.classList.toggle('menu-abierto', abierto);
    boton.setAttribute('aria-expanded', abierto);
    boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  }
  boton.addEventListener('click', () => poner(!cabecera.classList.contains('menu-abierto')));
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => poner(false)));      // al elegir sección
  document.addEventListener('click', e => { if (!cabecera.contains(e.target)) poner(false); });   // al tocar fuera
  document.addEventListener('keydown', e => { if (e.key === 'Escape') poner(false); });
})();

// 🎮 Secreto: código Konami → modo retro 30 segundos
(function () {
  const CODIGO = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  const DURACION = 30;
  let pos = 0, quedan = 0, reloj = null, cartel = null;

  function avanzar(tecla) {
    if (tecla === CODIGO[pos]) pos++;
    else if (tecla === 'arrowup') pos = (pos >= 1 && CODIGO[pos - 1] === 'arrowup') ? 2 : 1; // ↑↑↑ sigue valiendo
    else pos = 0;
    if (pos === CODIGO.length) { pos = 0; activar(); }
  }

  // Ordenador: teclado (no cuenta si estás escribiendo en el formulario)
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && quedan) { salir(); return; }
    if (ev.target instanceof Element && ev.target.closest('input, textarea, select')) return;
    avanzar(ev.key.toLowerCase());
  });

  // Móvil: deslizar ↑↑↓↓←→←→ y luego dos toques (B y A)
  let x0 = 0, y0 = 0;
  document.addEventListener('touchstart', ev => { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, {passive: true});
  document.addEventListener('touchend', ev => {
    const dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) { avanzar(pos >= 8 ? CODIGO[pos] : 'toque'); return; }
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    // El dedo hacia arriba = flecha arriba
    avanzar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'arrowright' : 'arrowleft') : (dy < 0 ? 'arrowup' : 'arrowdown'));
  }, {passive: true});

  // Musiquilla de 8 bits hecha con código (sin descargar nada)
  function musiquilla() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.09;
        o.type = 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.09);
      });
      setTimeout(() => ac.close(), 1000);
    } catch (e) { /* sin sonido, no pasa nada */ }
  }

  function pintar() {
    cartel.querySelector('.cuenta').textContent = String(quedan).padStart(2, '0');
  }

  function activar() {
    quedan = DURACION;
    if (!cartel) {
      cartel = document.createElement('div');
      cartel.id = 'retroCartel';
      cartel.setAttribute('role', 'status');
      cartel.innerHTML = '<span><span class="parpadeo">▶</span> Modo retro <span class="largo">desbloqueado</span> · <span class="cuenta"></span></span>' +
                         '<button type="button">Salir [Esc]</button>';
      cartel.querySelector('button').addEventListener('click', salir);
      document.body.appendChild(cartel);
      document.documentElement.classList.add('retro');
      musiquilla();
    }
    pintar();
    clearInterval(reloj);
    reloj = setInterval(() => { quedan--; if (quedan <= 0) salir(); else pintar(); }, 1000);
  }

  function salir() {
    clearInterval(reloj); quedan = 0;
    document.documentElement.classList.remove('retro');
    if (cartel) { cartel.remove(); cartel = null; }
  }
})();

// 🕹️ Recreativa de Seguridad: el título se escribe letra a letra y el marcador sube.
// Sin JavaScript se ve ya escrito (el texto está en el HTML).
(function () {
  const caja = document.getElementById('arcade');
  const texto = document.getElementById('arcadeTexto');
  const puntos = document.getElementById('arcadePuntos');
  if (!caja || !texto || !puntos) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { puntos.textContent = '999999'; return; }
  const partes = [['TU NEGOCIO,', ''], ['\n', ''], ['PROTEGIDO.', 'px']];
  texto.textContent = '';
  function teclear() {
    let p = 0, l = 0, destino = texto, total = 0;
    const paso = setInterval(() => {
      const [trozo, clase] = partes[p];
      if (trozo === '\n') { texto.append(document.createElement('br')); p++; return; }
      if (l === 0) {
        destino = texto;
        if (clase) { destino = document.createElement('span'); destino.className = clase; texto.append(destino); }
      }
      destino.append(trozo[l]); l++; total += 50;
      puntos.textContent = String(total * 47).padStart(6, '0').slice(-6);
      if (l === trozo.length) { p++; l = 0; }
      if (p === partes.length) { clearInterval(paso); puntos.textContent = '999999'; }
    }, 90);
  }
  new IntersectionObserver((e, o) => {
    if (e[0].isIntersecting) { teclear(); o.disconnect(); }
  }, { threshold: .5 }).observe(caja);
})();
