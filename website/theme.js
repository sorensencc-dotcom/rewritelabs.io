// Light/dark toggle. The page head sets data-theme from localStorage before first paint; this handles clicks.
(function () {
  var KEY = 'rl-theme';
  var root = document.documentElement;
  function effective() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function label() {
    var next = effective() === 'light' ? 'dark' : 'light';
    var buttons = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.theme-toggle');
    if (!b) return;
    var next = effective() === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (_) {}
    label();
  });
  label();
})();
