// Achievements system + confetti celebration
const ACHIEVEMENTS = [
  { id: 'first-break', icon: '🌱', name: 'Prima pauză', desc: 'Ai terminat primul exercițiu' },
  { id: 'streak-3', icon: '🔥', name: '3 zile streak', desc: '3 zile consecutive de pauze' },
  { id: 'streak-7', icon: '⚡', name: 'Săptămâna completă', desc: '7 zile streak' },
  { id: 'streak-30', icon: '�', name: 'Luna de fier', desc: '30 zile streak' },
  { id: 'breaks-10', icon: '🎯', name: '10 pauze', desc: '10 exerciții finalizate' },
  { id: 'breaks-50', icon: '💪', name: '50 pauze', desc: '50 exerciții finalizate' },
  { id: 'breaks-100', icon: '🚀', name: '100 pauze', desc: '100 exerciții finalizate' },
  { id: 'all-zones', icon: '🧘', name: 'Toate zonele', desc: 'Ai lucrat toate cele 6 zone' },
  { id: 'morning-bird', icon: '🌅', name: 'Morning bird', desc: '5 pauze înainte de 10:00' },
  { id: 'night-owl', icon: '🌙', name: 'Night owl', desc: '5 pauze după 22:00' }
];

const KEY_ACHIEVEMENTS = 'pp_achievements';

const Achievements = {
  get() {
    try { return JSON.parse(localStorage.getItem(KEY_ACHIEVEMENTS) || '[]'); }
    catch { return []; }
  },
  has(id) { return this.get().includes(id); },
  unlock(id) {
    const list = this.get();
    if (list.includes(id)) return null;
    list.push(id);
    localStorage.setItem(KEY_ACHIEVEMENTS, JSON.stringify(list));
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach) this.celebrate(ach);
    return ach;
  },

  checkAfter(stats) {
    const newly = [];
    if (stats.totalBreaks >= 1 && !this.has('first-break')) {
      const a = this.unlock('first-break'); if (a) newly.push(a);
    }
    if (stats.streak >= 3 && !this.has('streak-3')) {
      const a = this.unlock('streak-3'); if (a) newly.push(a);
    }
    if (stats.streak >= 7 && !this.has('streak-7')) {
      const a = this.unlock('streak-7'); if (a) newly.push(a);
    }
    if (stats.streak >= 30 && !this.has('streak-30')) {
      const a = this.unlock('streak-30'); if (a) newly.push(a);
    }
    if (stats.totalBreaks >= 10 && !this.has('breaks-10')) {
      const a = this.unlock('breaks-10'); if (a) newly.push(a);
    }
    if (stats.totalBreaks >= 50 && !this.has('breaks-50')) {
      const a = this.unlock('breaks-50'); if (a) newly.push(a);
    }
    if (stats.totalBreaks >= 100 && !this.has('breaks-100')) {
      const a = this.unlock('breaks-100'); if (a) newly.push(a);
    }
    return newly;
  },

  celebrate(ach) {
    // Toast special
    const toast = document.createElement('div');
    toast.className = 'milestone-toast';
    toast.innerHTML = `<span style="font-size:1.5rem">${ach.icon}</span> Achievement: <strong>${ach.name}</strong>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
    this.confetti(30);
  },

  confetti(count = 40) {
    const colors = ['#3ddc97', '#22c1c3', '#ffd166', '#ff7a7a', '#a78bfa'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDuration = (2 + Math.random() * 2) + 's';
      el.style.animationDelay = Math.random() * 0.5 + 's';
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }
  },

  renderList(container) {
    const unlocked = this.get();
    container.innerHTML = ACHIEVEMENTS.map(a => `
      <div class="achievement ${unlocked.includes(a.id) ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${a.icon}</div>
        <div>
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
      </div>
    `).join('');
  }
};

window.Achievements = Achievements;
window.ACHIEVEMENTS = ACHIEVEMENTS;
