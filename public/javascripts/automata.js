var loadedPlugins;
function renderDisplays() {
  loadedPlugins.forEach(function(plugin) {
    $.ajax("/api/" + plugin + "/render", { method: "get" })
      .done(function(data) {
        var rowdiv = document.createElement("div");
        rowdiv.className = "row";
        $(rowdiv).append('<div class="col-md-2 plugin-title"><h3>' + plugin + '</h3></div');
        $(rowdiv).append($(data).addClass("col-md-10 plugin-controls"));
        $("#elements").append(rowdiv);
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
