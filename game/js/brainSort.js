(function () {
  window.Game = window.Game || {};

  Game.BrainSort = {
    title: "灌溉節牌 · 排列順序",
    type: "brain",
    p1hint: "點選兩張上排節牌交換位置",
    p2hint: "←→ 移動、空白鍵選取與交換下排節牌",
    clearMsg: "節牌歸位，渠水嘩啦啦地流進田裡！",

    mount: function (ctx) {
      var top = Game.shuffle([1, 2, 3, 4, 5, 6]);
      var bottom = Game.shuffle([7, 8, 9, 10, 11, 12]);
      var selTop = -1;
      var selBottom = -1;
      var cursor = 0;
      var solved = false;
      var moves = 0;

      ctx.body.innerHTML =
        '<div class="sort-wrap" id="sort-wrap"></div>' +
        '<div class="level-note" id="sort-note">上排請排成 1～6、下排排成 7～12（由左到右）。</div>';

      var wrap = Game.$("#sort-wrap");
      var note = Game.$("#sort-note");

      function sorted(arr, start) {
        for (var i = 0; i < arr.length; i++) {
          if (arr[i] !== start + i) return false;
        }
        return true;
      }

      function draw() {
        var topHtml = top
          .map(function (n, i) {
            var cls = "sort-tile";
            if (selTop === i) cls += " selected";
            if (sorted(top, 1) && top[i] === i + 1) cls += " fixed";
            return '<div class="' + cls + '" data-row="top" data-i="' + i + '">' + n + "</div>";
          })
          .join("");
        var bottomHtml = bottom
          .map(function (n, i) {
            var cls = "sort-tile";
            if (selBottom === i) cls += " selected";
            if (sorted(bottom, 7) && bottom[i] === i + 7) cls += " fixed";
            if (cursor === i) cls += " cursor";
            return '<div class="' + cls + '" data-row="bottom" data-i="' + i + '">' + n + "</div>";
          })
          .join("");
        wrap.innerHTML =
          '<div class="sort-label p1-label">玩家1 · 上排</div>' +
          '<div class="sort-row" data-row="top">' + topHtml + "</div>" +
          '<div class="sort-label p2-label">玩家2 · 下排</div>' +
          '<div class="sort-row" data-row="bottom">' + bottomHtml + "</div>";
      }

      function checkWin() {
        if (solved) return;
        if (sorted(top, 1) && sorted(bottom, 7)) {
          solved = true;
          Game.Audio.correct();
          var rem = ctx.ui.remaining();
          var score = 70 + Math.floor(rem * 3) - moves;
          if (score < 20) score = 20;
          window.setTimeout(function () { ctx.win(score, rem > 50); }, 350);
        }
      }

      function onPointer(e) {
        if (solved) return;
        var tile = e.target.closest ? e.target.closest(".sort-tile") : null;
        if (!tile) return;
        var row = tile.getAttribute("data-row");
        var i = parseInt(tile.getAttribute("data-i"), 10);
        if (row !== "top") {
          note.textContent = "下排是玩家2的區域，用 ←→ 移動、空白鍵交換！";
          Game.Audio.wrong();
          return;
        }
        if (selTop === -1) {
          selTop = i;
          Game.Audio.select();
        } else if (selTop === i) {
          selTop = -1;
          Game.Audio.click();
        } else {
          var t = top[selTop];
          top[selTop] = top[i];
          top[i] = t;
          selTop = -1;
          moves++;
          Game.Audio.select();
        }
        draw();
        checkWin();
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
        if (code === "ArrowLeft" && cursor > 0) cursor--;
        else if (code === "ArrowRight" && cursor < 5) cursor++;
        else if (code === "Space") {
          if (selBottom === -1) {
            selBottom = cursor;
            Game.Audio.select();
          } else if (selBottom === cursor) {
            selBottom = -1;
            Game.Audio.click();
          } else {
            var t = bottom[selBottom];
            bottom[selBottom] = bottom[cursor];
            bottom[cursor] = t;
            selBottom = -1;
            moves++;
            Game.Audio.select();
          }
        } else {
          return;
        }
        draw();
        checkWin();
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