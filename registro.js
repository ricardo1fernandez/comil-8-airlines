// Extiende el formulario de Check-in original: al generar el pase, guarda al visitante en la BD
// y muestra un ticket imprimible. No cambia el diseño ni el flujo original.
(() => {
  const CFG = window.COMIL8_CONFIG || {};
  if (CFG.SUPABASE_URL) CFG.SUPABASE_URL = CFG.SUPABASE_URL.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  // Las claves nuevas de Supabase (sb_publishable_...) no son JWT: solo van en el header "apikey".
  if (/^sb_/.test(CFG.SUPABASE_ANON_KEY || '') && CFG.SUPABASE_URL) {
    const base = CFG.SUPABASE_URL.replace(/\/$/, ''), realFetch = window.fetch.bind(window);
    window.fetch = (url, opts = {}) => {
      if (typeof url === 'string' && url.startsWith(base) && opts.headers) {
        const h = {...opts.headers}; delete h.Authorization; opts = {...opts, headers: h};
      }
      return realFetch(url, opts);
    };
  }
  const GATES = {
    'Australia': 'GATE 1', 'United Kingdom': 'GATE 2', 'United States': 'GATE 3',
    'Japan': 'GATE 4', 'China': 'GATE 4', 'South Korea': 'GATE 4'
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let passenger = null; // visitante registrado en esta sesión

  function ticketNo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let r = '';
    for (const n of crypto.getRandomValues(new Uint8Array(5))) r += chars[n % chars.length];
    return 'C8-' + r;
  }
  const today = () => new Date().toLocaleDateString('es-BO', {day: '2-digit', month: 'short', year: 'numeric'}).toUpperCase();

  function ticketHTML(p) {
    return `<div class="ticket">
      <div class="main">
        <div class="top"><span>COMIL 8 AIRLINES</span><small>BOARDING PASS</small></div>
        <span class="lbl">PASAJERO / PASSENGER</span><span class="val big">${esc(p.nombre)}</span>
        <div class="grid">
          <div><span class="lbl">DESTINO / TO</span><span class="val">${esc(p.destino)}</span></div>
          <div><span class="lbl">PUERTA / GATE</span><span class="val">${esc(p.puerta)}</span></div>
          <div><span class="lbl">ASIENTO / SEAT</span><span class="val">${esc(p.asiento)}</span></div>
          <div><span class="lbl">FECHA / DATE</span><span class="val">${esc(p.fecha)}</span></div>
        </div>
        <span class="lbl">ENGLISH OPEN HOUSE · COLEGIO MILITAR N.° 8</span>
      </div>
      <div class="stub"><span class="lbl">TICKET</span><span class="no">${esc(p.ticket)}</span><div class="bars"></div><span class="lbl">${esc(p.destino)}</span></div>
    </div>`;
  }

  async function saveToDB(p) {
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) return {ok: false, reason: 'base de datos sin configurar'};
    try {
      const res = await fetch(CFG.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + (CFG.TABLE || 'pasajeros'), {
        method: 'POST',
        headers: {
          'apikey': CFG.SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ticket: p.ticket, nombre: p.nombre, destino: p.destino, puerta: p.puerta, asiento: p.asiento})
      });
      return res.ok ? {ok: true} : {ok: false, reason: 'error ' + res.status};
    } catch { return {ok: false, reason: 'sin conexión'}; }
  }

  const printArea = document.createElement('div');
  printArea.id = 'print-area';
  document.body.append(printArea);
  function printTicket(p) {
    printArea.innerHTML = ticketHTML(p);
    window.print();
  }

  function showTicket(p, note) {
    const pass = document.querySelector('#pass');
    if (!pass) return;
    pass.hidden = false;
    pass.style.border = '0'; pass.style.padding = '0';
    pass.innerHTML = ticketHTML(p) + (note ? `<p class="reg-note">⚠ ${esc(note)}</p>` : '') +
      '<div class="actions"><button type="button" class="primary" id="print-ticket">🖨 Imprimir mi ticket</button></div>';
    pass.querySelector('#print-ticket').onclick = () => printTicket(p);
  }

  const origRender = window.render;
  window.render = function (index) {
    origRender(index);
    if (index !== 0) return;
    const form = document.querySelector('#checkin');
    if (!form) return;
    // Si ya se registró y no cambió los datos, volver a mostrar su ticket
    if (passenger && passenger.nombre === traveler.name && passenger.destino === traveler.country) showTicket(passenger, passenger.nota);
    const origSubmit = form.onsubmit;
    form.onsubmit = async event => {
      origSubmit(event);                       // validación y comportamiento original
      if (!traveler.name) return;
      if (passenger && passenger.nombre === traveler.name && passenger.destino === traveler.country) { showTicket(passenger, passenger.nota); return; }
      const p = {
        nombre: traveler.name,
        destino: traveler.country || 'Por definir',
        puerta: GATES[traveler.country] || 'GATE 1',
        asiento: (1 + Math.floor(Math.random() * 30)) + String.fromCharCode(65 + Math.floor(Math.random() * 6)),
        ticket: ticketNo(), fecha: today()
      };
      showTicket(p);
      const r = await saveToDB(p);
      p.nota = r.ok ? '' : 'No se pudo guardar el registro (' + r.reason + ').';
      passenger = p;
      showTicket(p, p.nota);
    };
  };
  render(current); // re-render del Check-in con el comportamiento extendido

  // ---------- Enlaces de sala: guardados en la BD para que todos los visitantes los vean ----------
  const api = path => CFG.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path;
  const headers = {'apikey': CFG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json'};
  const hasDB = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);

  async function loadRooms() {
    if (!hasDB) return;
    try {
      const res = await fetch(api('salas?select=clave,url'), {headers});
      if (!res.ok) return;
      const saved = {};
      for (const row of await res.json()) saved[row.clave] = row.url;
      // los enlaces del #hash (si existen) tienen prioridad sobre los de la BD
      roomLinks = Object.assign(saved, roomLinks);
      for (const key of roomKeys) if (typeof roomLinks[key] === 'string') roomForm.elements.namedItem(key).value = roomLinks[key];
      render(current);
    } catch {}
  }

  const share = document.querySelector('#share'), status = document.querySelector('#copyStatus');
  const origRooms = roomForm.onsubmit;
  roomForm.onsubmit = async event => {
    share.hidden = true;
    origRooms(event);
    if (share.hidden) return;                    // no pasó la validación
    if (!hasDB) { status.textContent = 'Enlace generado (sin base de datos: solo funciona compartiendo este enlace).'; return; }
    try {
      const del = await fetch(api('salas?clave=neq.__ninguna__'), {method: 'DELETE', headers});
      const rows = Object.entries(roomLinks).map(([clave, url]) => ({clave, url}));
      const ins = rows.length ? await fetch(api('salas'), {method: 'POST', headers, body: JSON.stringify(rows)}) : {ok: true};
      status.textContent = del.ok && ins.ok ? '✔ Salas guardadas: todos los visitantes las verán.' : 'No se pudo guardar en la base de datos (error ' + (del.ok ? ins.status : del.status) + ').';
    } catch { status.textContent = 'Sin conexión: no se guardó en la base de datos.'; }
  };
  loadRooms();

  // ---------- Música compartida: la docente la sube y suena para todos los visitantes ----------
  (() => {
    const player = document.querySelector('#music-audio'), label = document.querySelector('#music-track');
    const remove = document.querySelector('#music-remove'), fileInput = document.querySelector('#music-file');
    const box = document.createElement('div');
    box.className = 'actions';
    box.innerHTML = '<button type="button" id="music-share" hidden>☁ Guardar para todos los visitantes</button><button type="button" id="music-unshare" hidden>Quitar música de todos</button>';
    const msg = document.createElement('p'); msg.id = 'music-msg'; msg.setAttribute('role', 'status'); msg.className = 'status';
    document.querySelector('#music-dialog .actions').before(msg, box);
    const shareBtn = box.querySelector('#music-share'), unshareBtn = box.querySelector('#music-unshare');
    const publicUrl = () => CFG.SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/public/musica/pista?v=' + Date.now();
    let sharedLoaded = false, userRemoved = false;

    function playOnFirstTouch() {
      addEventListener('pointerdown', () => { if (!userRemoved && player.paused && player.src) player.play().catch(() => {}); }, {once: true});
    }
    async function loadShared() {
      if (!hasDB) return;
      try {
        const res = await fetch(api('ajustes?clave=eq.musica_nombre&select=valor'), {headers});
        const rows = res.ok ? await res.json() : [];
        if (!rows.length) return;
        sharedLoaded = true;
        player.src = publicUrl(); player.hidden = false; remove.hidden = false; unshareBtn.hidden = false;
        label.textContent = rows[0].valor + ' (música del evento)';
        playOnFirstTouch();
      } catch {}
    }
    fileInput.addEventListener('change', () => { userRemoved = false; shareBtn.hidden = !(hasDB && fileInput.files[0]); msg.textContent = ''; });
    remove.addEventListener('click', () => { userRemoved = true; shareBtn.hidden = true; });
    shareBtn.onclick = async () => {
      const track = fileInput.files[0];
      if (!track) return;
      if (track.size > 50 * 1024 * 1024) { msg.textContent = 'El archivo supera 50 MB. Usa uno más liviano.'; return; }
      shareBtn.disabled = true; msg.textContent = 'Subiendo…';
      try {
        const up = await fetch(CFG.SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/musica/pista', {
          method: 'POST',
          headers: {'apikey': CFG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY, 'Content-Type': track.type || 'audio/mpeg', 'x-upsert': 'true'},
          body: track
        });
        if (!up.ok) throw new Error('subida ' + up.status);
        const nm = await fetch(api('ajustes'), {method: 'POST', headers: {...headers, 'Prefer': 'resolution=merge-duplicates'}, body: JSON.stringify({clave: 'musica_nombre', valor: track.name})});
        if (!nm.ok) throw new Error('registro ' + nm.status);
        unshareBtn.hidden = false; shareBtn.hidden = true;
        msg.textContent = '✔ Música guardada: todos los visitantes la tendrán.';
      } catch (e) { msg.textContent = 'No se pudo guardar (' + e.message + ').'; }
      shareBtn.disabled = false;
    };
    unshareBtn.onclick = async () => {
      try {
        await fetch(CFG.SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/musica/pista', {method: 'DELETE', headers: {'apikey': CFG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY}});
        await fetch(api('ajustes?clave=eq.musica_nombre'), {method: 'DELETE', headers});
        unshareBtn.hidden = true; msg.textContent = 'Música quitada para todos.';
        if (sharedLoaded) remove.click();
      } catch { msg.textContent = 'No se pudo quitar.'; }
    };
    loadShared();
  })();
})();
