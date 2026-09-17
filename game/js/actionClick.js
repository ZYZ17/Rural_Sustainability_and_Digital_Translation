(function () {
  window.Game = window.Game || {};

  Game.ActionClick = {
    title: "驅散蝗蟲",
    type: "action",
    p1hint: "滑鼠點擊左半場的蝗蟲",
    p2hint: "方向鍵移動準星、空白鍵擊打右半場的蝗蟲",
    clearMsg: "蝗蟲全數逃散，稻田保住了！",

    mount: function (ctx) {
      var W = Game.Config.W;
      var H = Game.Config.H;
      var canvas = Game.createCanvas(ctx.body, W, H);
      var g = canvas.getContext("2d");
      var loop = Game.Loop(update, render);

      var hoppers = [];
      var particles = [];
      var spawnAcc = [0, 0];
      var target = 20;
      var hits = 0;
      var misses = 0;
      var solved = false;
      var cursor = { x: 720, y: 280 };

      var bounds = [
        { x0: 40, x1: 460 },
        { x0: 500, x1: 920 }
      ];

      function spawn(side) {
        var b = bounds[side];
        hoppers.push({
          side: side,
          x: Game.rand(b.x0, b.x1),
          y: Game.rand(90, 430),
          r: 20,
          vx: Game.rand(-90, 90),
          vy: Game.rand(-60, 60),
          life: Game.rand(2.4, 3.8),
          age: 0
        });
      }

      function countSide(side) {
        return hoppers.filter(function (h) { return h.side === side; }).length;
      }

      function burst(x, y, color) {
        for (var i = 0; i < 12; i++) {
          var a = Math.random() * Math.PI * 2;
          var s = Game.rand(60, 220);
          particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, max: 0.6, color: color });
        }
      }

      function attempt(x, y, side) {
        if (solved) return;
        var best = -1;
        var bestD = 1e9;
        for (var i = 0; i < hoppers.length; i++) {
          var h = hoppers[i];
          if (h.side !== side) continue;
          var d = Math.sqrt((x - h.x) * (x - h.x) + (y - h.y) * (y - h.y));
          if (d <= h.r + 12 && d < bestD) { bestD = d; best = i; }
        }
        if (best === -1) {
          misses++;
          ctx.addTime(-1);
          Game.Audio.wrong();
          burst(x, y, "#d9534f");
          return;
        }
        var hopper = hoppers[best];
        burst(hopper.x, hopper.y, "#7ec850");
        hoppers.splice(best, 1);
        hits++;
        ctx.setScore(hits + " / " + target);
        Game.Audio.hit();
        if (hits >= target && !solved) {
          solved = true;
          loop.stop();
          var rem = ctx.ui.remaining();
          var score = 100 + Math.floor(rem * 2) - misses * 2;
          if (score < 30) score = 30;
          window.setTimeout(function () { ctx.win(score, misses === 0); }, 300);
        }
      }

      function onPointer(e) {
        var p = Game.pointerPos(canvas, e);
        if (p.x < W / 2) {
          attempt(p.x, p.y, 0);
        } else {
          ctx.ui.setHints("🖱️ 左半場是玩家1的！", "⌨️ 右半場交給玩家2，用方向鍵＋空白！");
          Game.Audio.wrong();
        }
      }

      function update(dt) {
        if (solved) return;
        for (var s = 0; s < 2; s++) {
          spawnAcc[s] += dt;
          if (spawnAcc[s] > 0.55 && countSide(s) < 5) {
            spawnAcc[s] = 0;
            spawn(s);
          }
        }
        for (var i = hoppers.length - 1; i >= 0; i--) {
          var h = hoppers[i];
          h.age += dt;
          h.life -= dt;
          if (Math.random() < 0.02) { h.vx += Game.rand(-60, 60); h.vy += Game.rand(-40, 40); }
          h.vx = Math.max(-160, Math.min(160, h.vx));
          h.vy = Math.max(-120, Math.min(120, h.vy));
          h.x += h.vx * dt;
          h.y += h.vy * dt;
          var b = bounds[h.side];
          if (h.x < b.x0) { h.x = b.x0; h.vx *= -1; }
          if (h.x > b.x1) { h.x = b.x1; h.vx *= -1; }
          if (h.y < 80) { h.y = 80; h.vy *= -1; }
          if (h.y > 440) { h.y = 440; h.vy *= -1; }
          if (h.life <= 0) hoppers.splice(i, 1);
        }
        for (var p = particles.length - 1; p >= 0; p--) {
          var pt = particles[p];
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 300 * dt;
          if (pt.life <= 0) particles.splice(p, 1);
        }

        var buf = Game.Input.takeBuffer();
        for (var k = 0; k < buf.length; k++) {
          if (buf[k] === "Space") attempt(cursor.x, cursor.y, 1);
        }
        var speed = 430;
        if (Game.Input.isDown("ArrowLeft")) cursor.x -= speed * dt;
        if (Game.Input.isDown("ArrowRight")) cursor.x += speed * dt;
        if (Game.Input.isDown("ArrowUp")) cursor.y -= speed * dt;
        if (Game.Input.isDown("ArrowDown")) cursor.y += speed * dt;
        cursor.x = Math.max(500, Math.min(940, cursor.x));
        cursor.y = Math.max(80, Math.min(460, cursor.y));
      }

      function drawHopper(h) {
        var wobble = Math.sin(h.age * 22) * 4;
        g.save();
        g.translate(h.x, h.y);
        g.rotate(h.vx * 0.002);
        g.fillStyle = "#5aa03a";
        g.beginPath();
        g.ellipse(0, 0, h.r + 6, h.r - 4 + wobble * 0.3, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#3f7528";
        g.beginPath();
        g.ellipse(-4, 0, h.r * 0.7, h.r * 0.55, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#2c4f1b";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(h.r * 0.5, -4);
        g.lineTo(h.r * 1.3, -10);
        g.moveTo(h.r * 0.5, 4);
        g.lineTo(h.r * 1.3, 10);
        g.stroke();
        g.fillStyle = "#1d1d1d";
        g.beginPath();
        g.arc(h.r * 0.75, -3, 2.4, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }

      function render() {
        var sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#cfeaa8");
        sky.addColorStop(1, "#8fc25a");
        g.fillStyle = sky;
        g.fillRect(0, 0, W, H);

        g.fillStyle = "rgba(120, 180, 70, 0.5)";
        for (var i = 0; i < W; i += 40) {
          g.fillRect(i, H - 60 + Math.sin(i) * 6, 20, 40);
        }

        g.strokeStyle = "rgba(255,255,255,0.7)";
        g.lineWidth = 3;
        g.setLineDash([12, 10]);
        g.beginPath();
        g.moveTo(W / 2, 40);
        g.lineTo(W / 2, H);
        g.stroke();
        g.setLineDash([]);

        g.font = "bold 20px 'Noto Sans TC', sans-serif";
        g.fillStyle = "rgba(30,80,160,0.85)";
        g.fillText("玩家1 區", 20, 34);
        g.fillStyle = "rgba(190,80,40,0.9)";
        g.fillText("玩家2 區", W - 120, 34);

        hoppers.forEach(drawHopper);

        particles.forEach(function (p) {
          g.globalAlpha = Math.max(0, p.life / p.max);
          g.fillStyle = p.color;
          g.beginPath();
          g.arc(p.x, p.y, 5, 0, Math.PI * 2);
          g.fill();
        });
        g.globalAlpha = 1;

        g.strokeStyle = "#ff8c3c";
        g.lineWidth = 3;
        g.beginPath();
        g.arc(cursor.x, cursor.y, 18, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.moveTo(cursor.x - 26, cursor.y);
        g.lineTo(cursor.x - 8, cursor.y);
        g.moveTo(cursor.x + 8, cursor.y);
        g.lineTo(cursor.x + 26, cursor.y);
        g.moveTo(cursor.x, cursor.y - 26);
        g.lineTo(cursor.x, cursor.y - 8);
        g.moveTo(cursor.x, cursor.y + 8);
        g.lineTo(cursor.x, cursor.y + 26);
        g.stroke();

        g.fillStyle = "rgba(0,0,0,0.55)";
        g.fillRect(W / 2 - 70, 8, 140, 30);
        g.fillStyle = "#ffe08a";
        g.font = "bold 18px 'Noto Sans TC', sans-serif";
        g.textAlign = "center";
        g.fillText("擊退 " + hits + " / " + target, W / 2, 30);
        g.textAlign = "left";
      }

      canvas.addEventListener("pointerdown", onPointer);
      loop.start();
      ctx.setScore(hits + " / " + target);

      return {
        destroy: function () {
          loop.stop();
          canvas.removeEventListener("pointerdown", onPointer);
        }
      };
    }
  };
})();