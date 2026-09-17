(function () {
  window.Game = window.Game || {};

  var PRESS = {
    ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1,
    Space: 1, Enter: 1, KeyF: 1, KeyJ: 1,
    KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1
  };

  var keys = {};
  var buffer = [];

  Game.Input = {
    init: function () {
      window.addEventListener("keydown", function (e) {
        if (PRESS[e.code]) e.preventDefault();
        if (e.repeat) return;
        keys[e.code] = true;
        buffer.push(e.code);
      });
      window.addEventListener("keyup", function (e) {
        keys[e.code] = false;
      });
      window.addEventListener("blur", function () {
        keys = {};
      });
    },

    isDown: function (code) {
      return !!keys[code];
    },

    takeBuffer: function () {
      var out = buffer;
      buffer = [];
      return out;
    }
  };
})();