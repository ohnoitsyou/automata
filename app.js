"use strict";
var debug = require('debug')('automata');
var express = require("express");
var path = require("path");
//var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
//var util = require("util");
var config = require("config");

var routes = require("./routes/index");
var users = require("./routes/users");
var PluginLoader = require("./utils/loader");
var loader = new PluginLoader(config.get("pluginDir"));

//var loadOptions = {'sparkUsername': config.get('sparkUsername'), 'sparkPassword': config.get('sparkPassword')};
var loadOptions = {"sparkAccessToken": config.get("sparkAccessToken")};

loader.discover();
loader.load(loadOptions);
//loader.initilize("lights");
loader.initilizeAll();

var app = express();
app.enable('trust proxy');

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

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
    res.render("error", {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {}
  });
});

module.exports = app;
