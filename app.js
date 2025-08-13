// App bootstrap shared across pages: register service worker and request notifications
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function (err) {
        // eslint-disable-next-line no-console
        console.warn('Service worker registration failed:', err);
      });
    });
  }

  window.requestSorNotificationPermission = async function () {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  // Shared header/nav injection
  function getCurrentUserEmail() {
    try { return localStorage.getItem('sor_current_user') || ''; } catch (e) { return ''; }
  }

  function headerHTML(active) {
    const user = getCurrentUserEmail();
    return `
    <header class="app-header">
      <div class="app-brand"><a href="index.html">Shades of Red</a></div>
      <button class="app-nav-toggle" aria-label="Toggle menu" onclick="document.querySelector('.app-nav').classList.toggle('show')">☰</button>
      <nav class="app-nav">
        <a href="index.html" ${active==='home'?'class="active"':''}>Home</a>
        <a href="sor.html" ${active==='tracker'?'class="active"':''}>Tracker</a>
        <a href="try2.html" ${active==='auth'?'class="active"':''}>Login</a>
      </nav>
      <div class="app-user">
        ${user ? `<span>${user}</span><button class="btn" onclick="localStorage.removeItem('sor_current_user'); location.href='try2.html';">Logout</button>` : ''}
      </div>
    </header>`;
  }

  function footerHTML() {
    return `<footer class="app-footer">© ${new Date().getFullYear()} Shades of Red</footer>`;
  }

  function injectShell(active) {
    const shell = document.createElement('div');
    shell.innerHTML = headerHTML(active);
    document.body.prepend(shell.firstElementChild);
    const footerWrap = document.createElement('div');
    footerWrap.innerHTML = footerHTML();
    document.body.appendChild(footerWrap.firstElementChild);
  }

  window.SORShell = { injectShell };
})();

