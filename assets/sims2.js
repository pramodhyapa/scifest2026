/* SciFest 2026: "try it" widgets for the remaining demo pages.
   Each is a small canvas drawing that reacts instantly; no heavy computation.
     gallium   dip a gallium tube in warm water; live temperature graph
     compass   drag a magnet over a grid of compass needles
     film      magnetic viewing film: bar magnet, fridge magnet, treasure hunt
     atoms     pick up and place atoms with an STM tip
     crystal   rotate rock salt / diamond-type crystal models
     polar     turn polarising filters
     mill      light mill: brightness and spin direction
     coop      steer a figure through a maze with a hidden magnet
   Colours come from the page's CSS variables (dark mode and station accents). */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function en() { return document.documentElement.getAttribute('data-show') === 'en'; }
  function say(el, sv, eng) { if (el) el.textContent = en() ? eng : sv; }
  function css(el, n) { return getComputedStyle(el).getPropertyValue(n).trim(); }
  function setup(cv, w, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = w * dpr; cv.height = h * dpr;
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return c;
  }
  function pos(cv, ev, W, H) {
    var r = cv.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height };
  }
  function colors(cv) {
    return { ink: css(cv, '--ink'), acc: css(cv, '--accent'), soft: css(cv, '--accent-soft'),
             muted: css(cv, '--muted'), paper: css(cv, '--paper-solid'), grid: css(cv, '--grid-strong'), good: css(cv, '--good') };
  }
  function onLang(fn) { document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.addEventListener('click', fn); }); }
  function loop(fn) { function f(t) { if (fn(t) !== false) requestAnimationFrame(f); } requestAnimationFrame(f); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function wrap(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  function drag(cv, W, H, down, move, up) {
    var active = false;
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', function (e) { active = true; cv.setPointerCapture(e.pointerId); down(pos(cv, e, W, H)); });
    cv.addEventListener('pointermove', function (e) { if (active && move) move(pos(cv, e, W, H)); });
    ['pointerup', 'pointercancel'].forEach(function (n) { cv.addEventListener(n, function () { active = false; if (up) up(); }); });
  }

  /* ---------------------------------------------------------- gallium */
  function gallium(root) {
    var cv = root.querySelector('canvas'), btn = root.querySelector('[data-dip]'),
        outT = root.querySelector('[data-out=T]'), st = root.querySelector('[data-out=status]');
    var W = 600, H = 320, c = setup(cv, W, H);
    var TM = 29.8, TR = 21, TW = 45, L = 22, K = 0.32;
    var h = 0, dipped = false, lift = 0, hist = [], acc = 0, last = performance.now();
    function temp(hh) { var a = TM - TR; return hh < a ? TR + hh : (hh < a + L ? TM : TR + hh - L); }
    function frac(hh) { return Math.min(1, Math.max(0, (hh - (TM - TR)) / L)); }
    btn.addEventListener('click', function () { dipped = !dipped; btn.setAttribute('aria-pressed', String(dipped)); });
    loop(function (now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var T = temp(h); h += K * ((dipped ? TW : TR) - T) * dt; h = Math.max(0, h); T = temp(h);
      var f = frac(h); lift += ((dipped ? 1 : 0) - lift) * Math.min(1, dt * 5);
      acc += dt; if (acc > 0.1) { acc = 0; hist.push(T); if (hist.length > 200) hist.shift(); }
      var k = colors(cv); c.clearRect(0, 0, W, H);
      // cup of warm water
      c.fillStyle = k.soft; c.strokeStyle = k.ink; c.lineWidth = 2;
      c.beginPath(); c.moveTo(60, 170); c.lineTo(72, 300); c.lineTo(188, 300); c.lineTo(200, 170); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = k.muted; c.lineWidth = 1.5;
      for (var s = 0; s < 3; s++) { var sx = 95 + s * 32, ph = now / 600 + s;
        c.beginPath(); c.moveTo(sx, 160); c.bezierCurveTo(sx - 8, 145 + 3 * Math.sin(ph), sx + 8, 130, sx, 115); c.stroke(); }
      c.fillStyle = k.muted; c.font = '12px "IBM Plex Mono", monospace'; c.fillText('45 °C', 108, 290);
      // tube
      var ty = 30 + 120 * lift, tx = 112;
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.strokeStyle = k.ink; c.lineWidth = 2;
      c.beginPath(); c.roundRect ? c.roundRect(tx, ty, 36, 120, [4, 4, 14, 14]) : c.rect(tx, ty, 36, 120); c.fill(); c.stroke();
      c.fillStyle = k.ink; c.fillRect(tx - 3, ty - 12, 42, 14);
      // metal: solid shards fade out, liquid pool fades in
      var my = ty + 66;
      c.globalAlpha = 1 - f; c.fillStyle = '#9AA3AD'; c.strokeStyle = '#5E666F'; c.lineWidth = 1;
      [[tx + 4, my + 4, tx + 18, my - 6, tx + 30, my + 8], [tx + 6, my + 20, tx + 20, my + 6, tx + 32, my + 28],
       [tx + 4, my + 46, tx + 14, my + 26, tx + 30, my + 44]].forEach(function (p) {
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]); c.lineTo(p[4], p[5]); c.lineTo(p[0] + 4, p[5] + 6); c.closePath(); c.fill(); c.stroke(); });
      c.globalAlpha = f; var g = c.createLinearGradient(tx, 0, tx + 36, 0);
      g.addColorStop(0, '#7C858F'); g.addColorStop(0.45, '#F2F5F8'); g.addColorStop(1, '#8A939C');
      c.fillStyle = g; c.beginPath(); c.moveTo(tx + 2, my + 12); c.quadraticCurveTo(tx + 18, my + 6, tx + 34, my + 12);
      c.lineTo(tx + 34, my + 50); c.quadraticCurveTo(tx + 18, my + 56, tx + 2, my + 50); c.closePath(); c.fill(); c.globalAlpha = 1;
      // graph
      var gx = 260, gy = 30, gw = 320, gh = 240, y = function (t) { return gy + gh - (t - 15) / 35 * gh; };
      c.strokeStyle = k.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx, gy + gh); c.lineTo(gx + gw, gy + gh); c.stroke();
      c.fillStyle = k.muted; c.font = '11px "IBM Plex Mono", monospace';
      [20, 30, 40, 50].forEach(function (t) { c.fillText(t + '°', gx - 28, y(t) + 4); });
      c.setLineDash([5, 4]); c.strokeStyle = k.acc; c.beginPath(); c.moveTo(gx, y(TM)); c.lineTo(gx + gw, y(TM)); c.stroke(); c.setLineDash([]);
      c.fillStyle = k.acc; c.fillText(en() ? 'melts at 29.8 °C' : 'smälter vid 29,8 °C', gx + 6, y(TM) - 6);
      c.fillStyle = k.muted; c.fillText(en() ? 'time →' : 'tid →', gx + gw - 52, gy + gh + 16);
      c.strokeStyle = k.ink; c.lineWidth = 2.5; c.beginPath();
      hist.forEach(function (t, i) { var x = gx + gw - (hist.length - 1 - i) * gw / 200; i ? c.lineTo(x, y(t)) : c.moveTo(x, y(t)); }); c.stroke();
      outT.textContent = T.toFixed(1).replace('.', en() ? '.' : ',') + ' °C';
      if (f <= 0) say(st, dipped ? 'Metallen värms upp…' : 'Fast metall. Tryck på knappen för att doppa röret i varmt vatten.',
                          dipped ? 'The metal is warming up…' : 'Solid metal. Press the button to dip the tube in warm water.');
      else if (f < 1) say(st, 'Den smälter! Se hur temperaturen står still medan den smälter.', 'It’s melting! See how the temperature stays put while it melts.');
      else say(st, 'Flytande metall! Ta upp röret så stelnar den igen.', 'Liquid metal! Take the tube out and it turns solid again.');
    });
  }

  /* ---------------------------------------------------------- compass */
  function compass(root) {
    var cv = root.querySelector('canvas'), shake = root.querySelector('[data-shake]'), turn = root.querySelector('[data-turn]');
    var W = 600, H = 380, c = setup(cv, W, H);
    var C = 10, R = 6, STEP = 56, x0 = (W - (C - 1) * STEP) / 2, y0 = (H - (R - 1) * STEP) / 2;
    var N = [], noise = 0, mx = 470, my = 190, mang = 0, ML = 120;
    for (var j = 0; j < R; j++) for (var i = 0; i < C; i++) N.push({ x: x0 + i * STEP, y: y0 + j * STEP, a: -Math.PI / 2 });
    function field(x, y) {
      var ux = Math.cos(mang), uy = Math.sin(mang), bx = 0, by = -0.0006;
      [1, -1].forEach(function (s) { var px = mx + s * ux * ML / 2, py = my + s * uy * ML / 2, rx = x - px, ry = y - py,
        r2 = rx * rx + ry * ry + 300, r = Math.sqrt(r2); bx += s * rx / (r2 * r) * 40; by += s * ry / (r2 * r) * 40; });
      return Math.atan2(by, bx);
    }
    drag(cv, W, H, function (p) { mx = p.x; my = p.y; }, function (p) { mx = p.x; my = p.y; });
    shake.addEventListener('click', function () { noise = 2.2; });
    turn.addEventListener('click', function () { mang += Math.PI / 2; });
    loop(function () {
      var k = colors(cv); c.clearRect(0, 0, W, H);
      N.forEach(function (n) {
        n.a += 0.2 * wrap(field(n.x, n.y) - n.a) + (Math.random() - 0.5) * noise;
        var ux = Math.cos(n.a), uy = Math.sin(n.a), vx = -uy, vy = ux, L = 21, w = 6;
        c.lineWidth = 1; c.strokeStyle = k.ink;
        c.fillStyle = '#C4302B'; c.beginPath(); c.moveTo(n.x + ux * L, n.y + uy * L); c.lineTo(n.x + vx * w, n.y + vy * w); c.lineTo(n.x - vx * w, n.y - vy * w); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#E2E5EB'; c.beginPath(); c.moveTo(n.x - ux * L, n.y - uy * L); c.lineTo(n.x + vx * w, n.y + vy * w); c.lineTo(n.x - vx * w, n.y - vy * w); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = k.ink; c.beginPath(); c.arc(n.x, n.y, 2.2, 0, 7); c.fill();
      });
      noise *= 0.95;
      // magnet
      c.save(); c.translate(mx, my); c.rotate(mang);
      c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(-ML / 2 + 4, -15 + 5, ML, 30);
      c.fillStyle = '#C4302B'; c.fillRect(0, -15, ML / 2, 30); c.fillStyle = '#5C6E96'; c.fillRect(-ML / 2, -15, ML / 2, 30);
      c.strokeStyle = k.ink; c.lineWidth = 2; c.strokeRect(-ML / 2, -15, ML, 30);
      c.fillStyle = '#fff'; c.font = 'bold 15px "Familjen Grotesk", sans-serif'; c.fillText('N', ML / 4 - 5, 6); c.fillText('S', -ML / 4 - 5, 6);
      c.restore();
    });
  }

  /* ------------------------------------------------------------- film */
  function film(root) {
    var cv = root.querySelector('canvas'), st = root.querySelector('[data-out=status]');
    var W = 600, H = 360, c = setup(cv, W, H), CELL = 5, mode = 'bar', mx = 300, my = 180, lx = 300, ly = 180;
    var DARK = [12, 52, 40], MID = [46, 139, 106], BRIGHT = [170, 245, 205], B0 = 2e-5;
    var R2 = rng(11), hidden = [], found = [];
    function hide() { hidden = []; found = [];
      while (hidden.length < 4) { var p = { x: 90 + R2() * 420, y: 80 + R2() * 220, s: R2() < 0.5 ? 1 : -1 };
        if (hidden.every(function (q) { return Math.hypot(q.x - p.x, q.y - p.y) > 110; })) { hidden.push(p); found.push(false); } } }
    hide();
    function sources() {
      var q = [];
      if (mode === 'bar') { q.push([mx + 55, my, -12, 1], [mx - 55, my, -12, -1]); }
      else if (mode === 'fridge') { for (var yy = -48; yy <= 48; yy += 12) for (var xx = -80; xx <= 80; xx += 8)
        q.push([mx + xx, my + yy, -6, (Math.round((yy + 48) / 12) % 2 ? 1 : -1) * 0.08]); }
      return q;
    }
    function shade(x, y, q) {
      var bx = 0, by = 0, bz = 0;
      if (mode === 'hunt') { hidden.forEach(function (m) { var rx = x - m.x, ry = y - m.y, rz = 22, r2 = rx * rx + ry * ry + rz * rz,
        r = Math.sqrt(r2), r3 = r2 * r, dot = m.s * rz / r; bx += 3 * dot * rx / r / r3; by += 3 * dot * ry / r / r3; bz += (3 * dot * rz / r - m.s) / r3; }); }
      else q.forEach(function (s) { var rx = x - s[0], ry = y - s[1], rz = -s[2], r2 = rx * rx + ry * ry + rz * rz, r3 = r2 * Math.sqrt(r2);
        bx += s[3] * rx / r3; by += s[3] * ry / r3; bz += s[3] * rz / r3; });
      var bp = bx * bx + by * by, bzz = bz * bz, I = 0.5 + 0.5 * (bp - bzz) / (bp + bzz + B0 * B0);
      var a = I < 0.5 ? DARK : MID, b = I < 0.5 ? MID : BRIGHT, u = I < 0.5 ? I / 0.5 : (I - 0.5) / 0.5;
      return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * u) + ',' + Math.round(a[1] + (b[1] - a[1]) * u) + ',' + Math.round(a[2] + (b[2] - a[2]) * u) + ')';
    }
    function drawMap(k) {
      c.fillStyle = '#BFD7E8'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#E8D7A5'; c.strokeStyle = '#8A6A2E'; c.lineWidth = 3; c.beginPath();
      [[60, 180], [90, 80], [200, 45], [360, 40], [500, 70], [560, 170], [545, 290], [430, 330], [250, 335], [110, 305]].forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
      c.closePath(); c.fill(); c.stroke();
      c.setLineDash([9, 8]); c.strokeStyle = '#8A5A2B'; c.lineWidth = 3; c.beginPath(); c.moveTo(120, 290);
      c.bezierCurveTo(200, 230, 260, 260, 320, 190); c.bezierCurveTo(370, 140, 430, 170, 470, 110); c.stroke(); c.setLineDash([]);
      c.fillStyle = k.ink; c.font = '600 13px "IBM Plex Mono", monospace';
      c.fillText(en() ? 'Search area' : 'Sökområde', 22, 26);
    }
    function draw() {
      var k = colors(cv); c.clearRect(0, 0, W, H);
      if (mode === 'hunt') {
        drawMap(k);
        hidden.forEach(function (m, i) { if (Math.hypot(lx - m.x, ly - m.y) < 26) found[i] = true; });
        c.save(); c.beginPath(); c.arc(lx, ly, 72, 0, 7); c.clip();
        for (var y = ly - 75; y < ly + 75; y += CELL) for (var x = lx - 75; x < lx + 75; x += CELL) { c.fillStyle = shade(x, y); c.fillRect(x, y, CELL, CELL); }
        c.restore();
        c.strokeStyle = k.ink; c.lineWidth = 7; c.beginPath(); c.arc(lx, ly, 72, 0, 7); c.stroke();
        c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx + 55, ly + 55); c.lineTo(lx + 100, ly + 100); c.stroke(); c.lineCap = 'butt';
        hidden.forEach(function (m, i) { if (!found[i]) return; c.strokeStyle = '#B5332A'; c.lineWidth = 4;
          c.beginPath(); c.moveTo(m.x - 9, m.y - 9); c.lineTo(m.x + 9, m.y + 9); c.moveTo(m.x + 9, m.y - 9); c.lineTo(m.x - 9, m.y + 9); c.stroke(); });
        var n = found.filter(Boolean).length;
        if (n === 4) say(st, 'Du hittade alla fyra skatterna! Tryck på ”Skattjakt” för att gömma dem igen.', 'You found all four treasures! Press “Treasure hunt” to hide them again.');
        else say(st, 'Dra förstoringsglaset över kartan. Hittade: ' + n + ' av 4', 'Drag the magnifying glass over the map. Found: ' + n + ' of 4');
      } else {
        var q = sources();
        for (var y2 = 0; y2 < H; y2 += CELL) for (var x2 = 0; x2 < W; x2 += CELL) { c.fillStyle = shade(x2 + 2, y2 + 2, q); c.fillRect(x2, y2, CELL, CELL); }
        c.setLineDash([6, 5]); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5;
        if (mode === 'bar') c.strokeRect(mx - 70, my - 16, 140, 32); else c.strokeRect(mx - 84, my - 52, 168, 104);
        c.setLineDash([]);
        say(st, mode === 'bar' ? 'Stavmagnet under filmen: två poler, mörka där fältet går rakt igenom. Dra magneten!' : 'Kylskåpsmagnet: många smala ränder med N och S om vartannat. Dra magneten!',
                mode === 'bar' ? 'Bar magnet under the film: two poles, dark where the field goes straight through. Drag the magnet!' : 'Fridge magnet: many thin stripes of N and S. Drag the magnet!');
      }
    }
    var dirty = true;
    function req() { dirty = true; }
    drag(cv, W, H, function (p) { if (mode === 'hunt') { lx = p.x; ly = p.y; } else { mx = p.x; my = p.y; } req(); },
                   function (p) { if (mode === 'hunt') { lx = p.x; ly = p.y; } else { mx = p.x; my = p.y; } req(); });
    root.querySelectorAll('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode'); if (mode === 'hunt') { hide(); lx = 300; ly = 180; }
        root.querySelectorAll('[data-mode]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); req();
      });
    });
    if (location.hash === '#treasure') { var hb = root.querySelector('[data-mode=hunt]'); if (hb) hb.click(); }
    onLang(req);
    loop(function () { if (dirty) { dirty = false; draw(); } });
  }

  /* ------------------------------------------------------------ atoms */
  function atoms(root) {
    var cv = root.querySelector('canvas'), reset = root.querySelector('[data-reset]'), st = root.querySelector('[data-out=status]');
    var W = 600, H = 360, c = setup(cv, W, H), C = 9, R = 5, STEP = 58;
    var x0 = (W - (C - 1) * STEP) / 2, y0 = 90, ad = [], held = -1, tip = { x: W / 2, y: 20 }, target = { x: W / 2, y: 20 }, done = false, R2 = rng(5);
    function site(i, j) { return { x: x0 + i * STEP, y: y0 + j * STEP }; }
    function scatter() { ad = []; held = -1; done = false;
      while (ad.length < 4) { var s = { i: Math.floor(R2() * C), j: Math.floor(R2() * R) };
        if (!ad.some(function (a) { return a.i === s.i && a.j === s.j; })) ad.push(s); }
      if (line()) scatter(); }
    function line() {
      var rows = {}, cols = {};
      ad.forEach(function (a) { (rows[a.j] = rows[a.j] || []).push(a.i); (cols[a.i] = cols[a.i] || []).push(a.j); });
      function run(arr) { if (!arr || arr.length < 4) return false; arr.sort(function (a, b) { return a - b; }); return arr[3] - arr[0] === 3; }
      return Object.keys(rows).some(function (k) { return run(rows[k]); }) || Object.keys(cols).some(function (k) { return run(cols[k]); });
    }
    scatter();
    drag(cv, W, H, function (p) {
      var bi = -1, bj = -1, bd = 30;
      for (var i = 0; i < C; i++) for (var j = 0; j < R; j++) { var s = site(i, j), d = Math.hypot(p.x - s.x, p.y - s.y); if (d < bd) { bd = d; bi = i; bj = j; } }
      if (bi < 0) return;
      var hit = -1; ad.forEach(function (a, n) { if (a.i === bi && a.j === bj) hit = n; });
      if (held < 0 && hit >= 0) held = hit;
      else if (held >= 0 && (hit < 0 || hit === held)) { ad[held] = { i: bi, j: bj }; held = -1; done = line(); }
      target = site(bi, bj);
    });
    reset.addEventListener('click', scatter);
    loop(function () {
      var k = colors(cv); c.clearRect(0, 0, W, H);
      tip.x += (target.x - tip.x) * 0.18; tip.y += (target.y - tip.y) * 0.18;
      c.fillStyle = '#4DB6E6'; c.strokeStyle = k.ink; c.lineWidth = 2; c.fillRect(x0 - 40, y0 - 40, (C - 1) * STEP + 80, (R - 1) * STEP + 80); c.strokeRect(x0 - 40, y0 - 40, (C - 1) * STEP + 80, (R - 1) * STEP + 80);
      c.strokeStyle = 'rgba(20,50,80,0.6)'; c.lineWidth = 1;
      for (var i = 0; i < C; i++) { c.beginPath(); c.moveTo(site(i, 0).x, y0); c.lineTo(site(i, 0).x, y0 + (R - 1) * STEP); c.stroke(); }
      for (var j = 0; j < R; j++) { c.beginPath(); c.moveTo(x0, site(0, j).y); c.lineTo(x0 + (C - 1) * STEP, site(0, j).y); c.stroke(); }
      for (i = 0; i < C; i++) for (j = 0; j < R; j++) { var s = site(i, j); c.fillStyle = '#F7941E'; c.beginPath(); c.arc(s.x, s.y, 12, 0, 7); c.fill(); }
      ad.forEach(function (a, n) {
        var p = n === held ? { x: tip.x, y: tip.y + 4 } : site(a.i, a.j), lift = n === held ? 12 : 0;
        c.fillStyle = 'rgba(20,60,90,0.35)'; c.beginPath(); c.ellipse(p.x + 5, p.y + 12, 13, 5, 0, 0, 7); c.fill();
        c.fillStyle = done ? '#9FE3B4' : '#F6C4D0'; c.strokeStyle = k.ink; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y - lift, 15, 0, 7); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(p.x - 5, p.y - lift - 6, 4, 0, 7); c.fill();
      });
      var ty = tip.y - 22 - (held >= 0 ? 12 : 0);
      c.strokeStyle = k.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(tip.x, 0); c.lineTo(tip.x, ty - 34); c.stroke();
      c.fillStyle = '#96AACD'; c.beginPath(); c.moveTo(tip.x - 16, ty - 36); c.lineTo(tip.x + 16, ty - 36); c.lineTo(tip.x, ty); c.closePath(); c.fill(); c.stroke();
      if (done) say(st, 'Fyra atomer på rad! Precis så bygger forskare strukturer atom för atom.', 'Four atoms in a row! That’s exactly how scientists build structures, atom by atom.');
      else if (held >= 0) say(st, 'Atomen sitter på spetsen. Tryck på en tom plats för att släppa den.', 'The atom is on the tip. Tap an empty spot to drop it.');
      else say(st, 'Tryck på en rosa atom för att plocka upp den. Mål: fyra i rad.', 'Tap a pink atom to pick it up. Goal: four in a row.');
    });
  }

  /* ---------------------------------------------------------- crystal */
  function crystal(root) {
    var cv = root.querySelector('canvas'), st = root.querySelector('[data-out=status]');
    var W = 600, H = 380, c = setup(cv, W, H), kind = 'nacl', yaw = 0.5, pitch = -0.45, dragging = false, last = null;
    function build() {
      var A = [], B = [], at = [], bonds = [], a = 180;
      if (kind === 'nacl') {
        for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) at.push([(i - 1) * a / 2, (j - 1) * a / 2, (k - 1) * a / 2, (i + j + k) % 2]);
        for (var p = 0; p < at.length; p++) for (var q = p + 1; q < at.length; q++) if (Math.abs(Math.hypot(at[p][0] - at[q][0], at[p][1] - at[q][1], at[p][2] - at[q][2]) - a / 2) < 1) bonds.push([p, q]);
      } else {
        for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++) if ((i + j + k) % 2 === 0) at.push([(i - 1) * a / 2, (j - 1) * a / 2, (k - 1) * a / 2, 0]);
        [[1, 1, 1], [1, 3, 3], [3, 1, 3], [3, 3, 1]].forEach(function (f) { at.push([(f[0] / 4 - 0.5) * a, (f[1] / 4 - 0.5) * a, (f[2] / 4 - 0.5) * a, 1]); });
        var d = Math.sqrt(3) / 4 * a;
        for (p = 0; p < at.length; p++) for (q = p + 1; q < at.length; q++) if (at[p][3] !== at[q][3] && Math.abs(Math.hypot(at[p][0] - at[q][0], at[p][1] - at[q][1], at[p][2] - at[q][2]) - d) < 1) bonds.push([p, q]);
      }
      return { at: at, bonds: bonds };
    }
    var S = build();
    root.querySelectorAll('[data-kind]').forEach(function (b) { b.addEventListener('click', function () {
      kind = b.getAttribute('data-kind'); S = build();
      root.querySelectorAll('[data-kind]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); }); });
    drag(cv, W, H, function (p) { dragging = true; last = p; }, function (p) { yaw += (p.x - last.x) * 0.01; pitch += (p.y - last.y) * 0.01; last = p; }, function () { dragging = false; });
    loop(function () {
      if (!dragging && !reduce) yaw += 0.006;
      var k = colors(cv); c.clearRect(0, 0, W, H);
      var P = S.at.map(function (v) {
        var x = v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), z = -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw);
        var y = v[1] * Math.cos(pitch) - z * Math.sin(pitch); z = v[1] * Math.sin(pitch) + z * Math.cos(pitch);
        var s = 900 / (900 + z); return [W / 2 + x * s, H / 2 + y * s, z, s, v[3]];
      });
      var items = S.bonds.map(function (b) { return ['b', (P[b[0]][2] + P[b[1]][2]) / 2 + 2, b]; }).concat(P.map(function (p, i) { return ['a', p[2], i]; }));
      items.sort(function (u, v) { return v[1] - u[1]; });
      items.forEach(function (it) {
        if (it[0] === 'b') { var p = P[it[2][0]], q = P[it[2][1]]; c.strokeStyle = '#8A8F9C'; c.lineWidth = 5 * (p[3] + q[3]) / 2; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
        else { var a = P[it[2]], r = (kind === 'nacl' ? (a[4] ? 19 : 15) : 16) * a[3];
          var col = kind === 'nacl' ? (a[4] ? '#CC342D' : '#F5F5F2') : (a[4] ? '#F28C28' : '#2B2D33');
          c.fillStyle = col; c.strokeStyle = k.ink; c.lineWidth = 1.5; c.beginPath(); c.arc(a[0], a[1], r, 0, 7); c.fill(); c.stroke();
          c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(a[0] - r * 0.35, a[1] - r * 0.35, r * 0.3, 0, 7); c.fill(); }
      });
      say(st, kind === 'nacl' ? 'Koksalt (NaCl): natrium och klor om vartannat. Varje atom har 6 grannar.' : 'Zinkblände (ZnS): varje atom sitter i en liten pyramid med 4 grannar.',
              kind === 'nacl' ? 'Table salt (NaCl): sodium and chlorine take turns. Every atom has 6 neighbours.' : 'Zinc blende (ZnS): every atom sits in a little pyramid with 4 neighbours.');
    });
  }

  /* ------------------------------------------------------------ polar */
  function polar(root) {
    var cv = root.querySelector('canvas'), s2 = root.querySelector('[data-angle=last]'), sm = root.querySelector('[data-angle=mid]'),
        mid = root.querySelector('[data-mid]'), out = root.querySelector('[data-out=I]'), st = root.querySelector('[data-out=status]');
    var W = 600, H = 260, c = setup(cv, W, H), useMid = false;
    mid.addEventListener('click', function () { useMid = !useMid; mid.setAttribute('aria-pressed', String(useMid)); sm.disabled = !useMid; draw(); });
    sm.disabled = true;
    function filt(x, ang, k) {
      c.fillStyle = 'rgba(60,64,80,0.28)'; c.strokeStyle = k.ink; c.lineWidth = 2; c.beginPath(); c.ellipse(x, 130, 26, 80, 0, 0, 7); c.fill(); c.stroke();
      c.save(); c.beginPath(); c.ellipse(x, 130, 26, 80, 0, 0, 7); c.clip(); c.strokeStyle = k.ink; c.lineWidth = 1;
      var a = ang * Math.PI / 180, ux = Math.sin(a) * 0.32, uy = -Math.cos(a);
      for (var o = -90; o <= 90; o += 12) { c.beginPath(); c.moveTo(x - ux * 100 + o * Math.cos(a) * 0.32, 130 - uy * 100 + o * Math.sin(a)); c.lineTo(x + ux * 100 + o * Math.cos(a) * 0.32, 130 + uy * 100 + o * Math.sin(a)); c.stroke(); }
      c.restore();
    }
    function draw() {
      var k = colors(cv), t2 = +s2.value, tm = +sm.value, r = Math.PI / 180;
      var I1 = 0.5, Im = useMid ? I1 * Math.pow(Math.cos((tm - 0) * r), 2) : I1, I = useMid ? Im * Math.pow(Math.cos((t2 - tm) * r), 2) : I1 * Math.pow(Math.cos(t2 * r), 2);
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#FFD84D'; c.beginPath(); c.arc(45, 130, 22, 0, 7); c.fill(); c.strokeStyle = k.ink; c.lineWidth = 2; c.stroke();
      function beam(x0, x1, a) { c.fillStyle = 'rgba(255,216,77,' + a + ')'; c.fillRect(x0, 112, x1 - x0, 36); }
      beam(67, 160, 0.9); beam(160, useMid ? 300 : 440, 0.9 * I1 * 2); if (useMid) beam(300, 440, 0.9 * Im * 2); beam(440, 520, 0.9 * I * 2);
      filt(160, 0, k); if (useMid) filt(300, tm, k); filt(440, t2, k);
      var g = Math.round(40 + 215 * Math.min(1, I * 2)); c.fillStyle = 'rgb(' + g + ',' + g + ',' + Math.round(g * 0.85) + ')';
      c.fillRect(520, 70, 50, 120); c.strokeRect(520, 70, 50, 120);
      c.fillStyle = k.muted; c.font = '11px "IBM Plex Mono", monospace'; c.fillText(en() ? 'screen' : 'skärm', 520, 208);
      out.textContent = Math.round(I * 100) + ' %';
      if (useMid && I > 0.05 && Math.abs(((t2 % 180) + 180) % 180 - 90) < 3) say(st, 'Magi! Två korsade filter är svarta – men med ett tredje filter emellan kommer ljuset tillbaka.', 'Magic! Two crossed filters are dark – but a third filter in between brings the light back.');
      else if (!useMid && I < 0.02) say(st, 'Korsade filter: nästan inget ljus kommer igenom. Lägg nu till ett filter i mitten!', 'Crossed filters: almost no light gets through. Now add a filter in the middle!');
      else say(st, 'Vrid det sista filtret och se hur ljuset ändras.', 'Turn the last filter and watch the light change.');
    }
    [s2, sm].forEach(function (s) { s.addEventListener('input', draw); }); onLang(draw); draw();
  }

  /* ------------------------------------------------------------- mill */
  function mill(root) {
    var cv = root.querySelector('canvas'), sl = root.querySelector('input[type=range]'), pr = root.querySelector('[data-pressure]'),
        st = root.querySelector('[data-out=status]');
    var W = 600, H = 320, c = setup(cv, W, H), ang = 0, last = performance.now(), press = false;
    pr.addEventListener('click', function () { press = !press; pr.setAttribute('aria-pressed', String(press)); });
    loop(function (now) {
      var dt = Math.min(0.05, (now - last) / 1000), b = +sl.value / 100; last = now;
      var w = press ? -0.002 * b : 4.5 * b;           // light pressure is ~1000x too weak, and would spin the other way
      if (!reduce) ang += w * dt;
      var k = colors(cv), cx = 380, cy = 160; c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,216,77,' + (0.15 + 0.6 * b) + ')'; c.beginPath(); c.moveTo(70, 160); c.lineTo(300, 60); c.lineTo(300, 260); c.closePath(); c.fill();
      c.fillStyle = '#FFD84D'; c.strokeStyle = k.ink; c.lineWidth = 2; c.beginPath(); c.arc(60, 160, 24, 0, 7); c.fill(); c.stroke();
      c.strokeStyle = k.ink; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, 125, 0, 7); c.stroke();
      c.fillStyle = k.ink; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill();
      for (var i = 0; i < 4; i++) {
        var a = ang + i * Math.PI / 2, ex = Math.cos(a), ey = Math.sin(a), tx = -ey, ty = ex, r0 = 30, r1 = 100;
        c.strokeStyle = k.muted; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + ex * r0, cy + ey * r0); c.stroke();
        // vane seen edge-on from above: silver face leads (+t direction), black face trails
        c.lineWidth = 7; c.strokeStyle = '#C9CED6'; c.beginPath(); c.moveTo(cx + ex * r0 + tx * 3, cy + ey * r0 + ty * 3); c.lineTo(cx + ex * r1 + tx * 3, cy + ey * r1 + ty * 3); c.stroke();
        c.strokeStyle = '#15171C'; c.beginPath(); c.moveTo(cx + ex * r0 - tx * 3, cy + ey * r0 - ty * 3); c.lineTo(cx + ex * r1 - tx * 3, cy + ey * r1 - ty * 3); c.stroke();
      }
      c.fillStyle = k.muted; c.font = '11px "IBM Plex Mono", monospace';
      c.fillText(en() ? 'seen from above' : 'sedd ovanifrån', cx - 50, 312);
      if (press) say(st, 'Om bara ljustrycket verkade skulle den snurra åt andra hållet – och tusentals gånger långsammare. Det ser vi inte!', 'If only light pressure acted, it would spin the other way – and thousands of times slower. That’s not what we see!');
      else if (b < 0.05) say(st, 'Mörkt: vingarna står still. Dra upp ljuset!', 'Dark: the vanes stand still. Turn up the light!');
      else say(st, 'De svarta sidorna blir varma och knuffas bakåt – den silvriga sidan går först.', 'The black sides warm up and get pushed back – the silver side goes first.');
    });
  }

  /* ------------------------------------------------------------- coop */
  function coop(root) {
    var cv = root.querySelector('canvas'), reset = root.querySelector('[data-reset]'), st = root.querySelector('[data-out=status]');
    var W = 600, H = 380, c = setup(cv, W, H), C = 8, R = 5, CELL = 64, ox = (W - C * CELL) / 2, oy = (H - R * CELL) / 2;
    var R2 = rng(7), walls = {}, segs = [];
    for (var i = 0; i < C; i++) for (var j = 0; j < R; j++) walls[i + ',' + j] = { N: 1, S: 1, E: 1, W: 1 };
    var D = { N: [0, -1, 'S'], S: [0, 1, 'N'], E: [1, 0, 'W'], W: [-1, 0, 'E'] }, seen = {}, stack = [[0, R - 1]]; seen['0,' + (R - 1)] = 1;
    while (stack.length) { var cur = stack[stack.length - 1], opts = [];
      Object.keys(D).forEach(function (k) { var n = [cur[0] + D[k][0], cur[1] + D[k][1]]; if (n[0] >= 0 && n[0] < C && n[1] >= 0 && n[1] < R && !seen[n]) opts.push([k, n]); });
      if (!opts.length) { stack.pop(); continue; }
      var o = opts[Math.floor(R2() * opts.length)]; walls[cur][o[0]] = 0; walls[o[1]][D[o[0]][2]] = 0; seen[o[1]] = 1; stack.push(o[1]); }
    Object.keys(walls).forEach(function (key) { var p = key.split(',').map(Number), x = ox + p[0] * CELL, y = oy + p[1] * CELL, w = walls[key];
      if (w.N) segs.push([x, y, x + CELL, y]); if (w.W) segs.push([x, y, x, y + CELL]);
      if (p[0] === C - 1 && w.E) segs.push([x + CELL, y, x + CELL, y + CELL]); if (p[1] === R - 1 && w.S) segs.push([x, y + CELL, x + CELL, y + CELL]); });
    var start = { x: ox + CELL / 2, y: oy + (R - 0.5) * CELL }, goal = { x: ox + (C - 0.5) * CELL, y: oy + CELL / 2 };
    var f = { x: start.x, y: start.y }, m = { x: start.x + 10, y: start.y + 10 }, won = false;
    function hits(x, y) { return segs.some(function (s) { var dx = s[2] - s[0], dy = s[3] - s[1], t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (y - s[1]) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(x - s[0] - t * dx, y - s[1] - t * dy) < 13; }); }
    drag(cv, W, H, function (p) { m = p; }, function (p) { m = p; });
    reset.addEventListener('click', function () { f = { x: start.x, y: start.y }; m = { x: start.x + 10, y: start.y + 10 }; won = false; });
    loop(function () {
      var k = colors(cv); c.clearRect(0, 0, W, H);
      var dx = m.x - f.x, dy = m.y - f.y, d = Math.hypot(dx, dy), sp = Math.min(3.2, d * 0.12);
      if (d > 1 && !won) { var ux = dx / d * sp, uy = dy / d * sp; if (!hits(f.x + ux, f.y)) f.x += ux; if (!hits(f.x, f.y + uy)) f.y += uy; }
      if (Math.hypot(f.x - goal.x, f.y - goal.y) < 18) won = true;
      c.strokeStyle = k.ink; c.lineWidth = 5; c.lineCap = 'round';
      segs.forEach(function (s) { c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); c.stroke(); }); c.lineCap = 'butt';
      c.strokeStyle = k.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(goal.x - 6, goal.y + 18); c.lineTo(goal.x - 6, goal.y - 18); c.stroke();
      c.fillStyle = '#C4302B'; c.beginPath(); c.moveTo(goal.x - 6, goal.y - 18); c.lineTo(goal.x + 16, goal.y - 12); c.lineTo(goal.x - 6, goal.y - 5); c.fill();
      c.setLineDash([5, 4]); c.strokeStyle = '#C4302B'; c.lineWidth = 2.5; c.strokeRect(m.x - 14, m.y - 14, 28, 28); c.setLineDash([]);
      c.fillStyle = '#fff'; c.strokeStyle = k.ink; c.lineWidth = 2;
      c.beginPath(); c.ellipse(f.x, f.y + 6, 11, 9, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.arc(f.x, f.y - 9, 8, 0, 7); c.fill(); c.stroke();
      c.fillStyle = k.ink; c.beginPath(); c.arc(f.x - 3, f.y - 10, 1.6, 0, 7); c.arc(f.x + 3, f.y - 10, 1.6, 0, 7); c.fill();
      if (won) say(st, 'Ni klarade det! Vid monterns spel ser bara en av er vägen – den andra styr magneten bakom brädan.', 'You made it! In the booth game only one of you sees the path – the other steers the magnet behind the board.');
      else say(st, 'Dra magneten (den streckade rutan). Figuren följer efter – men den fastnar i väggarna.', 'Drag the magnet (the dashed square). The figure follows – but it gets stuck on the walls.');
    });
  }

  var ALL = { gallium: gallium, compass: compass, film: film, atoms: atoms, crystal: crystal, polar: polar, mill: mill, coop: coop };
  document.querySelectorAll('.lab[data-sim]').forEach(function (el) { var f = ALL[el.getAttribute('data-sim')]; if (f) f(el); });
})();
