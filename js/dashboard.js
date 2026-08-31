renderNav('app');

const profile = Store.getProfile();
if (!profile) {
  window.location.href = './onboarding.html';
}

const stats = Store.getStats();
const heatmap = Store.buildHeatmap(90);
const today = new Date().toISOString().slice(0, 10);
const todaySessions = Store.getSessions().filter(s => s.date === today);
const todayBreakCount = todaySessions.reduce((sum, s) => sum + (s.breaks || 0), 0);

// Stats
$('userName').textContent = profile.name || 'prieten';
$('streak').textContent = stats.streak;
$('minutes').textContent = stats.totalMinutes;
$('breaks').textContent = stats.totalBreaks;
$('todayBreaks').textContent = todayBreakCount;

// Heatmap
function renderHeatmap() {
  const el = document.getElementById('heatmap');
  el.innerHTML = '';
  const max = Math.max(1, ...heatmap.map(h => h.count));
  heatmap.forEach(h => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const intensity = Math.min(1, h.count / max);
    if (h.count === 0) {
      cell.style.background = 'var(--surface-2)';
    } else if (intensity < 0.25) {
      cell.style.background = 'rgba(61,220,151,0.25)';
    } else if (intensity < 0.5) {
      cell.style.background = 'rgba(61,220,151,0.5)';
    } else if (intensity < 0.75) {
      cell.style.background = 'rgba(61,220,151,0.75)';
    } else {
      cell.style.background = 'var(--accent)';
    }
    cell.title = `${h.date}: ${h.count} pauze`;
    el.appendChild(cell);
  });
}
renderHeatmap();

// Program personalizat
function renderProgram() {
  const program = buildProgram(profile);
  const el = document.getElementById('programList');
  el.innerHTML = program.map(ex => `
    <div class="option" style="margin-bottom:8px">
      <img src="${ex.svg}" width="36" height="36" style="border-radius:8px;background:var(--accent-glow);padding:6px">
      <div class="option-text">
        <strong>${ex.name}</strong>
        <div style="font-size:.82rem;color:var(--text-mute);margin-top:2px">${ex.desc}</div>
      </div>
    </div>
  `).join('');
}
renderProgram();

// Today's zones
function renderTodayZones() {
  const done = new Set();
  todaySessions.forEach(s => (s.completed || []).forEach(z => done.add(z)));
  const allZones = ['neck', 'shoulders', 'back', 'eyes', 'wrists', 'breath'];
  const el = document.getElementById('todayZones');
  el.innerHTML = allZones.map(z => {
    return `<div class="zone-pill ${done.has(z) ? 'active' : ''}">${
      z === 'neck' ? '🦴 Gât' :
      z === 'shoulders' ? '💪 Umeri' :
      z === 'back' ? '🔙 Spate' :
      z === 'eyes' ? '👀 Ochi' :
      z === 'wrists' ? '🤚 Mâini' :
      '🫁 Respirație'
    }${done.has(z) ? ' ✓' : ''}</div>`;
  }).join('');
}
renderTodayZones();

// Timer
const timerConfig = Store.getTimer();
let timerRemaining = timerConfig.intervalSec;

function updateTimerDisplay() {
  $('timerDisplay').textContent = Timer.format(timerRemaining);
  $('timerState').textContent = timerRemaining > 0
    ? `Următoarea pauză în ${Timer.format(timerRemaining)}`
    : '⏰ Pauză! Fă un exercițiu acum.';
  $('btnToggleTimer').textContent = Timer.isRunning ? 'Pauză' : 'Pornește';
}
updateTimerDisplay();

function startBreakInterval() {
  timerRemaining = Store.getTimer().intervalSec;
  Timer.start(timerRemaining, {
    onTick: (rem) => { timerRemaining = rem; updateTimerDisplay(); },
    onComplete: () => {
      updateTimerDisplay();
      Notifier.fire('🧘 PosturePing — Pauză!', 'Fă un exercițiu de 60 secunde pentru gât, umeri sau ochi.', {
        onClick: () => window.location.href = './session.html?auto=1'
      });
      Notifier.vibrate([200, 100, 200]);
      toast('⏰ Pauză! Click pe Start pauză pentru exercițiu.');
      // auto-restart cycle
      setTimeout(() => startBreakInterval(), 3000);
    }
  });
  updateTimerDisplay();
}

