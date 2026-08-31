// 6 exerciții cu ilustrații SVG, descrieri, durată
const EXERCISES = [
  {
    id: 'neck',
    name: 'Întoarce gâtul',
    desc: '3× la stânga, 3× la dreapta, fără mișcări bruște. Urechile spre umeri.',
    svg: 'assets/exercises/neck.svg',
    zone: 'neck',
    duration: 60
  },
  {
    id: 'shoulders',
    name: 'Rotește umerii',
    desc: 'Cercuri complete înapoi: 5×. Eliberează tensiunea din trapez.',
    svg: 'assets/exercises/shoulders.svg',
    zone: 'shoulders',
    duration: 60
  },
  {
    id: 'eyes',
    name: 'Pauză de ochi (20-20-20)',
    desc: 'Privește la 6+ metri distanță, 20 secunde. Clipeste de 10 ori.',
    svg: 'assets/exercises/eyes.svg',
    zone: 'eyes',
    duration: 60
  },
  {
    id: 'back',
    name: 'Întinde spatele',
    desc: 'Răsucire ușoară a trunchiului pe scaun, 3× fiecare parte. Ține 5 sec.',
    svg: 'assets/exercises/back.svg',
    zone: 'back',
    duration: 60
  },
  {
    id: 'wrist',
    name: 'Rotește încheieturile',
    desc: '10× în sens orar, 10× invers. Eliberează tunelul carpian.',
    svg: 'assets/exercises/wrist.svg',
    zone: 'wrists',
    duration: 60
  },
  {
    id: 'breath',
    name: 'Respiră 4-7-8',
    desc: 'Inspiră 4 sec, ține 7, expiră 8. Repetă de 3 ori.',
    svg: 'assets/exercises/breath.svg',
    zone: 'breath',
    duration: 60
  }
];

const ZONES = ['neck', 'shoulders', 'back', 'eyes', 'wrists', 'breath'];

// Build program personalizat pe baza profilului
function buildProgram(profile) {
  if (!profile) return EXERCISES.slice(0, 3);

  const score = {};
  ZONES.forEach(z => score[z] = 0);

  // durere existentă → exerciții prioritare
  (profile.painZones || []).forEach(z => { if (score[z] !== undefined) score[z] += 5; });

  // job type
  const jobBonus = {
    programmer: { neck: 3, eyes: 3, wrists: 2, back: 2 },
    writer: { neck: 2, back: 3, eyes: 2 },
    designer: { neck: 3, eyes: 3, back: 2, wrists: 2 },
    manager: { neck: 2, back: 3, shoulders: 2 },
    student: { eyes: 2, neck: 2, back: 2 },
    other: { neck: 1, back: 1 }
  };
  const bonus = jobBonus[profile.job] || jobBonus.other;
  Object.entries(bonus).forEach(([z, v]) => { score[z] += v; });

  // ore de birou
  if (profile.hours === '8-10') { score.eyes += 2; score.neck += 1; score.back += 1; }
  if (profile.hours === '10+') { score.eyes += 3; score.neck += 2; score.back += 2; score.wrists += 1; }

  // ecran
  if (profile.screen === 'multi') { score.eyes += 2; score.neck += 1; }

  // postura
  if (profile.posture === 'slouch') { score.back += 2; score.shoulders += 2; score.neck += 2; }
  if (profile.posture === 'tilted') { score.neck += 3; }

  // Sortare exerciții pe scor
  const ranked = EXERCISES.map(e => ({ ...e, score: score[e.zone] || 0 }))
    .sort((a, b) => b.score - a.score);

  // Rotatie: dacă ai făcut neck azi, mută-l mai jos
  const today = new Date().toISOString().slice(0, 10);
  const todayZones = (Store.getSessions().filter(s => s.date === today).flatMap(s => s.completed || []));
  const freq = {};
  todayZones.forEach(z => freq[z] = (freq[z] || 0) + 1);

  ranked.forEach(e => { e.score -= (freq[e.zone] || 0) * 0.5; });
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, 4);
}

window.EXERCISES = EXERCISES;
window.ZONES = ZONES;
window.buildProgram = buildProgram;
