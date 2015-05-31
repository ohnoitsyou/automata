"use strict";
var debug = require("debug")("PluginLoader");
var fs = require("fs");
var path = require("path");
var semver = require("semver");
var express = require("express");
//var util = require("util");

var PluginLoader = function(pluginDirectory) {
  this.basepath = path.join("/", path.relative("/", pluginDirectory));
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
        debug("[Load] Plugin \"%s\" doesn\"t have a load method", pluginName);
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
  this.loadRoutes = function(app,plugin) {
    debug("[LoadRoutes] Starting");
    var gApp = app;
    try {
      var p = this.plugins.initilized[plugin];
      this.router.use("/api/" + plugin, p.loadRoutes(gApp));
      this.router.get("/api", function(req, res) {
        rse.send("API!");
      });
      this.plugins.routed[plugin] = p;
    } catch (e) {
      debug("[LoadRoutes] plugin \"%s\" doesn\"t have a loadRoutes method", plugin);
    }
    this.routes();
    debug("[LoadRoutes] Finishing");
    return this.router;
  };
  this.loadRoutesAll = function(app) {
    debug("[LoadRoutesAll] Starting");
    var gApp = app;
    Object.keys(this.plugins.initilized).forEach(function(plugin) {
      this.loadRoutes(gApp,plugin);
    }, this);
    debug("[LoadRoutesAll] Finishing");
    return this.router;
  };
  this.routes = function() {
    debug("[LoadRoutes] Loading internal routes");
    var self = this;
      this.router.get("/loader", function(req, res) {
        res.send("/loader");
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
    return this.plugins.discovered.map(function(cv,i,a) {
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

function _listSubDirectories(directory) {
  if(_isDirectory(directory)) {
    var subDirs = fs.readdirSync(directory);
    subDirs = subDirs.filter(function(dir) { if(!~dir.indexOf(".disabled")) { return true; }});
    subDirs = subDirs.map(function(dir) {
      return directory + "/" + dir;
    });
    return subDirs.filter(function(d, i, a) {
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

function _isDirectory(directory) {
  return (fs.statSync(directory)).isDirectory();
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

module.exports = PluginLoader;
