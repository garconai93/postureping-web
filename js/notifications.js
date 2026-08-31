// Web Notifications API + audio fallback
const Notifier = {
  permission: 'default',

  async init() {
    if (!('Notification' in window)) return false;
    this.permission = Notification.permission;
    return this.permission === 'granted';
  },

  async request() {
    if (!('Notification' in window)) return false;
    if (this.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  },

  fire(title, body, options = {}) {
    const timerConfig = Store.getTimer();
    const fallback = () => this.beep();

    if (timerConfig.notifOn && this.permission === 'granted') {
      try {
        const n = new Notification(title, {
          body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png',
          tag: 'postureping', renotify: true, ...options
        });
        n.onclick = () => {
          window.focus();
          n.close();
          if (options.onClick) options.onClick();
        };
        setTimeout(() => n.close(), 8000);
      } catch (e) { fallback(); }
    } else if (timerConfig.soundOn) {
      fallback();
    }
  },

  beep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  },

  vibrate(pattern = [200, 100, 200]) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }
};

window.Notifier = Notifier;
