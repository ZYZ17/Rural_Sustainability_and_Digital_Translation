(function () {
  window.Game = window.Game || {};

  Game.ActionThrow = {
    title: "默契投石器",
    type: "action",
    p1hint: "滑鼠拖曳調整投擲角度與力道",
    p2hint: "按下空白鍵發射（等玩家1喊「可以」！）",
    clearMsg: "默契滿分！野獸落荒而逃，泉眼重見天日！",

    mount: function (ctx) {
      var W = Game.Config.W;
      var H = Game.Config.H;
      var canvas = Game.createCanvas(ctx.body, W, H);
      var g = canvas.getContext("2d");
      var loop = Game.Loop(update, render);

      var L = { x: 130, y: 452 };
      var aim = { angle: -0.72, power: 560 };
      var GRAV = 900;
      var projectiles = [];
      var particles = [];
      var target = 3;
      var hits = 0;
      var misses = 0;
      var cooldown = 0;
      var solved = false;

      var beast = { x: 780, y: 430, dir: -1, speed: 90, r: 34 };

      function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

      function onMove(e) {
        var p = Game.pointerPos(canvas, e);
        var dx = p.x - L.x;
        var dy = p.y - L.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 50) return;
        var ang = Math.atan2(dy, dx);
        aim.angle = clamp(ang, -Math.PI + 0.25, -0.12);
        aim.power = clamp(dist * 1.55, 340, 760);
      }

      function fire() {
        if (solved || cooldown > 0) return;
        cooldown = 0.35;
        var vx = Math.cos(aim.angle) * aim.power;
        var vy = Math.sin(aim.angle) * aim.power;
        projectiles.push({ x: L.x, y: L.y, vx: vx, vy: vy, r: 9, trail: [] });
        Game.Audio.rock();
      }

      function burst(x, y, color) {
        for (var i = 0; i < 16; i++) {
          var a = Math.random() * Math.PI * 2;
          var s = Game.rand(80, 260);
          particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.7, max: 0.7, color: color });
        }
      }

      function update(dt) {
        if (solved) return;
        cooldown = Math.max(0, cooldown - dt);

        beast.x += beast.dir * beast.speed * dt;
        if (beast.x < 600) { beast.x = 600; beast.dir = 1; }
        if (beast.x > 900) { beast.x = 900; beast.dir = -1; }

        var buf = Game.Input.takeBuffer();
        for (var i = 0; i < buf.length; i++) {
          if (buf[i] === "Space") fire();
        }

        for (var p = projectiles.length - 1; p >= 0; p--) {
          var pr = projectiles[p];
          pr.x += pr.vx * dt;
          pr.y += pr.vy * dt;
          pr.vy += GRAV * dt;
          pr.trail.push({ x: pr.x, y: pr.y });
          if (pr.trail.length > 14) pr.trail.shift();

          var d = Math.sqrt((pr.x - beast.x) * (pr.x - beast.x) + (pr.y - beast.y) * (pr.y - beast.y));
          if (d < beast.r + pr.r) {
            projectiles.splice(p, 1);
            burst(beast.x, beast.y, "#c8873f");
            Game.Audio.correct();
            hits++;
            ctx.setScore(hits + " / " + target);
            if (hits >= target) {
              solved = true;
              loop.stop();
              var rem = ctx.ui.remaining();
              var score = 110 + Math.floor(rem * 2) - misses * 3;
              if (score < 30) score = 30;
              window.setTimeout(function () { ctx.win(score, misses === 0); }, 350);
            } else {
              beast.x = Game.rand(640, 880);
              beast.dir = Math.random() < 0.5 ? -1 : 1;
              beast.speed += 35;
            }
            continue;
          }

          if (pr.y > H + 40 || pr.x > W + 40 || pr.x < -40) {
            projectiles.splice(p, 1);
            if (!solved) {
              misses++;
              ctx.addTime(-1);
              Game.Audio.thud();
            }
          }
        }

        for (var k = particles.length - 1; k >= 0; k--) {
          var pt = particles[k];
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 400 * dt;
          if (pt.life <= 0) particles.splice(k, 1);
        }
      }

      function drawTrajectory() {
        var vx = Math.cos(aim.angle) * aim.power;
        var vy = Math.sin(aim.angle) * aim.power;
        var x = L.x;
        var y = L.y;
        g.fillStyle = "rgba(255,255,255,0.75)";
        for (var i = 0; i < 42; i++) {
          var dt = 0.045;
          x += vx * dt;
          y += vy * dt;
          vy += GRAV * dt;
          if (i % 2 === 0) {
            g.beginPath();
            g.arc(x, y, 3, 0, Math.PI * 2);
            g.fill();
          }
          if (y > H || x > W) break;
        }
      }

      function drawCatapult() {
        g.fillStyle = "#6b4a22";
        g.beginPath();
        g.moveTo(L.x - 46, L.y + 26);
        g.lineTo(L.x + 6, L.y - 6);
        g.lineTo(L.x + 46, L.y + 26);
        g.closePath();
        g.fill();
        g.save();
        g.translate(L.x, L.y);
        g.rotate(aim.angle);
        g.strokeStyle = "#3f2a13";
        g.lineWidth = 8;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(58, 0);
        g.stroke();
        g.fillStyle = "#8a5a2b";
        g.beginPath();
        g.arc(58, 0, 9, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }

      function drawBeast() {
        g.save();
        g.translate(beast.x, beast.y);
        g.scale(beast.dir, 1);
        g.fillStyle = "#7a4a25";
        g.beginPath();
        g.ellipse(0, 0, beast.r, beast.r * 0.8, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#5c3418";
        g.beginPath();
        g.moveTo(-beast.r, -6);
        g.lineTo(-beast.r - 14, -22);
        g.lineTo(-beast.r + 4, -14);
        g.closePath();
        g.fill();
        g.beginPath();
        g.moveTo(beast.r, -6);
        g.lineTo(beast.r + 14, -22);
        g.lineTo(beast.r - 4, -14);
        g.closePath();
        g.fill();
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(10, -6, 6, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#111";
        g.beginPath();
        g.arc(12, -6, 3, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#4f2f14";
        g.fillRect(-beast.r * 0.6, beast.r * 0.5, 10, 22);
        g.fillRect(beast.r * 0.3, beast.r * 0.5, 10, 22);
        g.restore();
      }

      function render() {
        var bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#bfe6ff");
        bg.addColorStop(0.6, "#e8f4ff");
        bg.addColorStop(1, "#9ec97a");
        g.fillStyle = bg;
        g.fillRect(0, 0, W, H);

        g.fillStyle = "rgba(120,180,90,0.6)";
        g.fillRect(0, 448, W, H - 448);

        g.fillStyle = "#7fa0b5";
        g.fillRect(240, 448, 300, 20);
        g.fillStyle = "#5b7f96";
        for (var i = 0; i < 6; i++) g.fillRect(250 + i * 48, 452, 26, 8);

        drawTrajectory();
        drawBeast();
        drawCatapult();

        projectiles.forEach(function (pr) {
          g.strokeStyle = "rgba(255,255,255,0.5)";
          g.lineWidth = 2;
          g.beginPath();
          pr.trail.forEach(function (t, idx) {
            if (idx === 0) g.moveTo(t.x, t.y);
            else g.lineTo(t.x, t.y);
          });
          g.stroke();
          g.fillStyle = "#9a9a9a";
          g.beginPath();
          g.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = "#5f5f5f";
          g.lineWidth = 2;
          g.stroke();
        });

        particles.forEach(function (p) {
          g.globalAlpha = Math.max(0, p.life / p.max);
          g.fillStyle = p.color;
          g.beginPath();
          g.arc(p.x, p.y, 5, 0, Math.PI * 2);
          g.fill();
        });
        g.globalAlpha = 1;

        g.fillStyle = "rgba(0,0,0,0.55)";
        g.fillRect(W / 2 - 110, 10, 220, 34);
        g.fillStyle = "#ffe08a";
        g.font = "bold 18px 'Noto Sans TC', sans-serif";
        g.textAlign = "center";
        g.fillText("擊退野獸 " + hits + " / " + target, W / 2, 33);
        g.textAlign = "left";

        g.fillStyle = "rgba(30,80,160,0.9)";
        g.font = "bold 16px 'Noto Sans TC', sans-serif";
        g.fillText("玩家1：滑鼠瞄準", 16, H - 16);
        g.fillStyle = "rgba(190,80,40,0.95)";
        g.textAlign = "right";
        g.fillText("玩家2：空白鍵發射", W - 16, H - 16);
        g.textAlign = "left";
      }

      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerdown", onMove);
      loop.start();
      ctx.setScore(hits + " / " + target);

      return {
        destroy: function () {
          loop.stop();
          canvas.removeEventListener("pointermove", onMove);
          canvas.removeEventListener("pointerdown", onMove);
        }
      };
    }
  };
})();