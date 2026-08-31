// PosturePing Storage - localStorage wrapper
// Schema:
//   profile: { job, hours, painZones, screen, intensity, posture, breaks, name }
//   sessions: [{ date: 'YYYY-MM-DD', completed: ['neck','eyes'], skipped: [], totalSec: 60, breaks: 1 }]
//   stats: { streak, totalMinutes, totalBreaks, lastActiveDate }
//   timer: { lastStart, intervalSec: 25*60, soundOn, notifOn }

const KEYS = {
  profile: 'pp_profile',
  sessions: 'pp_sessions',
  stats: 'pp_stats',
  timer: 'pp_timer'
};

const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(KEYS[key]);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(KEYS[key], JSON.stringify(value)); return true; }
    catch { return false; }
  },
  has(key) { return localStorage.getItem(KEYS[key]) !== null; },

  // Profile
  getProfile() { return this.get('profile'); },
  setProfile(p) { return this.set('profile', p); },
  hasProfile() { return this.has('profile'); },

  // Sessions (history)
  getSessions() { return this.get('sessions', []); },
  saveSession(s) {
    const all = this.getSessions();
    all.push(s);
    // cap at 365 days
    if (all.length > 365) all.shift();
    this.set('sessions', all);
    return this.recalcStats();
  },

  recalcStats() {
    const sessions = this.getSessions();
    const today = new Date().toISOString().slice(0, 10);

    // streak: consecutive days back from today with at least 1 break
    let streak = 0;
    const daySet = new Set(sessions.filter(s => s.breaks > 0).map(s => s.date));
    const d = new Date();
    while (daySet.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    const totalBreaks = sessions.reduce((sum, s) => sum + (s.breaks || 0), 0);
    const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + (s.totalSec || 0), 0) / 60);

    const stats = { streak, totalMinutes, totalBreaks, lastActiveDate: today };
    this.set('stats', stats);
    return stats;
  },
  getStats() {
    return this.get('stats', { streak: 0, totalMinutes: 0, totalBreaks: 0, lastActiveDate: null });
  },

  // Timer config
  getTimer() {
    return this.get('timer', { intervalSec: 25 * 60, soundOn: true, notifOn: true });
  },
  setTimer(t) { return this.set('timer', t); },

  reset() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }
};

// Heatmap builder: returns array of { date, count } for last N days
Store.buildHeatmap = function (days = 90) {
  const sessions = this.getSessions();
  const map = {};
  sessions.forEach(s => {
    if (!map[s.date]) map[s.date] = 0;
    map[s.date] += (s.breaks || 0);
  });
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, count: map[dateStr] || 0 });
  }
  return result;
};

// Zone frequency: returns { zone: count } aggregated across sessions
Store.buildZoneFreq = function () {
  const sessions = this.getSessions();
  const freq = {};
  sessions.forEach(s => {
    (s.completed || []).forEach(z => { freq[z] = (freq[z] || 0) + 1; });
    (s.skipped || []).forEach(z => { freq[z] = (freq[z] || 0) + 0.3; });
  });
  return freq;
};

window.Store = Store;
