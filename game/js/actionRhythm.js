(function () {
  window.Game = window.Game || {};

  Game.ActionRhythm = {
    title: "祭典祝禱鼓",
    type: "action",
    p1hint: "左鼓：F（左）／ J（右），音符到位時按下",
    p2hint: "右鼓：← （左）／ → （右），音符到位時按下",
    clearMsg: "鼓聲齊鳴，稻靈甦醒，祝福降臨！",

    mount: function (ctx) {
      var W = Game.Config.W;
      var H = Game.Config.H;
      var canvas = Game.createCanvas(ctx.body, W, H);
      var g = canvas.getContext("2d");
      var loop = Game.Loop(update, render);

      var lanes = [
        { x: 190, key: "KeyF", color: "#4e9fe8", track: 0, name: "F" },
        { x: 340, key: "KeyJ", color: "#4e9fe8", track: 0, name: "J" },
        { x: 620, key: "ArrowLeft", color: "#e8744e", track: 1, name: "←" },
        { x: 770, key: "ArrowRight", color: "#e8744e", track: 1, name: "→" }
      ];
      var hitY = H - 70;
      var target = 24;
      var hits = 0;
      var misses = 0;
      var combo = 0;
      var maxCombo = 0;
      var notes = [];
      var spawnAcc = 0;
      var flash = [0, 0, 0, 0];
      var pops = [];
      var solved = false;

      function noteSpeed() {
        return 250 + hits * 5;
      }

      function spawnInterval() {
        return Math.max(0.42, 0.82 - hits * 0.013);
      }

      function registerHit(lane) {
        var best = -1;
        var bestD = 1e9;
        for (var i = 0; i < notes.length; i++) {
          var n = notes[i];
          if (n.lane !== lane) continue;
          var d = Math.abs(n.y - hitY);
          if (d < 52 && d < bestD) { bestD = d; best = i; }
        }
        if (best === -1) {
          misses++;
          combo = 0;
          Game.Audio.wrong();
          return;
        }
        var note = notes[best];
        notes.splice(best, 1);
        hits++;
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        flash[lane] = 1;
        Game.Audio.drumHit();
        for (var k = 0; k < 8; k++) {
          var a = Math.random() * Math.PI * 2;
          pops.push({ x: lanes[lane].x, y: hitY, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140 - 40, life: 0.45, max: 0.45, color: lanes[lane].color });
        }
        ctx.setScore(hits + " / " + target);
        if (hits >= target && !solved) {
          solved = true;
          loop.stop();
          var rem = ctx.ui.remaining();
          var score = 100 + Math.floor(rem * 2) + maxCombo * 2 - misses * 2;
          if (score < 30) score = 30;
          window.setTimeout(function () { ctx.win(score, misses <= 2); }, 300);
        }
      }

      function update(dt) {
        if (solved) return;
        spawnAcc += dt;
        if (spawnAcc > spawnInterval()) {
          spawnAcc = 0;
          var lane = Game.randInt(0, 3);
          notes.push({ lane: lane, y: -20 });
        }
        var sp = noteSpeed();
        for (var i = notes.length - 1; i >= 0; i--) {
          var n = notes[i];
          n.y += sp * dt;
          if (n.y > hitY + 54) {
            notes.splice(i, 1);
            misses++;
            combo = 0;
            Game.Audio.wrong();
          }
        }
        for (var f = 0; f < 4; f++) flash[f] = Math.max(0, flash[f] - dt * 3);

        var buf = Game.Input.takeBuffer();
        for (var b = 0; b < buf.length; b++) {
          for (var l = 0; l < 4; l++) {
            if (buf[b] === lanes[l].key) registerHit(l);
          }
        }

        for (var p = pops.length - 1; p >= 0; p--) {
          var pt = pops[p];
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 300 * dt;
          if (pt.life <= 0) pops.splice(p, 1);
        }
      }

      function drawTrack(track, color, label) {
        var x0 = track === 0 ? 120 : 550;
        var x1 = track === 0 ? 410 : 840;
        g.fillStyle = "rgba(0,0,0,0.18)";
        g.fillRect(x0, 30, x1 - x0, H - 40);
        g.strokeStyle = color;
        g.lineWidth = 2;
        g.strokeRect(x0, 30, x1 - x0, H - 40);
        g.fillStyle = "rgba(255,255,255,0.6)";
        g.font = "bold 18px 'Noto Sans TC', sans-serif";
        g.fillText(label, x0 + 8, 52);
      }

      function render() {
        var bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#2b3a55");
        bg.addColorStop(1, "#5a3a2a");
        g.fillStyle = bg;
        g.fillRect(0, 0, W, H);

        drawTrack(0, "#4e9fe8", "玩家1 · 左鼓");
        drawTrack(1, "#e8744e", "玩家2 · 右鼓");

        g.strokeStyle = "rgba(255,224,138,0.9)";
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(120, hitY);
        g.lineTo(840, hitY);
        g.stroke();

        for (var l = 0; l < 4; l++) {
          var lane = lanes[l];
          g.globalAlpha = 0.25 + flash[l] * 0.6;
          g.fillStyle = lane.color;
          g.beginPath();
          g.arc(lane.x, hitY, 26 + flash[l] * 12, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
          g.fillStyle = "rgba(255,255,255,0.85)";
          g.font = "bold 16px 'Noto Sans TC', sans-serif";
          g.textAlign = "center";
          g.fillText(lane.name, lane.x, hitY + 48);
          g.textAlign = "left";
        }

        notes.forEach(function (n) {
          var lane = lanes[n.lane];
          g.fillStyle = lane.color;
          g.beginPath();
          g.arc(lane.x, n.y, 22, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = "#ffe08a";
          g.lineWidth = 3;
          g.stroke();
          g.fillStyle = "#fff";
          g.beginPath();
          g.arc(lane.x, n.y, 8, 0, Math.PI * 2);
          g.fill();
        });

        pops.forEach(function (p) {
          g.globalAlpha = Math.max(0, p.life / p.max);
          g.fillStyle = p.color;
          g.beginPath();
          g.arc(p.x, p.y, 5, 0, Math.PI * 2);
          g.fill();
        });
        g.globalAlpha = 1;

        g.textAlign = "center";
        g.fillStyle = "#ffe08a";
        g.font = "bold 26px 'Noto Sans TC', sans-serif";
        g.fillText("Combo x" + combo, W / 2, 50);
        g.fillStyle = "#fff";
        g.font = "bold 18px 'Noto Sans TC', sans-serif";
        g.fillText("已敲響 " + hits + " / " + target + "　失誤 " + misses, W / 2, H - 14);
        g.textAlign = "left";
      }

      loop.start();
      ctx.setScore(hits + " / " + target);

      return {
        destroy: function () {
          loop.stop();
        }
      };
    }
  };
})();