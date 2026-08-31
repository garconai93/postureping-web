// Toast helper shared across pages
const $ = id => document.getElementById(id);
function toast(msg, duration = 3000) {
  const el = document.getElementById('toast');
  if (!el) return console.log('[toast]', msg);
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), duration);
}

window.toast = toast;

// Common nav renderer
function renderNav(active) {
  const html = `
    <nav class="nav">
      <div class="container nav-inner">
        <a href="./index.html" class="brand">
          <div class="logo">P</div>
          PosturePing
        </a>
        <div class="nav-links">
          <a href="./index.html" ${active === 'home' ? 'class="active"' : ''}>Acasă</a>
          <a href="./app.html" ${active === 'app' ? 'class="active"' : ''}>Dashboard</a>
          <a href="./index.html#features">Funcționalități</a>
        </div>
        <a href="./app.html" class="btn btn-primary">Deschide aplicația</a>
      </div>
    </nav>
    <div id="toast"></div>
  `;
  document.body.insertAdjacentHTML('afterbegin', html);
}

window.renderNav = renderNav;

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
