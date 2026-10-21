// Email signup on blog posts. Posts to the same waitlist endpoint as the landing page.
(function () {
  var forms = document.querySelectorAll('.signup');
  Array.prototype.forEach.call(forms, function (form) {
    var input = form.querySelector('input[name="email"]');
    var button = form.querySelector('button[type="submit"]');
    var fields = form.querySelector('.signup__fields');
    var note = form.querySelector('.signup__note');
    var idle = button.textContent;

    function say(text, kind) {
      note.textContent = text;
      note.className = 'signup__note' + (kind ? ' signup__note--' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (button.disabled) return;
      var email = input.value.trim();
      if (!email || !input.checkValidity()) {
        say('Enter a valid email address, like you@business.com.', 'error');
        input.focus();
        return;
      }
      button.disabled = true;
      button.textContent = 'Joining...';
      var body = { email: email };
      var source = form.getAttribute('data-source');
      if (source) body.source = source;
      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (r) { return r.json().then(function (j) { return r.ok && j.ok ? 'ok' : r.status >= 500 ? 'server' : 'invalid'; }); })
        .catch(function () { return 'server'; })
        .then(function (result) {
          if (result === 'ok') {
            fields.hidden = true;
            say("You're on the list. We'll be in touch soon.", 'done');
          } else {
            button.disabled = false;
            button.textContent = idle;
            say(result === 'server'
              ? 'Signup is unavailable right now. Please try again later or email info@rewritelabs.io.'
              : 'Check your email address and try again.', 'error');
            input.focus();
          }
        });
    });
  });
})();
