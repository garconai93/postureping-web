const QUESTIONS = [
  {
    key: 'name',
    text: 'Cum să te strig?',
    type: 'text',
    placeholder: 'Ex: Andrei'
  },
  {
    key: 'job',
    text: 'Ce faci la birou?',
    options: [
      { value: 'programmer', label: '🖥 Programator / Dev' },
      { value: 'designer', label: '🎨 Designer / Creative' },
      { value: 'writer', label: '✍️ Scriitor / Journalist' },
      { value: 'manager', label: '👔 Manager / PM / Lead' },
      { value: 'student', label: '🎓 Student / Cursant' },
      { value: 'other', label: '🤷 Altceva' }
    ]
  },
  {
    key: 'hours',
    text: 'Câte ore stai la birou pe zi?',
    options: [
      { value: '4-6', label: '4-6 ore' },
      { value: '6-8', label: '6-8 ore' },
      { value: '8-10', label: '8-10 ore' },
      { value: '10+', label: '10+ ore (max effort)' }
    ]
  },
  {
    key: 'screen',
    text: 'Câte ecrane folosești simultan?',
    options: [
      { value: 'one', label: '1 (laptop doar)' },
      { value: 'two', label: '2 (laptop + monitor)' },
      { value: 'multi', label: '3+ sau setup complex' }
    ]
  },
  {
    key: 'painZones',
    text: 'Unde te doare ACUM cel mai des? (poți alege mai multe)',
    multi: true,
    options: [
      { value: 'neck', label: '🦴 Ceafă / Gât' },
      { value: 'shoulders', label: '💪 Umeri / Trapez' },
      { value: 'back', label: '🔙 Spate inferior' },
      { value: 'eyes', label: '👀 Ochi uscați / obosiți' },
      { value: 'wrists', label: '🤚 Încheieturi / Mâini' },
      { value: 'breath', label: '🫁 Respirație scurtă' }
    ]
  },
  {
    key: 'posture',
    text: 'Cum stai de obicei la birou?',
    options: [
      { value: 'straight', label: '🧍 Drept, scaun ajustat' },
      { value: 'tilted', label: '🤳 Capul aplecat spre ecran' },
      { value: 'slouch', label: '😩 Spatele rotunjit, ghemuit' },
      { value: 'mixed', label: '🔄 Variază, fără regulă' }
    ]
  },
  {
    key: 'intensity',
    text: 'Cât de intense vrei să fie exercițiile?',
    options: [
      { value: 'gentle', label: '🌸 Gentle (exerciții ușoare)' },
      { value: 'normal', label: '⚡ Normal (mix recomandat)' },
      { value: 'intense', label: '🔥 Intense (stretching real)' }
    ]
  },
  {
    key: 'interval',
    text: 'Cât de des vrei pauze?',
    options: [
      { value: 20, label: '� La 20 min (intensiv)' },
      { value: 25, label: '⏱ La 25 min (recomandat)' },
      { value: 30, label: '🧘 La 30 min (lejer)' },
      { value: 45, label: '💤 La 45 min (deep work)' }
    ]
  }
];

const state = {
  step: 0,
  answers: {}
};

const $ = id => document.getElementById(id);

function render() {
  const q = QUESTIONS[state.step];
  const total = QUESTIONS.length;
  const progress = ((state.step + 1) / total) * 100;
  $('progress').style.width = `${progress}%`;
  $('stepLabel').textContent = `Pas ${state.step + 1} din ${total}`;
  $('question').textContent = q.text;

  const optsEl = $('options');
  optsEl.innerHTML = '';

  if (q.type === 'text') {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = q.placeholder || '';
    input.value = state.answers[q.key] || '';
    input.className = 'option';
    input.style.width = '100%';
    input.style.fontSize = '1rem';
    input.style.padding = '16px 18px';
    input.addEventListener('input', e => {
      state.answers[q.key] = e.target.value.trim();
      $('btnNext').disabled = !state.answers[q.key];
    });
    optsEl.appendChild(input);
    if (state.answers[q.key]) $('btnNext').disabled = false;
  } else {
    q.options.forEach(opt => {
      const optEl = document.createElement('div');
      optEl.className = 'option';
      const selected = q.multi
        ? (state.answers[q.key] || []).includes(opt.value)
        : state.answers[q.key] === opt.value;
      if (selected) optEl.classList.add('selected');

      optEl.innerHTML = `
        <div class="option-radio"></div>
        <div class="option-text">${opt.label}</div>
      `;
      optEl.addEventListener('click', () => {
        if (q.multi) {
          const arr = state.answers[q.key] || [];
          const idx = arr.indexOf(opt.value);
          if (idx >= 0) arr.splice(idx, 1); else arr.push(opt.value);
          state.answers[q.key] = arr.length ? arr : [];
        } else {
          state.answers[q.key] = opt.value;
        }
        render();
      });
      optsEl.appendChild(optEl);
    });
    $('btnNext').disabled = !state.answers[q.key] || (q.multi && state.answers[q.key].length === 0);
  }

  $('btnBack').disabled = state.step === 0;
  $('btnNext').textContent = state.step === total - 1 ? 'Termină setup →' : 'Continuă →';
}

$('btnNext').addEventListener('click', () => {
  if (state.step < QUESTIONS.length - 1) {
    state.step++;
    render();
  } else {
    // Save profile
    const profile = {
      ...state.answers,
      createdAt: new Date().toISOString(),
      intensity: state.answers.intensity || 'normal'
    };
    Store.setProfile(profile);

    const timer = Store.getTimer();
    timer.intervalSec = (state.answers.interval || 25) * 60;
    Store.setTimer(timer);

    // request notification permission
    Notifier.init().then(() => Notifier.request());

    window.location.href = './app.html?welcome=1';
  }
});

$('btnBack').addEventListener('click', () => {
  if (state.step > 0) {
    state.step--;
    render();
  }
});

render();
