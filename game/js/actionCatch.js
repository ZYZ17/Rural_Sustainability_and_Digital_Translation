(function () {
  window.Game = window.Game || {};

  Game.ActionCatch = {
    title: "採收百果",
    type: "action",
    p1hint: "滑鼠左右移動左邊的果籃",
    p2hint: "← → 移動右邊的果籃",
    clearMsg: "籃子滿滿金黃，這季大豐收！",

    mount: function (ctx) {
      var W = Game.Config.W;
      var H = Game.Config.H;
      var canvas = Game.createCanvas(ctx.body, W, H);
      var g = canvas.getContext("2d");
      var loop = Game.Loop(update, render);

      var target = 20;
      var good = 0;
      var bad = 0;
      var solved = false;

      var baskets = {
        0: { x: 240, y: 468, w: 120, h: 26 },
        1: { x: 720, y: 468, w: 120, h: 26 }
      };
      var ranges = {
        0: { x0: 70, x1: 470 },
        1: { x0: 490, x1: 890 }
      };

      var items = [];
      var pops = [];
      var spawnAcc = [0, 0];

      function spawn(side) {
        var r = ranges[side];
        var isBad = Math.random() < 0.32;
        items.push({
          side: side,
          x: Game.rand(r.x0 + 20, r.x1 - 20),
          y: -20,
          vy: Game.rand(170, 240),
          r: 15,
          bad: isBad,
          spin: Math.random() * Math.PI
        });
      }

      function pop(x, y, color) {
        for (var i = 0; i < 8; i++) {
          var a = Math.random() * Math.PI * 2;
          pops.push({ x: x, y: y, vx: Math.cos(a) * 120, vy: -Math.abs(Math.sin(a) * 120) - 40, life: 0.5, max: 0.5, color: color });
        }
      }

      function onPointer(e) {
        var p = Game.pointerPos(canvas, e);
        baskets[0].x = Math.max(ranges[0].x0, Math.min(ranges[0].x1, p.x));
      }

      function update(dt) {
        if (solved) return;
        for (var s = 0; s < 2; s++) {
          spawnAcc[s] += dt;
          if (spawnAcc[s] > 0.62) {
            spawnAcc[s] = 0;
            spawn(s);
          }
        }

        var speed = 520;
        if (Game.Input.isDown("ArrowLeft")) baskets[1].x -= speed * dt;
        if (Game.Input.isDown("ArrowRight")) baskets[1].x += speed * dt;
        baskets[1].x = Math.max(ranges[1].x0, Math.min(ranges[1].x1, baskets[1].x));
        Game.Input.takeBuffer();

        for (var i = items.length - 1; i >= 0; i--) {
          var it = items[i];
          it.y += it.vy * dt;
          it.spin += dt * 3;
          var b = baskets[it.side];
          if (it.y + it.r >= b.y && it.y < b.y + b.h + 10 && Math.abs(it.x - b.x) < b.w / 2 + 8) {
            items.splice(i, 1);
            if (it.bad) {
              bad++;
              ctx.addTime(-1);
              Game.Audio.thud();
              pop(it.x, it.y, "#8a5a2b");
            } else {
              good++;
              ctx.setScore(good + " / " + target);
              Game.Audio.catchSound();
              pop(it.x, it.y, "#ffd54f");
              if (good >= target && !solved) {
                solved = true;
                loop.stop();
                var rem = ctx.ui.remaining();
                var score = 100 + Math.floor(rem * 2) - bad * 3;
                if (score < 30) score = 30;
                window.setTimeout(function () { ctx.win(score, bad === 0); }, 300);
              }
            }
            continue;
          }
          if (it.y > H + 30) items.splice(i, 1);
        }

        for (var p = pops.length - 1; p >= 0; p--) {
          var pt = pops[p];
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 380 * dt;
          if (pt.life <= 0) pops.splice(p, 1);
        }
      }

      function drawBasket(b, color) {
        g.fillStyle = color;
        g.beginPath();
        g.moveTo(b.x - b.w / 2, b.y);
        g.lineTo(b.x + b.w / 2, b.y);
        g.lineTo(b.x + b.w / 2 - 14, b.y + b.h);
        g.lineTo(b.x - b.w / 2 + 14, b.y + b.h);
        g.closePath();
        g.fill();
        g.strokeStyle = "rgba(0,0,0,0.35)";
        g.lineWidth = 2;
        for (var i = 1; i < 5; i++) {
          var xx = b.x - b.w / 2 + (b.w / 5) * i;
          g.beginPath();
          g.moveTo(xx, b.y + 4);
          g.lineTo(xx - 6, b.y + b.h - 2);
          g.stroke();
        }
      }

      function drawItem(it) {
        g.save();
        g.translate(it.x, it.y);
        g.rotate(Math.sin(it.spin) * 0.3);
        if (it.bad) {
          g.fillStyle = "#7a5230";
          g.beginPath();
          g.arc(0, 0, it.r, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#4f3418";
          g.beginPath();
          g.arc(-4, -4, 4, 0, Math.PI * 2);
          g.arc(5, 2, 3, 0, Math.PI * 2);
          g.fill();
        } else {
          g.fillStyle = "#e8b93a";
          g.beginPath();
          g.arc(0, 0, it.r, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = "#a8791c";
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(0, -it.r + 2);
          g.lineTo(2, -it.r - 6);
          g.stroke();
          g.fillStyle = "#6fae3a";
          g.beginPath();
          g.ellipse(6, -it.r - 4, 7, 4, 0.4, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
      }

      function render() {
        var sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#dff1ff");
        sky.addColorStop(1, "#a9d98a");
        g.fillStyle = sky;
        g.fillRect(0, 0, W, H);

        g.fillStyle = "rgba(90,150,60,0.45)";
        g.fillRect(0, H - 40, W, 40);

        g.strokeStyle = "rgba(255,255,255,0.7)";
        g.lineWidth = 3;
        g.setLineDash([12, 10]);
        g.beginPath();
        g.moveTo(W / 2, 30);
        g.lineTo(W / 2, H);
        g.stroke();
        g.setLineDash([]);

        items.forEach(drawItem);
        drawBasket(baskets[0], "#4e9fe8");
        drawBasket(baskets[1], "#e8744e");

        g.font = "bold 20px 'Noto Sans TC', sans-serif";
        g.fillStyle = "rgba(30,80,160,0.9)";
        g.fillText("玩家1", 20, 34);
        g.fillStyle = "rgba(190,80,40,0.9)";
        g.fillText("玩家2", W - 100, 34);

        pops.forEach(function (p) {
          g.globalAlpha = Math.max(0, p.life / p.max);
          g.fillStyle = p.color;
          g.beginPath();
          g.arc(p.x, p.y, 4, 0, Math.PI * 2);
          g.fill();
        });
        g.globalAlpha = 1;

        g.fillStyle = "rgba(0,0,0,0.55)";
        g.fillRect(W / 2 - 90, 8, 180, 32);
        g.fillStyle = "#ffe08a";
        g.font = "bold 18px 'Noto Sans TC', sans-serif";
        g.textAlign = "center";
        g.fillText("採收 " + good + " / " + target + (bad ? "  ✖" + bad : ""), W / 2, 30);
        g.textAlign = "left";
      }

      canvas.addEventListener("pointermove", onPointer);
      loop.start();
      ctx.setScore(good + " / " + target);

      return {
        destroy: function () {
          loop.stop();
          canvas.removeEventListener("pointermove", onPointer);
        }
      };
    }
  };
})();