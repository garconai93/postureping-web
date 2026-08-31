renderNav('app');

const profile = Store.getProfile();
if (!profile) {
  window.location.replace('./onboarding.html');
  throw new Error('No profile, redirecting');
}

const program = buildProgram(profile);
const sessionState = {
  index: 0,
  completed: [],
  skipped: [],
  totalSec: 0,
  startedAt: new Date().toISOString()
};

const RING_CIRC = 2 * Math.PI * 80;

let character3D = null;
const phaseTextEl = document.getElementById('phaseText');

// 2D SVG mode - no character init needed

function renderCurrent() {
  const ex = program[sessionState.index];
  if (!ex) return finishSession();

  $('stepLabel').textContent = `Exercițiul ${sessionState.index + 1} din ${program.length}`;
  $('exerciseName').textContent = ex.name;
  $('exerciseDesc').textContent = ex.desc;

  // Set SVG image (2D illustration)
  const svgImg = document.getElementById('exerciseSvg');
  if (svgImg) {
    svgImg.src = ex.svg;
    svgImg.alt = ex.name;
  }

  startExerciseTimer(ex);
  renderZoneGrid();
}

function startExerciseTimer(ex) {
  Timer.stop();
  let remaining = ex.duration;

  $('sessionTimer').textContent = remaining;
  $('ringFill').style.strokeDasharray = RING_CIRC;
  $('ringFill').style.strokeDashoffset = '0';

  // For breath exercise, sync timer to breathing phase (19s instead of 60s)
  const totalDuration = ex.id === 'breath' ? 19 : ex.duration;

  Timer.start(totalDuration, {
    onTick: (rem, total) => {
      $('sessionTimer').textContent = rem;
      const progress = (total - rem) / total;
      $('ringFill').style.strokeDashoffset = RING_CIRC * progress;
    },
    onComplete: () => {
      completeExercise(ex, false);
    }
  });
}

function completeExercise(ex, skipped) {
  if (skipped) sessionState.skipped.push(ex.zone);
  else { sessionState.completed.push(ex.zone); sessionState.totalSec += ex.duration; }

  sessionState.index++;
  if (sessionState.index >= program.length) finishSession();
  else renderCurrent();
}

function renderZoneGrid() {
  const el = document.getElementById('zoneGrid');
  const allZones = ['neck', 'shoulders', 'back', 'eyes', 'wrists', 'breath'];
  el.innerHTML = allZones.map(z => {
    const isCurrent = program[sessionState.index]?.zone === z;
    const isDone = sessionState.completed.includes(z);
    const isSkipped = sessionState.skipped.includes(z);
    const cls = isCurrent ? 'current' : isDone ? 'done' : isSkipped ? 'skipped' : '';
    const label = z === 'neck' ? '🦴' : z === 'shoulders' ? '�' : z === 'back' ? '🔙' : z === 'eyes' ? '👀' : z === 'wrists' ? '🤚' : '🫁';
    return `<div class="cell ${cls}" title="${z}">${label}</div>`;
  }).join('');
}

function finishSession() {
  Timer.stop();
  if (phaseTextEl) phaseTextEl.style.opacity = '0';

  const session = {
    date: new Date().toISOString().slice(0, 10),
    timestamp: new Date().toISOString(),
    completed: sessionState.completed,
    skipped: sessionState.skipped,
    totalSec: sessionState.totalSec,
    breaks: sessionState.completed.length > 0 ? 1 : 0
  };

  if (session.completed.length > 0) {
    Store.saveSession(session);
    Notifier.fire('✅ Pauză completă!', `${session.completed.length} exerciții, ${session.totalSec}s. Corpul tău îți mulțumește.`);
    Notifier.beep();

    const stats = Store.getStats();
    const newly = Achievements.checkAfter(stats);
    if (newly.length > 0) { /* toast handled by Achievements */ }
  }

  setTimeout(() => {
    window.location.href = './app.html?session=1';
  }, 800);
}

$('btnSkip').addEventListener('click', () => {
  const ex = program[sessionState.index];
  completeExercise(ex, true);
});

$('btnDone').addEventListener('click', () => {
  const ex = program[sessionState.index];
  completeExercise(ex, false);
});

const params = new URLSearchParams(location.search);
if (params.get('auto') === '1') {
  Notifier.vibrate([200, 100, 200]);
}

renderCurrent();
