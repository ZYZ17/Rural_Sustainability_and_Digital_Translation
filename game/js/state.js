(function () {
  window.Game = window.Game || {};

  Game.rand = function (min, max) {
    return min + Math.random() * (max - min);
  };

  Game.randInt = function (min, max) {
    return Math.floor(Game.rand(min, max + 1));
  };

  Game.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  };

  Game.createCanvas = function (body, W, H) {
    var canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    body.appendChild(canvas);
    return canvas;
  };

  Game.pointerPos = function (canvas, e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height)
    };
  };

  Game.State = {
    players: [null, null],
    levelIndex: 0,
    totalScore: 0,
    totalStars: 0,
    current: null,
    ui: null,
    lastSec: 60,

    boot: function () {
      var self = this;
      Game.Audio.init();
      Game.Input.init();
      Game.UI.menu(function () {
        Game.Audio.bgmStart();
        self.pickChars();
      });
    },

    pickChars: function () {
      var self = this;
      Game.UI.charSelect(function (p1, p2) {
        self.players = [p1, p2];
        self.levelIndex = 0;
        self.totalScore = 0;
        self.totalStars = 0;
        Game.UI.story({
          title: "序章 · 穗豐村的請託",
          text: Game.Story.intro,
          nextLabel: "踏上征途",
          onNext: function () { self.startLevel(0); }
        });
      });
    },

    timeFor: function (type) {
      var base = type === "action" ? Game.Config.baseTimeAction : Game.Config.baseTimeBrain;
      var bonusMs = 0;
      this.players.forEach(function (p) {
        if (!p) return;
        bonusMs += type === "action" ? p.char.actionMs : p.char.brainMs;
        if (type === "action" && p.char.brainMs && !p.char.actionMs) bonusMs += Game.Config.balanceMs;
        if (type === "brain" && p.char.actionMs && !p.char.brainMs) bonusMs += Game.Config.balanceMs;
      });
      return base + bonusMs / 1000;
    },

    startLevel: function (idx) {
      var self = this;
      this.levelIndex = idx;
      var meta = Game.Levels.list[idx];
      var story = Game.Story.byLevel(idx);
      Game.UI.story({
        title: "第 " + (idx + 1) + " 關 · " + meta.title,
        text: story.text,
        nextLabel: "開始挑戰",
        onNext: function () { self.mountLevel(); }
      });
    },

    mountLevel: function () {
      var self = this;
      var meta = Game.Levels.list[this.levelIndex];
      var mod = meta.module;
      var sec = this.timeFor(meta.type);
      this.lastSec = sec;

      this.ui = Game.UI.level({
        title: meta.title,
        p1: "🖱️ " + this.players[0].name + "（滑鼠）：" + mod.p1hint,
        p2: "⌨️ " + this.players[1].name + "（鍵盤）：" + mod.p2hint
      });
      this.ui.setScore(0);

      var ctx = {
        body: this.ui.body,
        ui: this.ui,
        config: Game.Config,
        players: this.players,
        setScore: function (v) { self.ui.setScore(v); },
        addTime: function (s) { self.ui.addTime(s); },
        win: function (score, perfect) { self.win(score, perfect); },
        fail: function (msg) { self.lose(msg); }
      };

      this.current = mod.mount(ctx);
      this.ui.startTimer(sec, function () {
        self.lose("時間到了，再試一次！");
      });
    },

    win: function (score, perfect) {
      var self = this;
      this.ui.stopTimer();
      var rem = this.ui.remaining();
      var ratio = Math.max(0, Math.min(1, rem / this.lastSec));
      var stars = 1;
      if (ratio >= 0.4) stars++;
      if (ratio >= 0.7 || perfect) stars++;
      if (stars > 3) stars = 3;

      this.totalScore += score;
      this.totalStars += stars;

      Game.UI.result({
        win: true,
        stars: stars,
        score: score,
        total: this.totalScore,
        message: Game.Levels.list[this.levelIndex].clearMsg || "默契十足，漂亮過關！",
        onNext: function () {
          self.destroyCurrent();
          self.levelIndex++;
          if (self.levelIndex >= Game.Levels.list.length) self.finish();
          else self.startLevel(self.levelIndex);
        }
      });
    },

    lose: function (msg) {
      var self = this;
      this.ui.stopTimer();
      Game.UI.result({
        win: false,
        score: 0,
        message: msg || "別氣餒，再挑戰一次！",
        onNext: function () {},
        onRetry: function () {
          self.destroyCurrent();
          self.mountLevel();
        }
      });
    },

    destroyCurrent: function () {
      if (this.current && typeof this.current.destroy === "function") {
        this.current.destroy();
      }
      this.current = null;
    },

    finish: function () {
      var self = this;
      var stars = this.totalStars;
      var rank =
        stars >= 22 ? "🏆 傳奇冒險家" :
        stars >= 17 ? "🥇 金牌拍檔" :
        stars >= 12 ? "🥈 可靠夥伴" :
        "🌱 見習冒險者";
      Game.UI.ending({
        text: Game.Story.ending,
        p1: "玩家1 " + this.players[0].name + "（" + this.players[0].char.name + "）",
        p2: "玩家2 " + this.players[1].name + "（" + this.players[1].char.name + "）",
        total: this.totalScore,
        stars: stars,
        rank: rank,
        onRestart: function () {
          Game.Audio.bgmStop();
          self.players = [null, null];
          self.levelIndex = 0;
          self.totalScore = 0;
          self.totalStars = 0;
          Game.UI.menu(function () {
            Game.Audio.bgmStart();
            self.pickChars();
          });
        }
      });
    }
  };
})();