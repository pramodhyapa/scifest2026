/* SciFest 2026: small interactive "try it" widgets (no heavy computation).
   <div class="lab" data-sim="balloon">  liquid nitrogen: cool a balloon
   <div class="lab" data-sim="ferro">    ferrofluid: magnet strength → spikes
   Colours come from the page's CSS variables, so dark mode and station
   accents work automatically. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = function () { return document.documentElement.getAttribute('data-show') === 'en' ? 'en' : 'sv'; };

  function setupCanvas(cv, w, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = w * dpr; cv.height = h * dpr;
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }
  function css(el, name) { return getComputedStyle(el).getPropertyValue(name).trim(); }
  function say(el, sv, en) { el.textContent = lang() === 'en' ? en : sv; }

  /* ---------------------------------------------------------- balloon */
  function balloon(root) {
    var cv = root.querySelector('canvas'), slider = root.querySelector('input[type=range]');
    var outT = root.querySelector('[data-out=T]'),
        outS = root.querySelector('[data-out=S]'), status = root.querySelector('[data-out=status]');
    var W = 600, H = 340, ctx = setupCanvas(cv, W, H);
    var cx = 300, cy = 160, R0 = 118, N = 40, O2 = 8;   // about 1 in 5 air molecules is oxygen
    var P = [];
    for (var i = 0; i < N; i++) {
      var a = Math.random() * 2 * Math.PI, r = Math.sqrt(Math.random()) * 0.85, d = Math.random() * 2 * Math.PI;
      P.push({ x: r * Math.cos(a), y: r * Math.sin(a), vx: Math.cos(d), vy: Math.sin(d), ox: i < O2, idx: i,
               lx: ((i % 10) - 4.5) * 0.12, ly: 0.8 - Math.floor(i / 10) * 0.1 });
    }
    var last = performance.now();
    function frame(now) {
      var T = +slider.value, dt = Math.min(0.05, (now - last) / 1000); last = now;
      // gas fraction: oxygen condenses below 90 K, then nitrogen as we approach 77 K
      var gas = T > 90 ? 1 : 0.8 * Math.max(0.06, (T - 77) / 13);
      var R = R0 * Math.cbrt(Math.max(T * gas / 293, 0.0015)), speed = 0.9 * Math.sqrt(T / 293), liquid = T <= 90;
      var nliq = Math.round((1 - gas) * N);
      var ink = css(cv, '--ink'), acc = css(cv, '--accent'), soft = css(cv, '--accent-soft'), muted = css(cv, '--muted');
      ctx.clearRect(0, 0, W, H);
      // room-temperature size for comparison
      ctx.setLineDash([5, 5]); ctx.strokeStyle = muted; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R0, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      // balloon
      ctx.fillStyle = soft; ctx.strokeStyle = acc; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 8, cy + R + 9); ctx.lineTo(cx + 8, cy + R + 9); ctx.lineTo(cx, cy + R - 1); ctx.closePath();
      ctx.fillStyle = acc; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy + R + 9);
      ctx.bezierCurveTo(cx - 14, cy + R + 40, cx + 14, cy + R + 70, cx, H - 8); ctx.stroke();
      // molecules
      P.forEach(function (p) {
        if (liquid && (p.ox || p.idx < nliq)) {    // oxygen, then nitrogen, settles as liquid
          p.x += (p.lx - p.x) * 0.12; p.y += (p.ly - p.y) * 0.12;
        } else if (!reduce) {
          p.x += p.vx * speed * dt; p.y += p.vy * speed * dt;
          var r = Math.hypot(p.x, p.y);
          if (r > 0.86) {                           // bounce off the inside of the balloon
            var nx = p.x / r, ny = p.y / r, dot = p.vx * nx + p.vy * ny;
            p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; p.x = nx * 0.86; p.y = ny * 0.86;
          }
        }
        var px = cx + p.x * R, py = cy + p.y * R;
        ctx.fillStyle = p.ox ? acc : ink;
        ctx.beginPath(); ctx.arc(px - 2.6, py, 2.8, 0, 2 * Math.PI); ctx.arc(px + 2.6, py, 2.8, 0, 2 * Math.PI); ctx.fill();
      });
      outT.textContent = T + ' K (' + (T - 273) + ' °C)';
      outS.textContent = Math.round(100 * Math.sqrt(T / 293)) + ' %';
      if (T <= 77) say(status, 'Så kallt är flytande kväve. Nu blir även kvävet flytande – ballongen är nästan platt!', 'As cold as liquid nitrogen. Now even the nitrogen turns liquid – the balloon is almost flat!');
      else if (liquid) say(status, 'Under −183 °C blir syret flytande: se dropparna!', 'Below −183 °C the oxygen turns liquid: see the droplets!');
      else if (T < 293) say(status, 'Kallare luft: molekylerna går långsammare och tar mindre plats.', 'Colder air: the molecules slow down and take up less space.');
      else say(status, 'Rumstemperatur. Dra reglaget åt vänster för att kyla ballongen.', 'Room temperature. Drag the slider left to cool the balloon.');
      if (!reduce) requestAnimationFrame(frame);
    }
    if (reduce) slider.addEventListener('input', function () { frame(performance.now()); });
    document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.addEventListener('click', function () { frame(performance.now()); }); });
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ ferro */
  function ferro(root) {
    var cv = root.querySelector('canvas'), slider = root.querySelector('input[type=range]'),
        music = root.querySelector('[data-music]'), outB = root.querySelector('[data-out=B]'),
        status = root.querySelector('[data-out=status]');
    var W = 600, H = 300, ctx = setupCanvas(cv, W, H);
    var TH = 40, playing = false, t0 = performance.now();
    var x0 = 70, x1 = 530, top = 150, bottom = 220, peaks = [];
    for (var x = 102; x < x1 - 20; x += 54) peaks.push(x);
    function strength(now) {
      if (!playing) return +slider.value;
      var t = (now - t0) / 1000, beat = Math.pow(Math.max(0, Math.cos(2 * Math.PI * t / 0.48)), 6);
      return Math.round(30 + 62 * beat + 6 * Math.sin(t * 1.7));
    }
    function frame(now) {
      var s = strength(now), t = now / 1000;
      if (playing) slider.value = s;
      var A = s < TH ? 0 : 92 * Math.sqrt((s - TH) / (100 - TH));
      var ink = css(cv, '--ink'), acc = css(cv, '--accent'), soft = css(cv, '--accent-soft'), muted = css(cv, '--muted'), paper = css(cv, '--paper-solid');
      ctx.clearRect(0, 0, W, H);
      // electromagnet under the dish, glowing with strength
      ctx.globalAlpha = 0.15 + 0.85 * s / 100; ctx.fillStyle = soft; ctx.fillRect(x0 + 60, bottom + 18, x1 - x0 - 120, 50); ctx.globalAlpha = 1;
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + 60, bottom + 18, x1 - x0 - 120, 50);
      ctx.strokeStyle = acc; ctx.lineWidth = 2;
      for (var k = x0 + 75; k < x1 - 70; k += 12) { ctx.beginPath(); ctx.moveTo(k, bottom + 22); ctx.lineTo(k + 6, bottom + 64); ctx.stroke(); }
      // the fluid surface
      ctx.beginPath(); ctx.moveTo(x0, bottom);
      for (var xx = x0; xx <= x1; xx += 2) {
        var h = 0;
        peaks.forEach(function (px, i) {
          var u = 1 - Math.abs(xx - px) / 25;
          if (u > 0) h = Math.max(h, Math.pow(u, 1.5) * A * (1 + (reduce ? 0 : 0.05 * Math.sin(t * 7 + i))));
        });
        ctx.lineTo(xx, top - h);
      }
      ctx.lineTo(x1, bottom); ctx.closePath();
      ctx.fillStyle = '#121418'; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
      // dish
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x0 - 4, top - 60); ctx.lineTo(x0 - 4, bottom + 4); ctx.lineTo(x1 + 4, bottom + 4); ctx.lineTo(x1 + 4, top - 60); ctx.stroke();
      outB.textContent = s + ' %';
      if (s < TH) say(status, 'För svag magnet: ytan förblir platt.', 'Magnet too weak: the surface stays flat.');
      else say(status, 'Tillräckligt stark: taggarna dyker upp!', 'Strong enough: the spikes pop up!');
      if (playing || !reduce) requestAnimationFrame(frame);
    }
    music.addEventListener('click', function () {
      playing = !playing; t0 = performance.now(); slider.disabled = playing;
      music.setAttribute('aria-pressed', String(playing));
      if (reduce) requestAnimationFrame(frame);
    });
    slider.addEventListener('input', function () { if (reduce) frame(performance.now()); });
    document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.addEventListener('click', function () { frame(performance.now()); }); });
    requestAnimationFrame(frame);
  }

  document.querySelectorAll('.lab[data-sim]').forEach(function (el) {
    ({ balloon: balloon, ferro: ferro })[el.getAttribute('data-sim')](el);
  });
})();