$('btnToggleTimer').addEventListener('click', () => {
  if (Timer.isRunning && !Timer.isPaused) {
    Timer.pause();
    updateTimerDisplay();
  } else if (Timer.isRunning && Timer.isPaused) {
    Timer.resume();
    updateTimerDisplay();
  } else {
    startBreakInterval();
    toast('▶ Timer pornit. Te anunțăm la pauză.');
  }
});

$('btnSkip').addEventListener('click', () => {
  Timer.stop();
  timerRemaining = Store.getTimer().intervalSec;
  updateTimerDisplay();
  toast('⏭ Pauza sărită.');
});

// Start break button → goes to session
$('btnStartBreak').addEventListener('click', () => {
  window.location.href = './session.html';
});

// Welcome toast
const params = new URLSearchParams(location.search);
if (params.get('welcome') === '1') {
  toast('🎉 Profil salvat! Hai să facem prima pauză.');
  history.replaceState({}, '', './app.html');
}

// SETTINGS MODAL
$('btnSettings').addEventListener('click', async () => {
  $('settingsModal').classList.add('show');
  await Notifier.init();
  $('notifStatus').textContent = `Status: ${Notifier.permission}`;
  const cfg = Store.getTimer();
  $('intervalSelect').value = String(cfg.intervalSec);
  $('soundToggle').checked = cfg.soundOn;
  $('soundKnob').style.left = cfg.soundOn ? '25px' : '3px';
  $('soundKnob').style.background = cfg.soundOn ? 'var(--accent)' : 'var(--text-mute)';
});

$('closeSettings').addEventListener('click', () => $('settingsModal').classList.remove('show'));
$('settingsModal').addEventListener('click', e => {
  if (e.target.id === 'settingsModal') $('settingsModal').classList.remove('show');
});

$('intervalSelect').addEventListener('change', e => {
  const cfg = Store.getTimer();
  cfg.intervalSec = parseInt(e.target.value);
  Store.setTimer(cfg);
  Timer.stop();
  timerRemaining = cfg.intervalSec;
  updateTimerDisplay();
  toast(`✓ Interval setat la ${cfg.intervalSec / 60} min`);
});

$('btnEnableNotif').addEventListener('click', async () => {
  const ok = await Notifier.request();
  $('notifStatus').textContent = `Status: ${Notifier.permission}`;
  toast(ok ? '✓ Notificări activate' : '✗ Notificări refuzate');
});

$('soundToggle').addEventListener('change', e => {
  const cfg = Store.getTimer();
  cfg.soundOn = e.target.checked;
  Store.setTimer(cfg);
  $('soundKnob').style.left = cfg.soundOn ? '25px' : '3px';
  $('soundKnob').style.background = cfg.soundOn ? 'var(--accent)' : 'var(--text-mute)';
  if (cfg.soundOn) Notifier.beep();
});

// Click pe knob
document.querySelector('label[for="soundToggle"], #soundKnob')?.addEventListener('click', () => {
  $('soundToggle').checked = !$('soundToggle').checked;
  $('soundToggle').dispatchEvent(new Event('change'));
});

// Export PDF (HTML-based, fără libs externe)
$('btnExportPDF').addEventListener('click', () => {
  exportPDF();
});

