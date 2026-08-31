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

// Init 3D character
function initCharacter() {
  const canvas = document.getElementById('characterCanvas');
  if (!canvas || typeof Character3D === 'undefined' || typeof THREE === 'undefined') {
    // Fallback to SVG
    return;
  }
  try {
    character3D = Character3D.init(canvas);
  } catch (e) {
    console.warn('[Session] 3D init failed:', e);
  }
}

function renderCurrent() {
  const ex = program[sessionState.index];
  if (!ex) return finishSession();

  $('stepLabel').textContent = `Exercițiul ${sessionState.index + 1} din ${program.length}`;
  $('exerciseName').textContent = ex.name;
  $('exerciseDesc').textContent = ex.desc;

  // Switch 3D character exercise
  if (character3D) character3D.setExercise(ex.id);

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

      // Update phase text for breath
      if (ex.id === 'breath' && character3D) {
        const phase = character3D.getPhase();
        if (phase && phaseTextEl) {
          phaseTextEl.textContent = phase;
          phaseTextEl.style.opacity = '1';
          phaseTextEl.style.color = phase === 'Inspiră' ? '#3ddc97' :
                                     phase === 'Ține' ? '#ffd166' : '#22c1c3';
        }
      }
    },
    onComplete: () => {
      if (ex.id === 'breath' && phaseTextEl) {
        phaseTextEl.style.opacity = '0';
      }
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

initCharacter();
renderCurrent();
