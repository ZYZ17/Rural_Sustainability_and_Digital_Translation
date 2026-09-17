window.Game = window.Game || {};

Game.Config = {
  W: 960,
  H: 520,
  baseTimeBrain: 75,
  baseTimeAction: 55,
  brainBonusMs: 15000,
  actionBonusMs: 3000,
  balanceMs: 1500,
  targetStarsPerLevel: 3,
  totalLevels: 8,
  keys: {
    P1: { move: ["F", "J"], rhythm: ["F", "J"] },
    P2: { arrows: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], fire: "Space" }
  }
};

Game.$ = function (sel, parent) {
  return (parent || document).querySelector(sel);
};

Game.$$ = function (sel, parent) {
  return Array.from((parent || document).querySelectorAll(sel));
};

Game.esc = function (str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
};

Game.on = function (el, ev, fn) {
  if (el) el.addEventListener(ev, fn);
};

Game.Loop = function (update, render) {
  var raf = null;
  var last = 0;
  var running = false;
  function frame(ts) {
    if (!running) return;
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    update(dt);
    render();
    raf = window.requestAnimationFrame(frame);
  }
  return {
    start: function () {
      running = true;
      last = 0;
      raf = window.requestAnimationFrame(frame);
    },
    stop: function () {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = null;
    }
  };
};