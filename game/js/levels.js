(function () {
  window.Game = window.Game || {};

  var modules = [
    Game.BrainPipe,
    Game.ActionClick,
    Game.BrainSpot,
    Game.ActionCatch,
    Game.BrainSort,
    Game.ActionRhythm,
    Game.BrainBridge,
    Game.ActionThrow
  ];

  Game.Levels = {
    list: modules.map(function (m) {
      return { title: m.title, type: m.type, module: m, clearMsg: m.clearMsg };
    })
  };
})();