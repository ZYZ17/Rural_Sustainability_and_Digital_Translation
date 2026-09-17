(function () {
  window.Game = window.Game || {};

  function dots(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += "<i></i>";
    return '<span class="bridge-dots">' + s + "</span>";
  }

  Game.BrainBridge = {
    title: "修橋鋪板 · 承重配對",
    type: "brain",
    p1hint: "點擊石堆中的橋板，放到左半（藍色）對應承重的橋墩",
    p2hint: "←→ 選擇、空白鍵放置到右半（橘色）的橋墩",
    clearMsg: "橋板嚴絲合縫，平安踏上對岸！",

    mount: function (ctx) {
      var need = Game.shuffle([1, 2, 3, 4, 5, 6]);
      var pool = Game.shuffle([1, 2, 3, 4, 5, 6]);
      var placed = [false, false, false, false, false, false];
      var usedPool = {};
      var wrong = 0;
      var solved = false;
      var cursor = 0;

      function emptyPoolIndexes() {
        var out = [];
        for (var i = 0; i < pool.length; i++) if (!usedPool[i]) out.push(i);
        return out;
      }

      ctx.body.innerHTML =
        '<div class="bridge-wrap" id="bridge-wrap"></div>' +
        '<div class="level-note" id="bridge-note">橋墩上的圓點是「承重需求」，點數相符的橋板才能放上去！</div>';

      var wrap = Game.$("#bridge-wrap");
      var note = Game.$("#bridge-note");

      function draw() {
        var slotHtml = need
          .map(function (n, i) {
            var owner = i <= 2 ? "owner1" : "owner2";
            var cls = "bridge-slot " + owner + (placed[i] ? " filled" : "");
            return (
              '<div class="' + cls + '" data-slot="' + i + '">' +
              '<span class="bridge-slot-idx">' + (i + 1) + "</span>" +
              (placed[i] ? '<span class="bridge-plank">' + n + "</span>" : dots(n)) +
              "</div>"
            );
          })
          .join("");

        var poolHtml = pool
          .map(function (n, i) {
            var cls = "plank" + (usedPool[i] ? " used" : "");
            if (!usedPool[i] && emptyPoolIndexes()[cursor] === i) cls += " cursor";
            return '<div class="' + cls + '" data-pool="' + i + '">' + n + "</div>";
          })
          .join("");

        wrap.innerHTML =
          '<div class="bridge-label">橋墩（左 3 座：玩家1　右 3 座：玩家2）</div>' +
          '<div class="bridge-row">' + slotHtml + "</div>" +
          '<div class="bridge-label" style="margin-top:14px">橋板石堆（共用）</div>' +
          '<div class="bridge-row pool">' + poolHtml + "</div>";
        if (emptyPoolIndexes()[cursor] === undefined && emptyPoolIndexes().length) cursor = 0;
      }

      function tryPlace(plankNum, who) {
        var target = -1;
        for (var i = 0; i < need.length; i++) {
          if (placed[i]) continue;
          var owner = i <= 2 ? 1 : 2;
          if (owner !== who) continue;
          if (need[i] === plankNum) { target = i; break; }
        }
        if (target === -1) {
          Game.Audio.wrong();
          wrong++;
          ctx.addTime(-2);
          note.textContent = who === 1 ? "這塊橋板放不上玩家1的橋墩…（-2 秒）" : "這塊橋板不屬於玩家2的橋墩…（-2 秒）";
          return false;
        }
        return target;
      }

      function place(plankNum, who, poolIdx) {
        var target = tryPlace(plankNum, who);
        if (target === -1) return;
        placed[target] = true;
        usedPool[poolIdx] = true;
        Game.Audio.thud();
        note.textContent = "咚！橋板卡進第 " + (target + 1) + " 號橋墩。";
        draw();
        if (placed.every(function (v) { return v; })) {
          solved = true;
          Game.Audio.correct();
          var rem = ctx.ui.remaining();
          var score = 90 + Math.floor(rem * 3) - wrong * 4;
          if (score < 20) score = 20;
          window.setTimeout(function () { ctx.win(score, wrong === 0); }, 350);
        }
      }

      function onPointer(e) {
        if (solved) return;
        var plank = e.target.closest ? e.target.closest(".plank") : null;
        if (!plank) return;
        var idx = parseInt(plank.getAttribute("data-pool"), 10);
        if (usedPool[idx]) return;
        place(pool[idx], 1, idx);
      }

      function onKey(e) {
        if (solved) return;
        var code = e.code;
        if (code === "ArrowLeft" || code === "ArrowRight" || code === "Space") {
          e.preventDefault();
        } else {
          return;
        }
        if (e.repeat) return;
        var empties = emptyPoolIndexes();
        if (!empties.length) return;
        if (code === "ArrowLeft") { cursor = (cursor - 1 + empties.length) % empties.length; Game.Audio.click(); }
        else if (code === "ArrowRight") { cursor = (cursor + 1) % empties.length; Game.Audio.click(); }
        else if (code === "Space") {
          var idx = empties[cursor];
          place(pool[idx], 2, idx);
        }
        draw();
      }

      wrap.addEventListener("click", onPointer);
      window.addEventListener("keydown", onKey);
      draw();

      return {
        destroy: function () {
          wrap.removeEventListener("click", onPointer);
          window.removeEventListener("keydown", onKey);
        }
      };
    }
  };
})();