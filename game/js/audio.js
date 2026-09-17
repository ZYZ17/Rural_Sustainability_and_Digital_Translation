(function () {
  window.Game = window.Game || {};

  var melody = [392, 440, 523, 440, 587, 523, 440, 349, 392, 330, 392, 440];
  var bgmTimer = null;
  var bgmStep = 0;

  function ctx() {
    return Game.Audio.ctx;
  }

  Game.Audio = {
    ctx: null,
    muted: false,

    init: function () {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !this.ctx) this.ctx = new AC();
      this.resume();
      var self = this;
      Game.on(document, "pointerdown", function () { self.resume(); });
    },

    resume: function () {
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    },

    tone: function (freq, dur, type, vol, when, slide) {
      if (!this.ctx || this.muted) return;
      vol = vol || 0.2;
      dur = dur || 0.15;
      type = type || "sine";
      var t = this.ctx.currentTime + (when || 0);
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.04);
    },

    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      dur = dur || 0.1;
      vol = vol || 0.18;
      var t = this.ctx.currentTime;
      var len = Math.floor(this.ctx.sampleRate * dur);
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      var f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 1600;
      src.connect(f);
      f.connect(g);
      g.connect(this.ctx.destination);
      src.start(t);
    },

    click: function () { this.tone(660, 0.06, "triangle", 0.12); },
    select: function () { this.tone(520, 0.09, "triangle", 0.15); this.tone(780, 0.12, "triangle", 0.13, 0.07); },
    correct: function () { this.tone(523, 0.11, "triangle", 0.18); this.tone(784, 0.16, "triangle", 0.18, 0.09); },
    wrong: function () { this.tone(170, 0.22, "sawtooth", 0.14, 0, -80); },
    hit: function () { this.tone(880, 0.07, "square", 0.12); this.tone(1320, 0.09, "square", 0.1, 0.05); },
    catchSound: function () { this.tone(620, 0.09, "sine", 0.2); this.tone(930, 0.11, "sine", 0.15, 0.06); },
    thud: function () { this.tone(130, 0.14, "sine", 0.28, 0, -60); this.noise(0.06, 0.1); },
    drumHit: function () { this.tone(96, 0.09, "sine", 0.42); this.tone(210, 0.06, "triangle", 0.18); },
    rock: function () { this.noise(0.12, 0.16); this.tone(300, 0.1, "triangle", 0.12, 0, 120); },
    fanfare: function () {
      [523, 659, 784, 1046].forEach(function (f, i) { Game.Audio.tone(f, 0.22, "triangle", 0.2, i * 0.12); });
      this.tone(1318, 0.45, "triangle", 0.18, 0.52);
    },
    lose: function () { [392, 311, 233].forEach(function (f, i) { Game.Audio.tone(f, 0.25, "sine", 0.2, i * 0.17); }); },
    great: function () {
      var seq = [523, 659, 784, 1046, 1318, 1568];
      seq.forEach(function (f, i) { Game.Audio.tone(f, 0.2, "triangle", 0.2, i * 0.11); });
    },

    bgmStart: function () {
      var self = this;
      if (bgmTimer) return;
      bgmStep = 0;
      bgmTimer = window.setInterval(function () {
        if (!self.ctx || self.muted) return;
        var f = melody[bgmStep % melody.length];
        self.tone(f, 0.5, "sine", 0.045);
        self.tone(f * 2, 0.16, "triangle", 0.02);
        if (bgmStep % 2 === 1 && bgmStep % 4 === 3) self.noise(0.05, 0.02);
        bgmStep++;
      }, 480);
    },

    bgmStop: function () {
      if (bgmTimer) {
        window.clearInterval(bgmTimer);
        bgmTimer = null;
      }
    }
  };
})();