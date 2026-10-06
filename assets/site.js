/* SciFest 2026 demo pages: language switch, quiz, video.
   The language is chosen before the page paints by the small inline
   script at the top of each page; this file wires up the controls. */
(function () {
  var root = document.documentElement;
  var page = document.querySelector('.page');
  var KEY = 'scifest-lang';

  function setLang(lang, remember) {
    root.setAttribute('data-show', lang);
    root.lang = lang;
    if (page) {
      var t = page.getAttribute(lang === 'sv' ? 'data-title-sv' : 'data-title-en');
      if (t) document.title = t;
    }
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });
    if (remember) { try { localStorage.setItem(KEY, lang); } catch (e) {} }
  }

  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang'), true); });
  });
  setLang(root.getAttribute('data-show') === 'en' ? 'en' : 'sv', false);

  /* Quiz: tap an answer; right answers stay green, wrong ones ask to try again. */
  document.querySelectorAll('.q').forEach(function (q) {
    var fb = q.querySelector('.feedback');
    q.querySelectorAll('.options button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var right = btn.hasAttribute('data-correct');
        btn.classList.add(right ? 'is-right' : 'is-wrong');
        fb.className = 'feedback ' + (right ? 'good' : 'bad');
        var src = q.querySelector(right ? '.fb-right' : '.fb-wrong');
        fb.innerHTML = src ? src.innerHTML : '';
        if (right) {
          q.querySelectorAll('.options button').forEach(function (o) { o.disabled = o !== btn; });
        }
      });
    });
  });

  /* Landing page: filter the photos by topic. */
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tiles > .tile'));
  document.querySelectorAll('[data-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (c) {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      tiles.forEach(function (t) {
        t.hidden = !(f === 'all' || t.getAttribute('data-station') === f);
      });
    });
  });

  /* Landing page: "Surprise me!" opens a random experiment that has a page. */
  var surprise = document.querySelector('[data-surprise]');
  if (surprise) {
    surprise.addEventListener('click', function () {
      var live = tiles.filter(function (t) { return t.tagName === 'A' && !t.hidden; });
      if (!live.length) live = tiles.filter(function (t) { return t.tagName === 'A'; });
      if (live.length) window.location.href = live[Math.floor(Math.random() * live.length)].href;
    });
  }

  /* Respect "reduce motion": stop the looping video and show its controls. */
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  if (mq && mq.matches) {
    document.querySelectorAll('video[autoplay]').forEach(function (v) {
      v.removeAttribute('autoplay'); v.pause(); v.controls = true;
    });
  }
})();
