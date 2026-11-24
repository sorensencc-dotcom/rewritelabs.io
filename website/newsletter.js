// Newsletter signup on the blog and AI News Feed. Posts to /api/subscribe, never to the product waitlist.
(function () {
  var forms = document.querySelectorAll('.newsletter');
  Array.prototype.forEach.call(forms, function (form) {
    var input = form.querySelector('input[name="email"]');
    var button = form.querySelector('button[type="submit"]');
    var fields = form.querySelector('.newsletter__fields');
    var note = form.querySelector('.newsletter__note');
    var idle = button.textContent;

    function say(text, kind) {
      note.textContent = text;
      note.className = 'newsletter__note' + (kind ? ' newsletter__note--' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (button.disabled) return;
      var tracks = Array.prototype.map.call(form.querySelectorAll('input[name="track"]:checked'), function (c) { return c.value; });
      if (!tracks.length) {
        say('Pick at least one: Operator Notes or Field Notes.', 'error');
        return;
      }
      var email = input.value.trim();
      if (!email || !input.checkValidity()) {
        say('Enter a valid email address, like you@business.com.', 'error');
        input.focus();
        return;
      }
      button.disabled = true;
      button.textContent = 'Subscribing...';
      var trap = form.querySelector('input[name="website"]');
      var body = { email: email, tracks: tracks, website: trap ? trap.value : '' };
      var source = form.getAttribute('data-source');
      if (source) body.source = source;
      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (r) { return r.json().then(function (j) { return r.ok && j.ok ? 'ok' : r.status === 429 ? 'limited' : r.status >= 500 ? 'server' : 'invalid'; }); })
        .catch(function () { return 'server'; })
        .then(function (result) {
          if (result === 'ok') {
            fields.hidden = true;
            say('Check your inbox to confirm your subscription.', 'done');
          } else {
            button.disabled = false;
            button.textContent = idle;
            say(
              result === 'limited'
                ? 'Too many attempts from this connection. Please try again later.'
                : result === 'server'
                  ? 'Signup is unavailable right now. The RSS feed works in the meantime.'
                  : 'Check your email address and try again.',
              'error',
            );
            input.focus();
          }
        });
    });
  });
})();
