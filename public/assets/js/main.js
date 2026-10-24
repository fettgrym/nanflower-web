/* Nanflower Thaimassage — interactions */
(function () {
  'use strict';

  var doc = document;
  var header = doc.getElementById('site-header');
  var hero = doc.querySelector('.hero');
  var mobileCta = doc.querySelector('.mobile-cta');
  var menuToggle = doc.querySelector('.menu-toggle');
  var mobileMenu = doc.getElementById('mobile-menu');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- current year ---------- */
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- opening hours (Europe/Stockholm) ---------- */
  // 0 = Sunday … 6 = Saturday. Minutes from midnight.
  var HOURS = {
    0: null,
    1: [600, 1140],
    2: [600, 1140],
    3: [600, 1140],
    4: [600, 1140],
    5: [600, 1140],
    6: [600, 1080]
  };
  var DAY_NAMES = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
  var DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function stockholmTime() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Stockholm',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var day = DAY_INDEX[map.weekday];
      var hour = parseInt(map.hour, 10) % 24;
      var minute = parseInt(map.minute, 10);
      if (day === undefined || isNaN(hour) || isNaN(minute)) return null;
      return { day: day, minutes: hour * 60 + minute };
    } catch (e) {
      return null;
    }
  }

  function hm(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return (m === 0 ? h + ':00' : h + ':' + (m < 10 ? '0' + m : m));
  }

  function nextOpening(fromDay) {
    for (var i = 1; i <= 7; i++) {
      var d = (fromDay + i) % 7;
      if (HOURS[d]) return { day: d, start: HOURS[d][0] };
    }
    return null;
  }

  function renderStatus() {
    var el = doc.getElementById('status');
    var textEl = doc.getElementById('status-text');
    if (!el || !textEl) return;

    var t = stockholmTime();
    if (!t) { textEl.textContent = 'Mån–fre 10–19 · Lör 10–18'; return; }

    var today = HOURS[t.day];
    var isOpen = false;
    var label = '';

    if (today && t.minutes >= today[0] && t.minutes < today[1]) {
      isOpen = true;
      label = 'Öppet nu · stänger ' + hm(today[1]);
    } else if (today && t.minutes < today[0]) {
      label = 'Stängt · öppnar ' + hm(today[0]) + ' idag';
    } else {
      var next = nextOpening(t.day);
      label = next ? 'Stängt · öppnar ' + DAY_NAMES[next.day] + ' ' + hm(next.start) : 'Stängt';
    }

    el.classList.toggle('is-open', isOpen);
    el.classList.toggle('is-closed', !isOpen);
    textEl.textContent = label;
  }

  function markToday() {
    var t = stockholmTime();
    if (!t) return;
    var rows = doc.querySelectorAll('.hours-table tr[data-day]');
    Array.prototype.forEach.call(rows, function (row) {
      row.classList.toggle('today', Number(row.getAttribute('data-day')) === t.day);
    });
  }

  renderStatus();
  markToday();
  window.setInterval(function () { renderStatus(); markToday(); }, 60000);

  /* ---------- scroll state ---------- */
  var lastScrolled = false;
  function onScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    var scrolled = y > 12;
    if (scrolled !== lastScrolled) {
      header.classList.toggle('is-scrolled', scrolled);
      lastScrolled = scrolled;
    }
    if (mobileCta) {
      var threshold = (hero ? hero.offsetHeight : 600) * 0.72;
      mobileCta.classList.toggle('is-visible', y > threshold);
    }
    setActiveNav();
  }

  /* ---------- active nav link ---------- */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav a'));
  var navSections = navLinks.map(function (a) {
    var id = a.getAttribute('href');
    return { link: a, el: id && id.length > 1 ? doc.querySelector(id) : null };
  }).filter(function (item) { return item.el; });

  function setActiveNav() {
    if (!navSections.length) return;
    var marker = window.innerHeight * 0.34;
    var best = null;
    var bestTop = -Infinity;
    navSections.forEach(function (item) {
      var top = item.el.getBoundingClientRect().top;
      if (top - marker <= 0 && top > bestTop) { bestTop = top; best = item.link; }
    });
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a === best); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var menuOpen = false;

  function openMenu() {
    if (!mobileMenu) return;
    menuOpen = true;
    mobileMenu.hidden = false;
    doc.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Stäng meny');
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { mobileMenu.classList.add('is-open'); });
    });
  }

  function closeMenu() {
    if (!mobileMenu || !menuOpen) return;
    menuOpen = false;
    mobileMenu.classList.remove('is-open');
    doc.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Öppna meny');
    window.setTimeout(function () {
      if (!menuOpen) mobileMenu.hidden = true;
    }, 380);
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      if (menuOpen) closeMenu(); else openMenu();
    });
  }

  if (mobileMenu) {
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) {
      closeMenu();
      if (menuToggle) menuToggle.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && menuOpen) closeMenu();
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(doc.querySelectorAll('[data-reveal]'));

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- smooth anchor scroll with header offset ---------- */
  doc.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (!id || id === '#' || id.length < 2) return;
    var target = doc.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var offset = header ? header.offsetHeight : 0;
    var top = target.getBoundingClientRect().top + window.pageYOffset - offset + 1;
    closeMenu();
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  });
})();
