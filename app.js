/*eslint-env node */
/*eslint no-unused-vars: 0 */
"use strict";
var debug = require("debug")("automata");
debug("[Automata] Welcome to Automata");
var express = require("express");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var config = require("config");
var hbs = require("express-hbs");
// Passport.js
var passport = require("passport");
var BasicStrategy = require("passport-http").BasicStrategy;
var authUsers = config.get("authUsers");
// Socket.io
var socket_io = require("socket.io");

var routes = require("./routes/index");
var users = require("./routes/users");

var PluginLoader = require("./utils/loader");
var loader = new PluginLoader(config.get("pluginDir"));

//var loadOptions = {'sparkUsername': config.get('sparkUsername'), 'sparkPassword': config.get('sparkPassword')};
var loadOptions = {"sparkAccessToken": config.get("sparkAccessToken"), "weavedAddress": config.get("weavedAddress")};


var app = express();
app.enable("trust proxy");

// Passport.js Start
app.use(passport.initialize());
function findByUsername(username, fn) {
  for(var i = 0, len = authUsers.length; i < len; i++) {
    var user = authUsers[i];
    if(user.username === username) {
      return fn(null, user);
    }   
  }
  return fn(null, null);
}

passport.use(new BasicStrategy({
	},  
	function(username, password, done) {
		findByUsername(username, function(err, user) {
			if(err) { return done(err); }
			if(!user) { return done(null, false); }
			if(user.password != password) {return done(null, false) }
			return done(null, user);
		}); 
	}
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
          done(err, user);
            });
});

app.get("/", passport.authenticate("basic", {session: true}),
	function(req, res, next) {
		next();
	}); 
// Passport end

// Socket.io start
var io = socket_io();
app.io = io;

io.on("connection", function(socket) {
  debug("Socket conection");
});
// Socket.io end

// view engine setup
app.engine("hbs", hbs.express4({
  partialsDir: path.join(__dirname, "/views/partials"),
  defaultLayout: path.join(__dirname, "/views/layout.hbs")
}));
app.set("view engine", "hbs");
app.set("views", __dirname);

hbs.registerHelper("styles", function(styles) {
  var returnString = "";
  if(Array.isArray(styles)) {
    styles.forEach(function(style) {
      returnString += "<link rel=\"stylesheet\" href=\"" + style + "\">\n";
    });
  } else if(typeof styles === "string") {
    returnString = "<link rel=\"stylesheet\" href=\"" + styles + "\">\n";
  }
  return returnString;
});
hbs.registerHelper("scripts", function(scripts) {
  var returnString = "";
  if(Array.isArray(scripts)) {
    scripts.forEach(function(script) {
      returnString += "<script type=\"text/javascript\" src=\"" + script + "\"></script>\n";
    });
  } else if(typeof scripts === "string") {
      returnString += "<script type=\"text/javascript\" src=\"" + scripts + "\"></script>\n";
  }
  return returnString;
});

// app local variables
app.locals.styles = [];
app.locals.scripts = [];

// app res variables
app.all("*", function(req, res, next) {
  res.locals.pluginDir = config.get("pluginDir");
  res.locals.baseURI = "http://automata.ohnoitsyou.net";
  res.locals.app = app;
  next();
});

loader.discover();
loader.load(loadOptions);
loader.initilizeAll();
loader.registerStyles(app);
loader.registerScripts(app);
app.use("/", loader.loadRoutesAll());

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger("short"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "plugins")));

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
