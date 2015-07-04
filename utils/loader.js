/*eslint-env node */
/*eslint no-underscore-dangle:0, new-cap:0 */
"use strict";
var debug = require("debug")("PluginLoader");
var fs = require("fs");
var path = require("path");
var semver = require("semver");
var express = require("express");
//var util = require("util");

function _isDirectory(directory) {
  return (fs.statSync(directory)).isDirectory();
}

function _listSubDirectories(directory) {
  if(_isDirectory(directory)) {
    var subDirs = fs.readdirSync(directory);
    subDirs = subDirs.filter(function(dir) { if(!~dir.indexOf(".disabled")) { return true; }});
    subDirs = subDirs.map(function(dir) {
      return directory + "/" + dir;
    });
    return subDirs.filter(function(d) {
      if(_isDirectory(d)) {
        return true;
      }
      return false;
    });
  } else {
    debug("[LSD] Not a directory");
    return [];
  }
}

function _versionCheck(plugin, target) {
  var satisfies = semver.satisfies(plugin, ">=" + target);
  debug("[VersionCheck] %s", satisfies);
  return satisfies;
}

function _init(t, plugin) {
  debug("[Initilize] Initilizing %s", plugin);
  try {
    t.plugins.loaded[plugin].initilize();
    t.plugins.initilized[plugin] = t.plugins.loaded[plugin];
  } catch(e) {
    debug("[Initilize] Plugin %s doesn\"t have an initilize method", plugin);
  }
}

