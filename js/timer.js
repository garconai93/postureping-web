// Pomodoro-style timer for break intervals
const Timer = {
  intervalId: null,
  remaining: 0,
  totalSec: 0,
  isRunning: false,
  isPaused: false,
  onTick: null,
  onComplete: null,
  onStart: null,

  start(durationSec, callbacks = {}) {
    this.stop();
    this.totalSec = durationSec;
    this.remaining = durationSec;
    this.isRunning = true;
    this.isPaused = false;
    this.onTick = callbacks.onTick;
    this.onComplete = callbacks.onComplete;
    this.onStart = callbacks.onStart;

    if (this.onStart) this.onStart(this.remaining);

    this.intervalId = setInterval(() => {
      if (this.isPaused) return;
      this.remaining--;
      if (this.onTick) this.onTick(this.remaining, this.totalSec);
      if (this.remaining <= 0) {
        this.stop();
        if (this.onComplete) this.onComplete();
      }
    }, 1000);
  },

  pause() {
    this.isPaused = true;
  },

  resume() {
    this.isPaused = false;
  },

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    this.isPaused = false;
  },

  format(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
};

window.Timer = Timer;
