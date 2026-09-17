(function () {
  window.Game = window.Game || {};

  var VW = 460;
  var VH = 300;

  function cloud() {
    return (
      '<g fill="#ffffff" opacity="0.92">' +
      '<ellipse cx="175" cy="45" rx="30" ry="16"/>' +
      '<ellipse cx="205" cy="42" rx="26" ry="18"/>' +
      '<ellipse cx="235" cy="47" rx="24" ry="13"/>' +
      "</g>"
    );
  }

  function bird() {
    return (
      '<g stroke="#3b3b3b" stroke-width="3" fill="none" stroke-linecap="round">' +
      '<path d="M320 58 q10 -12 20 0"/>' +
      '<path d="M340 58 q10 -12 20 0"/>' +
      "</g>"
    );
  }

  function fruits(count) {
    var pts = [[138, 150], [156, 162], [150, 178]];
    var out = "";
    for (var i = 0; i < count; i++) {
      out += '<circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="6" fill="#e53935"/>';
    }
    return out;
  }

  function scene(modified) {
    return (
      '<svg class="spot-svg" viewBox="0 0 ' + VW + " " + VH + '" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="' + VW + '" height="' + VH + '" fill="#bfe6ff"/>' +
      '<rect x="0" y="205" width="' + VW + '" height="95" fill="#7bbf5a"/>' +
      '<circle cx="60" cy="45" r="27" fill="' + (modified ? "#ff9800" : "#ffd54f") + '"/>' +
      (modified ? "" : cloud()) +
      (modified ? bird() : "") +
      '<path d="M150 205 L280 95 L410 205 Z" fill="#6f9c53"/>' +
      '<path d="M270 105 L280 95 L292 108 Z" fill="#eef7ff"/>' +
      '<rect x="40" y="158" width="72" height="50" fill="#c8873f"/>' +
      '<path d="M32 158 L76 128 L120 158 Z" fill="#9c4a1f"/>' +
      '<rect x="70" y="182" width="16" height="26" fill="#6b4a22"/>' +
      '<ellipse cx="92" cy="262" rx="48" ry="16" fill="#4fa3d1"/>' +
      '<rect x="145" y="168" width="12" height="42" fill="#8a5a2b"/>' +
      '<circle cx="151" cy="162" r="31" fill="#4e8c3a"/>' +
      fruits(modified ? 2 : 3) +
      '<rect x="300" y="196" width="120" height="6" fill="#b08a4a"/>' +
      '<rect x="310" y="176" width="6" height="26" fill="#b08a4a"/>' +
      '<rect x="350" y="176" width="6" height="26" fill="#b08a4a"/>' +
      '<rect x="390" y="176" width="6" height="26" fill="#b08a4a"/>' +
      '<line x1="330" y1="240" x2="330" y2="268" stroke="#3f7a2e" stroke-width="4"/>' +
      '<circle cx="330" cy="234" r="10" fill="' + (modified ? "#9c27b0" : "#e53935") + '"/>' +
      '<circle cx="330" cy="234" r="4" fill="#ffe08a"/>' +
      '<g class="marks"></g>' +
      "</svg>"
    );
  }

  Game.BrainSpot = {
    title: "尋回祭堂法器 · 找不同",
    type: "brain",
    p1hint: "滑鼠點擊「右圖上半」的 3 處差異",
    p2hint: "方向鍵移動、空白鍵點擊「右圖下半」的 2 處差異",
    clearMsg: "五處機關全數破解，法器重見天日！",

    mount: function (ctx) {
      var diffs = [
        { id: "sun", x: 60, y: 45, r: 42, half: "top" },
        { id: "cloud", x: 195, y: 44, r: 46, half: "top" },
        { id: "bird", x: 330, y: 58, r: 44, half: "top" },
        { id: "fruit", x: 148, y: 162, r: 44, half: "bottom" },
        { id: "flower", x: 330, y: 236, r: 34, half: "bottom" }
      ];
      var found = {};
      var solved = false;
      var wrong = 0;
      var cursor = { x: 330, y: 240 };

      ctx.body.innerHTML =
        '<div class="spot-wrap">' +
        '<div class="spot-col"><div class="spot-cap">原始圖</div>' + scene(false) + "</div>" +
        '<div class="spot-col"><div class="spot-cap">被動手腳的圖</div>' + scene(true) + "</div>" +
        "</div>" +
        '<div class="level-note" id="spot-note">比對兩圖，找出 5 處不同！上方差異由玩家1負責、下方由玩家2負責。</div>';

      var note = Game.$("#spot-note");
      var rightSvg = Game.$$(".spot-col")[1].querySelector("svg");
      var marks = rightSvg.querySelector(".marks");
      var leftSvg = Game.$$(".spot-col")[0].querySelector("svg");
      var leftMarks = leftSvg.querySelector(".marks");

      function renderMarks() {
        var html = "";
        diffs.forEach(function (d) {
          if (found[d.id]) html += '<circle cx="' + d.x + '" cy="' + d.y + '" r="' + (d.r * 0.85) + '" fill="none" stroke="#7ec850" stroke-width="4" stroke-dasharray="8 6"/>';
        });
        html += '<circle cx="' + cursor.x + '" cy="' + cursor.y + '" r="15" fill="rgba(255,140,60,0.25)" stroke="#ff8c3c" stroke-width="3" stroke-dasharray="5 4"/>';
        marks.innerHTML = html;
        leftMarks.innerHTML = diffs
          .filter(function (d) { return found[d.id]; })
          .map(function (d) {
            return '<circle cx="' + d.x + '" cy="' + d.y + '" r="' + (d.r * 0.85) + '" fill="none" stroke="#7ec850" stroke-width="4" stroke-dasharray="8 6"/>';
          })
          .join("");
      }

      function toScene(evt) {
        var r = rightSvg.getBoundingClientRect();
        return {
          x: (evt.clientX - r.left) * (VW / r.width),
          y: (evt.clientY - r.top) * (VH / r.height)
        };
      }

      function attempt(x, y, who) {
        if (solved) return;
        var hit = null;
        for (var i = 0; i < diffs.length; i++) {
          var d = diffs[i];
          if (found[d.id]) continue;
          var dist = Math.sqrt((x - d.x) * (x - d.x) + (y - d.y) * (y - d.y));
          if (dist <= d.r) { hit = d; break; }
        }
        if (!hit) {
          Game.Audio.wrong();
          wrong++;
          ctx.addTime(-1);
          note.textContent = "這裡沒有差異…（-1 秒）";
          return;
        }
        var wantWho = hit.half === "top" ? 1 : 2;
        if (who !== wantWho) {
          Game.Audio.wrong();
          note.textContent = hit.half === "top" ? "這處在上方，交給玩家1用滑鼠點！" : "這處在下方，交給玩家2用鍵盤點！";
          return;
        }
        found[hit.id] = true;
        Game.Audio.correct();
        note.textContent = "找到了！還剩 " + (5 - Object.keys(found).length) + " 處。";
        renderMarks();
        if (Object.keys(found).length === 5) {
          solved = true;
          var rem = ctx.ui.remaining();
          var score = 80 + Math.floor(rem * 3) - wrong * 3;
          if (score < 20) score = 20;
          window.setTimeout(function () { ctx.win(score, wrong === 0); }, 350);
        }
      }

      function onPointer(evt) {
        if (solved) return;
        var p = toScene(evt);
        if (p.y < 150) {
          attempt(p.x, p.y, 1);
        } else {
          note.textContent = "下半部請玩家2用方向鍵＋空白鍵來點！";
          Game.Audio.wrong();
        }
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
        var step = 14;
        if (code === "ArrowLeft") cursor.x = Math.max(12, cursor.x - step);
        else if (code === "ArrowRight") cursor.x = Math.min(VW - 12, cursor.x + step);
        else if (code === "ArrowUp") cursor.y = Math.max(156, cursor.y - step);
        else if (code === "ArrowDown") cursor.y = Math.min(VH - 8, cursor.y + step);
        else if (code === "Space") {
          attempt(cursor.x, cursor.y, 2);
          return;
        }
        renderMarks();
      }

      rightSvg.addEventListener("pointerdown", onPointer);
      window.addEventListener("keydown", onKey);
      renderMarks();

      return {
        destroy: function () {
          rightSvg.removeEventListener("pointerdown", onPointer);
          window.removeEventListener("keydown", onKey);
        }
      };
    }
  };
})();