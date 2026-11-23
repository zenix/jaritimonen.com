/* Radar tabs: progressive enhancement. Content is fully readable without JavaScript. */
(function () {
  var d = document;
  var tabs = [].slice.call(d.querySelectorAll('.blip[role="tab"]'));
  if (!tabs.length) return;
  var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
  var cur = 0, touched = false, paused = false, visible = true, steps = 0, timer = null;

  function show(i, focus) {
    cur = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { touched = true; stop(); show(i); });
    t.addEventListener('keydown', function (e) {
      var n = null, last = tabs.length - 1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = cur === last ? 0 : cur + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = cur === 0 ? last : cur - 1;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = last;
      if (n !== null) { e.preventDefault(); touched = true; stop(); show(n, true); }
    });
  });
  show(0);

  /* One slow tour of the four areas, then stop. Never for reduced-motion users. */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var box = d.querySelector('.radar-col');
  box.addEventListener('mouseenter', function () { paused = true; });
  box.addEventListener('mouseleave', function () { paused = false; });
  box.addEventListener('focusin', function () { paused = true; });
  box.addEventListener('focusout', function () { paused = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(box);
  }
  timer = setInterval(function () {
    if (touched) { stop(); return; }
    if (paused || !visible || d.hidden) return;
    steps += 1;
    show(steps % tabs.length);
    if (steps >= tabs.length) stop();
  }, 7000);

  try { console.log('%cHello from the console.%c\njari.timonen@gmail.com', 'font:700 14px monospace;color:#4DFF9A', 'font:12px monospace;color:#8FB8A2'); } catch (e) {}
})();