var PluginLoader = function(pluginDirectory) {
  this.basepath = path.join("/", path.relative("/", pluginDirectory));
  debug("[PluginDirectory] %s", this.basepath);
  this.plugins = {
    "discovered": {},
    "loaded": {},
    "initilized": {},
    "routed": {}
  };
  this.directories = [];
  this.router = express.Router();
  this.discover = function() {
    debug("[Discover] Starting");
    this.directories = _listSubDirectories(this.basepath);
    this.plugins.discovered = this.directories;
    this.plugins.discovered.forEach(function(plugin) {
      debug("[Discover] Found plugin at %s", plugin);
    });
    debug("[Discover] Finishing");
  };
  this.load = function(options) {
    debug("[Load] Starting");
    for(var i = 0; i < this.directories.length; i++) {
      var Plugin = require(this.directories[i]);
      var pluginNameSplit = this.directories[i].split("/");
      var pluginName = pluginNameSplit[pluginNameSplit.length - 1];
      debug("[Load] Loading: %s", pluginName);
      this.plugins.loaded[pluginName] = new Plugin();
      try {
        this.plugins.loaded[pluginName].load(options);
      } catch (e) {
        debug("[Load] Plugin \"%s\" doesn\'t have a load method", pluginName);
      }
    }
    debug("[Load] Finished");
  };
  this.initilize = function(plugin) {
    debug("[Initilize] Starting");
    var p = this.plugins.loaded[plugin];
    // need to create a dependency chain
    if(p.requires) {
      p.requires.forEach(function(req) {
        var keys = Object.keys(req);
        keys.forEach(function(key) {
          if(this.plugins.loaded[key]) {
            if(_versionCheck(this.plugins.loaded[key].version, req[key])) {
              debug("[Initilize] Plugin version requirement met");
              _init(this, plugin);
            } else {
              debug("[Initilize] Plugin version requirement not met");
            }
          } else {
            debug("[Initilize] Plugin requirement not met");
            debug("[Initilize] Plugin requires %s", key);
          }
        }, this);
      }, this);
    } else {
      _init(this, plugin);
    }
    debug("[Initilize] Finishing");
  };
  this.initilizeAll = function() {
    debug("[InitilizeAll] Starting");
    Object.keys(this.plugins.loaded).forEach(function(plugin) {
      this.initilize(plugin);
    }, this);
    debug("[InitilizeAll] Finishing");
  };
  this.loadRoutes = function(app, plugin) {
    debug("[LoadRoutes] Starting");
    var gApp = app;
    try {
      var p = this.plugins.initilized[plugin];
      this.router.use("/api/" + plugin, p.loadRoutes(gApp));
      this.router.get("/api", function(req, res) {
        res.send("API!");
      });
      this.plugins.routed[plugin] = p;
    } catch (e) {
      debug("[LoadRoutes] plugin \"%s\" doesn\"t have a loadRoutes method", plugin);
    }
    debug("[LoadRoutes] Finishing");
    return this.router;
  };
  this.loadRoutesAll = function(app) {
    debug("[LoadRoutesAll] Starting");
    var gApp = app;
    Object.keys(this.plugins.initilized).forEach(function(plugin) {
      this.loadRoutes(gApp, plugin);
    }, this);
    this.routes();
    debug("[LoadRoutesAll] Finishing");
    return this.router;
  };
  this.registerStyles = function(app) {
    debug("[RegisterStyles] Starting");
    Object.keys(this.plugins.initilized).forEach(function(plugin) {
      var p = this.plugins.initilized[plugin];
      if(typeof p.registerStyles === "function") {
        var styles = p.registerStyles(path.join(this.basepath, plugin));
        if(Array.isArray(styles)) {
          styles.forEach(function(style) {
            if(!/\.gitignore/i.test(style)) {
              debug("[RegisterStyles] Registering style: %s", path.join("/", style));
              app.locals.styles.push(path.join("/", style));
            }
          });
        } else if(typeof styles === "string") {
          if(!/\.gitignore/i.test(styles)) {
            debug("[RegisterStyles] Registering style: %s", path.join("/", styles));
            app.locals.styles.push(path.join("/", styles));
          }
        } else {
          debug("[RegisterStyles] %s didnt return valid data", plugin);
        }
      } else {
        debug("[RegisterStyles] %s doesn't have any styles", plugin);
      }
    }, this);
    debug("[RegisterStyles] Finishing");
  };
  this.registerScripts = function(app) {
    debug("[RegisterScripts] Starting");
    Object.keys(this.plugins.initilized).forEach(function(plugin) {
      var p = this.plugins.initilized[plugin];
      if(typeof p.registerScripts === "function") {
        var scripts = p.registerScripts(path.join(this.basepath, plugin));
        if(Array.isArray(scripts)) {
          scripts.forEach(function(script) {
            if(!/\.gitignore/i.test(script)) {
              debug("[RegisterScripts] Registering script: %s", path.join("/", script));
              app.locals.scripts.push(path.join("/", script));
            }
          });
        } else if (typeof scripts === "string") {
          if(!/\.gitignore/i.test(scripts)) {
            debug("[RegisterScripts] Registering script: %s", path.join("/", scripts));
            app.locals.scripts.push(path.join("/", scripts));
          }
        } else {
          debug("[RegisterScripts] %s didn't return valid data", plugin);
        }
      } else {
        debug("[RegisterScripts] %s doesn't have any scripts", plugin);
      }
    }, this);
    debug("[RegisterScripts] Finishing");
  };
  this.routes = function() {
    debug("[LoadRoutes] Loading internal routes");
    var self = this;
      this.router.get("/loader", function(req, res) {
        res.send("/loader");
      });
      this.router.get("/loader/renderable", function(req, res) {
        var renderable = [];
        self.getRouted().forEach(function(plugin) {
          var p = self.plugins.initilized[plugin];
          p.router.stack.forEach(function(route) {
            if(route.route.path === "/render") {
              renderable.push(plugin);
            }
          });
        }, this);
        res.json(JSON.stringify(renderable));
      });
      this.router.get("/loader/pluginList", function(req, res) {
        res.json(JSON.stringify(self.getDiscovered()));
      });
      this.router.get("/loader/discoveredList", function(req, res) {
        res.json(JSON.stringify(self.getDiscovered()));
      });
      this.router.get("/loader/loadedList", function(req, res) {
        res.json(JSON.stringify(self.getLoaded()));
      });
      this.router.get("/loader/initilizedList", function(req, res) {
        res.json(JSON.stringify(self.getInitilized()));
      });
      this.router.get("/loader/routedList", function(req, res) {
        res.json(JSON.stringify(self.getRouted()));
      });
    debug("[LoadRoutes] Internal routes loaded");
  };
  this.getPlugins = function() {
    return this.plugins;
  };
  this.getDiscovered = function() {
    return this.plugins.discovered.map(function(cv) {
      var s = cv.split("/");
      return s[s.length - 1];
    });
  };
  this.getLoaded = function() {
    return Object.keys(this.plugins.loaded);
  };
  this.getInitilized = function() {
    return Object.keys(this.plugins.initilized);
  };
  this.getRouted = function() {
    return Object.keys(this.plugins.routed);
  };
};

module.exports = PluginLoader;
