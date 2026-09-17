(function () {
  window.Game = window.Game || {};

  var list = [
    {
      id: "farmer",
      name: "憨農哥",
      emoji: "🌾",
      type: "力量型",
      kit: "動作關卡 +3 秒",
      brainMs: 0,
      actionMs: 3000
    },
    {
      id: "sage",
      name: "智囊妹",
      emoji: "🔮",
      type: "智慧型",
      kit: "腦力關卡 +15 秒",
      brainMs: 15000,
      actionMs: 0
    },
    {
      id: "elder",
      name: "樂天翁",
      emoji: "🎋",
      type: "均衡型",
      kit: "各關卡 +1.5 秒",
      brainMs: 1500,
      actionMs: 1500
    }
  ];

  Game.Characters = {
    list: list,
    byId: function (id) {
      return list.filter(function (c) { return c.id === id; })[0] || list[0];
    }
  };
})();