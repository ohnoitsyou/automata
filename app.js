"use strict";
var debug = require("debug")("automata");
debug("[Automata] Welcome to Automata");
var express = require("express");
var path = require("path");
//var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
//var util = require("util");
var config = require("config");
var hbs = require("express-hbs");

var routes = require("./routes/index");
var users = require("./routes/users");
var PluginLoader = require("./utils/loader");
var loader = new PluginLoader(config.get("pluginDir"));

//var loadOptions = {'sparkUsername': config.get('sparkUsername'), 'sparkPassword': config.get('sparkPassword')};
var loadOptions = {"sparkAccessToken": config.get("sparkAccessToken")};


var app = express();
app.enable("trust proxy");

// view engine setup
app.engine("hbs", hbs.express4({
  partialsDir: __dirname + "/views/partials",
  defaultLayout: __dirname + "/views/layout.hbs"
}));
app.set("view engine", "hbs");
app.set("views", __dirname);

// app local variables

// app res variables
app.all("*",function(req, res, next) {
  res.locals.pluginDir = config.get("pluginDir");
  res.locals.baseURI = "http://automata.ohnoitsyou.net";
  res.locals.app = app;
  next();
});

loader.discover();
loader.load(loadOptions);
loader.initilizeAll();
loader.registerViews();
app.use("/", loader.loadRoutesAll(app));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger("short"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);
app.use("/users", users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("views/error", {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render("views/error", {
    message: err.message,
    error: {}
  });
});

module.exports = app;
