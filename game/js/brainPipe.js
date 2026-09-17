(function () {
  window.Game = window.Game || {};

  var COLS = 6;
  var ROWS = 4;
  var H = [0, 1, 0, 1];
  var V = [1, 0, 1, 0];
  var SE = [0, 1, 1, 0];
  var NW = [1, 0, 0, 1];
  var WS = [0, 0, 1, 1];
  var NE = [1, 1, 0, 0];

  function rotate(c) {
    return [c[3], c[0], c[1], c[2]];
  }

  function effective(cell) {
    var c = cell.conns;
    for (var i = 0; i < cell.rot; i++) c = rotate(c);
    return c;
  }

  function drawSvg(cell) {
    var c = effective(cell);
    var cx = 25;
    var cy = 25;
    var seg = "";
    if (c[0]) seg += '<line x1="25" y1="25" x2="25" y2="0"/>';
    if (c[1]) seg += '<line x1="25" y1="25" x2="50" y2="25"/>';
    if (c[2]) seg += '<line x1="25" y1="25" x2="25" y2="50"/>';
    if (c[3]) seg += '<line x1="25" y1="25" x2="0" y2="25"/>';
    return (
      '<svg viewBox="0 0 50 50" preserveAspectRatio="none">' +
      '<g fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round">' +
      seg +
      '<circle cx="25" cy="25" r="7" fill="currentColor" stroke="none"/>' +
      "</g></svg>"
    );
  }

  function buildGrid() {
    var grid = [];
    var base = [
      [V, V, V, V, V, V],
      [V, SE, H, WS, V, V],
      [null, NW, V, NE, H, null],
      [V, V, V, V, V, V]
    ];
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (var c = 0; c < COLS; c++) {
        var conns = base[r][c];
        var cell = { conns: conns || V, rot: 0, fixed: false };
        if (r === 2 && c === 0) { cell.conns = [0, 1, 0, 0]; cell.fixed = true; }
        if (r === 2 && c === 5) { cell.conns = [0, 0, 0, 1]; cell.fixed = true; }
        grid[r][c] = cell;
      }
    }
    return grid;
  }

  function resetRotations(grid) {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = grid[r][c];
        if (!cell.fixed) cell.rot = Game.randInt(0, 3);
      }
    }
  }

  function waterSet(grid) {
    var wet = {};
    var stack = [[0, 2]];
    wet["0,2"] = true;
    while (stack.length) {
      var cur = stack.pop();
      var r = cur[0], c = cur[1];
      var conns = effective(grid[r][c]);
      var neighbors = [
        [r - 1, c, 0, 2],
        [r, c + 1, 1, 3],
        [r + 1, c, 2, 0],
        [r, c - 1, 3, 1]
      ];
      for (var i = 0; i < neighbors.length; i++) {
        var nr = neighbors[i][0], nc = neighbors[i][1];
        if (!conns[neighbors[i][2]]) continue;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        var ncell = grid[nr][nc];
        if (!effective(ncell)[neighbors[i][3]]) continue;
        var key = nr + "," + nc;
        if (wet[key]) continue;
        wet[key] = true;
        stack.push([nr, nc]);
      }
    }
    return wet;
  }

  Game.BrainPipe = {
    title: "水管旋轉 · 修復水車",
    type: "brain",
    p1hint: "點擊左半（左三排）的水管旋轉",
    p2hint: "方向鍵移動、空白鍵旋轉右半的水管",
    clearMsg: "水流暢通！水車開始轉動了！",

    mount: function (ctx) {
      var grid = buildGrid();
      var solved = false;
      var bailed = 0;

      do {
        resetRotations(grid);
        bailed++;
      } while (waterSet(grid)["2,5"] && bailed < 60);

      ctx.body.innerHTML =
        '<div class="pipe-grid" id="pipe-grid"></div>' +
        '<div class="level-note" id="pipe-note">讓水從左側的水車（藍色入口）流到右側的出口！</div>';

      var gridEl = Game.$("#pipe-grid");
      var noteEl = Game.$("#pipe-note");
      var cursor = { r: 2, c: 4 };
      var cells = [];

      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var el = document.createElement("div");
          el.className = "pipe-cell";
          el.setAttribute("data-r", r);
          el.setAttribute("data-c", c);
          el.innerHTML = drawSvg(grid[r][c]);
          gridEl.appendChild(el);
          cells.push(el);
        }
      }

      function cellAt(r, c) {
        return cells[r * COLS + c];
      }

      function paint() {
        var wet = waterSet(grid);
        for (var r = 0; r < ROWS; r++) {
          for (var c = 0; c < COLS; c++) {
            var cell = cellAt(r, c);
            cell.classList.toggle("wet", !!wet[r + "," + c]);
            cell.classList.toggle("cursor", cursor.r === r && cursor.c === c);
            cell.classList.toggle("left", c <= 2);
          }
        }
      }

      function redraw(r, c) {
        cellAt(r, c).innerHTML = drawSvg(grid[r][c]);
      }

      function checkWin() {
        if (solved) return;
        if (waterSet(grid)["2,5"]) {
          solved = true;
          Game.Audio.correct();
          var rem = ctx.ui.remaining();
          var score = 60 + Math.floor(rem * 3);
          window.setTimeout(function () { ctx.win(score, rem > 45); }, 350);
        }
      }

      function rotateCell(r, c) {
        var cell = grid[r][c];
        if (cell.fixed) {
          Game.Audio.wrong();
          return;
        }
        cell.rot = (cell.rot + 1) % 4;
        Game.Audio.click();
        redraw(r, c);
        paint();
        checkWin();
      }

      function onPointer(e) {
        if (solved) return;
        var cell = e.target.closest ? e.target.closest(".pipe-cell") : null;
        if (!cell) return;
        var r = parseInt(cell.getAttribute("data-r"), 10);
        var c = parseInt(cell.getAttribute("data-c"), 10);
        if (c > 2) {
          noteEl.textContent = "右半是玩家2的區域，用方向鍵＋空白鍵旋轉！";
          Game.Audio.wrong();
          return;
        }
        rotateCell(r, c);
      }

      function onKey(e) {
        if (solved) return;
        var code = e.code;
        if (code === "ArrowLeft" || code === "ArrowRight" || code === "ArrowUp" || code === "ArrowDown" || code === "Space") {
          e.preventDefault();
        } else {
          return;
        }
        if (e.repeat) return;
        if (code === "ArrowLeft" && cursor.c > 3) cursor.c--;
        else if (code === "ArrowRight" && cursor.c < 5) cursor.c++;
        else if (code === "ArrowUp" && cursor.r > 0) cursor.r--;
        else if (code === "ArrowDown" && cursor.r < ROWS - 1) cursor.r++;
        else if (code === "Space") {
          rotateCell(cursor.r, cursor.c);
          return;
        }
        Game.Audio.click();
        paint();
      }

      gridEl.addEventListener("click", onPointer);
      window.addEventListener("keydown", onKey);
      paint();

      return {
        destroy: function () {
          gridEl.removeEventListener("click", onPointer);
          window.removeEventListener("keydown", onKey);
        }
      };
    }
  };
})();