function exportPDF() {
  const sessions = Store.getSessions();
  const stats = Store.getStats();
  const profile = Store.getProfile();
  const now = new Date();
  const monthName = now.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  // Calculăm luna curentă
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSessions = sessions.filter(s => new Date(s.date) >= monthStart);

  const w = window.open('', '_blank');
  if (!w) { toast('Pop-up blocat. Permite pop-up-uri.'); return; }

  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PosturePing Raport · ${monthName}</title>
      <style>
        body { font-family: -apple-system, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.6; }
        h1 { color: #3ddc97; border-bottom: 3px solid #3ddc97; padding-bottom: 12px; }
        h2 { color: #22c1c3; margin-top: 30px; }
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
        .stat { padding: 20px; background: #f0fdf6; border-radius: 12px; text-align: center; border: 1px solid #bbf7d0; }
        .stat-num { font-size: 2.4rem; font-weight: 800; color: #16a34a; }
        .stat-label { font-size: 0.85rem; color: #64748b; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td, th { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 0.9rem; }
        th { background: #f9fafb; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.85rem; color: #64748b; text-align: center; }
        @media print { body { margin: 0; padding: 24px; } }
      </style>
    </head>
    <body>
      <h1>📊 Raport PosturePing</h1>
      <p><strong>Pacient:</strong> ${profile.name || 'Utilizator'} · <strong>Perioada:</strong> ${monthName}</p>

      <div class="stat-grid">
        <div class="stat">
          <div class="stat-num">${stats.streak}</div>
          <div class="stat-label">Zile consecutive (streak)</div>
        </div>
        <div class="stat">
          <div class="stat-num">${monthSessions.length}</div>
          <div class="stat-label">Zile active luna aceasta</div>
        </div>
        <div class="stat">
          <div class="stat-num">${monthSessions.reduce((s, x) => s + (x.breaks || 0), 0)}</div>
          <div class="stat-label">Pauze luna aceasta</div>
        </div>
      </div>

      <h2>📈 Totaluri istorice</h2>
      <table>
        <tr><th>Indicator</th><th>Valoare</th></tr>
        <tr><td>Total minute salvate</td><td><strong>${stats.totalMinutes}</strong></td></tr>
        <tr><td>Total pauze</td><td><strong>${stats.totalBreaks}</strong></td></tr>
        <tr><td>Streak curent</td><td><strong>${stats.streak} zile</strong></td></tr>
        <tr><td>Ultima activitate</td><td>${stats.lastActiveDate || '—'}</td></tr>
      </table>

      <h2>🎯 Zone ignorate</h2>
      <p>Zonele cel mai puțin lucrate — focus pe luna viitoare:</p>
      <table>
        <tr><th>Zonă</th><th>Activități</th></tr>
        ${(() => {
          const freq = Store.buildZoneFreq();
          const zoneNames = { neck: '🦴 Gât', shoulders: '💪 Umeri', back: '🔙 Spate', eyes: '👀 Ochi', wrists: '🤚 Mâini', breath: '🫁 Respirație' };
          return ZONES.map(z => `<tr><td>${zoneNames[z]}</td><td>${Math.round(freq[z] || 0)}</td></tr>`).join('');
        })()}
      </table>

      <h2>📋 Profil utilizator</h2>
      <table>
        <tr><td>Job</td><td>${profile.job || '—'}</td></tr>
        <tr><td>Ore la birou/zi</td><td>${profile.hours || '—'}</td></tr>
        <tr><td>Ecrane</td><td>${profile.screen || '—'}</td></tr>
        <tr><td>Postură</td><td>${profile.posture || '—'}</td></tr>
        <tr><td>Interval pauză</td><td>${(profile.interval || 25)} minute</td></tr>
      </table>

      <div class="footer">
        Generat de PosturePing · ${new Date().toLocaleString('ro-RO')}<br>
        Acest raport este generat local din datele tale. Nu a fost transmis nicăieri.
      </div>

      <script>
        setTimeout(() => window.print(), 500);
      </script>
    </body>
    </html>
  `);
  w.document.close();
  toast('📄 Raport generat. Se deschide în filă nouă pentru print/salvare.');
}

// Share
$('btnShare').addEventListener('click', async () => {
  const url = window.location.origin + window.location.pathname.replace('app.html', 'index.html');
  const text = `Îți recomand PosturePing — micro-pauze ghidate la fiecare 25 min. Funcționează în browser, fără cont. ${url}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'PosturePing', text, url });
    } catch {}
  } else {
    navigator.clipboard.writeText(text);
    toast('🔗 Link copiat în clipboard');
  }
});

// Reset
$('btnReset').addEventListener('click', () => {
  if (confirm('⚠️ Sigur vrei să ștergi TOATE datele? Profil, istoric, statistici. Acțiune ireversibilă.')) {
    Store.reset();
    toast('✓ Date resetate.');
    setTimeout(() => window.location.href = './onboarding.html', 800);
  }
});
