(function () {
  window.Game = window.Game || {};

  var COLORS = ["#e8c26a", "#7ec850", "#4e9fe8", "#e8744e", "#d94f8a", "#b07ee8", "#f0f0f0"];

  function render(html) {
    Game.$("#app").innerHTML = html;
  }

  function overlay(html, cls) {
    var el = document.createElement("div");
    el.className = "overlay " + (cls || "show");
    el.innerHTML = '<div class="overlay-box">' + html + "</div>";
    document.body.appendChild(el);
    return el;
  }

  function confetti(count) {
    count = count || 70;
    for (var i = 0; i < count; i++) {
      var d = document.createElement("div");
      d.className = "confetti";
      var size = 8 + Math.random() * 10;
      d.style.left = Math.random() * 100 + "vw";
      d.style.width = size + "px";
      d.style.height = size * 0.6 + "px";
      d.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      d.style.animationDuration = 2.2 + Math.random() * 2 + "s";
      d.style.animationDelay = Math.random() * 0.8 + "s";
      d.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      document.body.appendChild(d);
      (function (node) {
        window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 5200);
      })(d);
    }
  }

  function fireworks(count) {
    count = count || 40;
    for (var i = 0; i < count; i++) {
      var d = document.createElement("div");
      d.className = "spark";
      var size = 6 + Math.random() * 8;
      d.style.left = Math.random() * 100 + "vw";
      d.style.width = size + "px";
      d.style.height = size + "px";
      d.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      d.style.borderRadius = "50%";
      d.style.animationDuration = 1.4 + Math.random() * 1.4 + "s";
      d.style.animationDelay = Math.random() * 1.6 + "s";
      document.body.appendChild(d);
      (function (node) {
        window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 4200);
      })(d);
    }
  }

  function starsHtml(n) {
    var s = "";
    for (var i = 0; i < 3; i++) s += i < n ? "★" : '<span class="off">★</span>';
    return '<div class="stars">' + s + "</div>";
  }

  Game.UI = {
    render: render,
    overlay: overlay,
    confetti: confetti,
    fireworks: fireworks,
    starsHtml: starsHtml,

    menu: function (onStart) {
      render(
        '<div class="panel">' +
        '<div class="title">穗豐村大冒險</div>' +
        '<div class="subtitle">雙人協力 · 腦力與操作的默契挑戰</div>' +
        '<div class="meta"><span>🌱 8 個關卡</span><span>🧠 腦力 × 4</span><span>⚡ 操作 × 4</span></div>' +
        '<p class="story-text" style="text-align:center">一位玩家用滑鼠、一位玩家用鍵盤，同一台電腦並肩作戰！<br>遇到登入或授權時再停下來即可，這裡直接開始就行。</p>' +
        '<button class="btn" id="btn-start">開始冒險</button>' +
        '<div><button class="btn secondary" id="btn-sound" style="min-width:160px">🔊 音效：開</button></div>' +
        "</div>"
      );
      Game.on(Game.$("#btn-start"), "click", function () {
        Game.Audio.click();
        onStart();
      });
      var soundBtn = Game.$("#btn-sound");
      Game.on(soundBtn, "click", function () {
        Game.Audio.muted = !Game.Audio.muted;
        soundBtn.textContent = Game.Audio.muted ? "🔇 音效：關" : "🔊 音效：開";
        if (!Game.Audio.muted) Game.Audio.click();
      });
    },

    charSelect: function (onDone) {
      var picks = [];
      var current = 0;

      function draw() {
        var isP1 = current === 0;
        var cards = Game.Characters.list
          .map(function (c) {
            return (
              '<div class="char-card" data-id="' + c.id + '">' +
              '<span class="char-emoji">' + c.emoji + "</span>" +
              '<span class="char-name">' + c.name + "</span>" +
              '<span class="char-type">' + c.type + "</span>" +
              '<span class="char-kit">' + c.kit + "</span>" +
              "</div>"
            );
          })
          .join("");

        render(
          '<div class="panel">' +
          '<div class="title" style="font-size:38px">冒險者集結</div>' +
          '<div class="subtitle">' + (isP1 ? "玩家 1" : "玩家 2") + "：選擇角色並取個名字</div>" +
          '<div class="pick-list">' + cards + "</div>" +
          '<div><input class="name-input" id="name-input" maxlength="8" placeholder="輸入名字" value="' +
          (isP1 ? "勇敢小勇士" : "機智好夥伴") + '"></div>' +
          '<button class="btn" id="btn-confirm" style="margin-top:16px">' +
          (isP1 ? "換玩家 2 選擇" : "出發！") +
          "</button>" +
          '<div class="meta" style="margin-top:14px">' +
          (picks[0] ? '<span class="p1">玩家1：' + Game.esc(picks[0].name) + "（" + picks[0].char.name + "）</span>" : "") +
          "</div>" +
          "</div>"
        );

        var selected = isP1 ? "farmer" : "elder";
        var cardsEls = Game.$$(".char-card");
        function mark() {
          cardsEls.forEach(function (el) {
            el.classList.toggle("selected", el.getAttribute("data-id") === selected);
          });
        }
        cardsEls.forEach(function (el) {
          Game.on(el, "click", function () {
            selected = el.getAttribute("data-id");
            Game.Audio.select();
            mark();
          });
        });
        mark();

        Game.on(Game.$("#btn-confirm"), "click", function () {
          var nameInput = Game.$("#name-input");
          var name = (nameInput.value || "").trim();
          if (!name) {
            nameInput.focus();
            nameInput.style.borderColor = "#d9534f";
            return;
          }
          Game.Audio.select();
          picks[current] = { char: Game.Characters.byId(selected), name: name };
          if (current === 0) {
            current = 1;
            draw();
          } else {
            onDone(picks[0], picks[1]);
          }
        });
      }

      draw();
    },

    story: function (opts) {
      var title = opts.title ? '<div class="title" style="font-size:36px">' + Game.esc(opts.title) + "</div>" : "";
      render(
        '<div class="panel">' +
        title +
        '<div class="story-text">' + Game.esc(opts.text) + "</div>" +
        '<button class="btn" id="btn-next">' + (opts.nextLabel || "繼續") + "</button>" +
        "</div>"
      );
      Game.on(Game.$("#btn-next"), "click", function () {
        Game.Audio.click();
        opts.onNext();
      });
    },

    level: function (meta) {
      render(
        '<div class="panel">' +
        '<div class="level-header">' +
        '<div class="level-title">' + meta.title + "</div>" +
        '<div class="hud-score">分數 <span id="hud-score">0</span></div>' +
        '<div class="hud-time"><span id="hud-time">0</span>s</div>' +
        "</div>" +
        '<div class="timer-track"><div class="timer-fill" id="timer-fill"></div></div>' +
        '<div class="level-body" id="level-body"></div>' +
        '<div class="hint-bar">' +
        '<div class="hint-p1" id="hint-p1">' + (meta.p1 || "") + "</div>" +
        '<div class="hint-p2" id="hint-p2">' + (meta.p2 || "") + "</div>" +
        "</div>" +
        "</div>"
      );

      var body = Game.$("#level-body");
      var scoreEl = Game.$("#hud-score");
      var timeEl = Game.$("#hud-time");
      var fillEl = Game.$("#timer-fill");
      var remaining = 0;
      var total = 1;
      var tick = null;
      var timeoutCb = null;

      function paint() {
        timeEl.textContent = Math.max(0, Math.ceil(remaining));
        var pct = Math.max(0, Math.min(100, (remaining / total) * 100));
        fillEl.style.width = pct + "%";
      }

      return {
        body: body,
        setScore: function (v) { scoreEl.textContent = v; },
        setHints: function (p1, p2) {
          Game.$("#hint-p1").innerHTML = p1;
          Game.$("#hint-p2").innerHTML = p2;
        },
        addTime: function (sec) {
          remaining += sec;
          total = Math.max(total, remaining);
          paint();
        },
        startTimer: function (seconds, cb) {
          remaining = seconds;
          total = seconds;
          timeoutCb = cb;
          paint();
          if (tick) window.clearInterval(tick);
          tick = window.setInterval(function () {
            remaining -= 0.1;
            if (remaining <= 0) {
              remaining = 0;
              paint();
              window.clearInterval(tick);
              tick = null;
              if (timeoutCb) timeoutCb();
              return;
            }
            paint();
          }, 100);
        },
        stopTimer: function () {
          if (tick) {
            window.clearInterval(tick);
            tick = null;
          }
        },
        remaining: function () { return remaining; }
      };
    },

    result: function (opts) {
      var html =
        '<div class="overlay-big">' + (opts.win ? "過 關 ！" : "再 接 再 厲 ！") + "</div>" +
        (opts.win ? starsHtml(opts.stars) : '<div class="stars" style="color:#d9534f">✖</div>') +
        '<p class="story-text" style="text-align:center;margin:8px 0">' + (opts.message || "") + "</p>" +
        '<div class="meta"><span style="color:#ffd98a">本關分數 ' + opts.score + "</span>" +
        (opts.win ? '<span style="color:#b7e39a">村莊復甦度 ' + opts.total + "</span>" : "") +
        "</div>" +
        '<button class="btn ' + (opts.win ? "" : "secondary") + '" id="btn-action">' +
        (opts.win ? "繼續前進" : "再試一次") +
        "</button>";

      var el = overlay(html);
      if (opts.win) {
        confetti(80);
        Game.Audio.fanfare();
      } else {
        Game.Audio.lose();
      }
      Game.on(Game.$("#btn-action"), "click", function () {
        Game.Audio.click();
        el.remove();
        if (opts.win) opts.onNext();
        else opts.onRetry();
      });
    },

    ending: function (opts) {
      render(
        '<div class="panel">' +
        '<div class="title">豐 收 慶 典</div>' +
        '<div class="story-text">' + Game.esc(opts.text) + "</div>" +
        '<div class="meta"><span class="p1">' + Game.esc(opts.p1) + '</span><span class="p2">' + Game.esc(opts.p2) + "</span></div>" +
        '<div class="overlay-big" style="font-size:34px">村莊復甦度 ' + opts.total + "</div>" +
        '<div class="stars">' + opts.stars.toFixed(0) + " / 24 ★</div>" +
        '<div class="overlay-big" style="font-size:28px">' + opts.rank + "</div>" +
        '<button class="btn" id="btn-again">再玩一次</button>' +
        "</div>"
      );
      fireworks(120);
      Game.Audio.great();
      window.setTimeout(function () { fireworks(80); }, 900);
      window.setTimeout(function () { fireworks(80); }, 1800);
      Game.on(Game.$("#btn-again"), "click", function () {
        Game.Audio.click();
        opts.onRestart();
      });
    }
  };
})();