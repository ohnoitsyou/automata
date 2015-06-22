var loadedPlugins;
function renderDisplays() {
  loadedPlugins.forEach(function(plugin) {
    $.ajax("/api/" + plugin + "/render", { method: "get" })
      .done(function(data) {
        $('#elements').append(data);
      });
  });
};

$(document).ready(function() {
  $.ajax("/loader/renderable", { method: "get" })
    .done(function(data) {
      loadedPlugins = JSON.parse(data);
      renderDisplays();
    });
});
