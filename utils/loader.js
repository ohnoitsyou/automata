// Ok, node is really awesome, but this async thing is getting annoying
// I'm going to try to make this as sync as possible
//
var debug = require('debug')('PluginLoader');
var fs = require('fs');
var Q = require('q');
var path = require('path');
var util = require('util');
var semver = require('semver');
var express = require('express');

var PluginLoader = function(pluginDirectory) {
  this.basepath = path.join('/',path.relative('/',pluginDirectory)),
  this.plugins = {'discovered':{},'loaded':{},'initilized':{},'routed':{}},
  this.directories,
  this.router = express.Router(),
  this.discover = function() {
    debug('[Discover] Starting');
    var that = this;
    this.directories = _listSubDirectories(this.basepath);
    this.plugins['discovered'] = this.directories;
    this.plugins['discovered'].forEach(function(plugin) {
      debug('[Discover] Found plugin at %s',plugin);
    });
    debug('[Discover] Finishing');
  },
  this.load = function(options) {
    debug('[Load] Starting');
    for(var i = 0; i < this.directories.length; i++) {
      var plugin = require(this.directories[i]);
      var pluginNameSplit = this.directories[i].split('/');
      var pluginName = pluginNameSplit[pluginNameSplit.length - 1];
      debug('[Load] Loading: %s',pluginName);
      this.plugins['loaded'][pluginName] = new plugin;
      try {
        this.plugins['loaded'][pluginName].load(options);
      } catch (e) {
        debug('[Load] Plugin \'%s\' doesn\'t have a load method',pluginName);
      }
    }
    debug('[Load] Finished');
  },
  this.initilize = function(plugin) {
    debug('[Initilize] Starting');
    var p = this.plugins['loaded'][plugin];
    // need to create a dependency chain
    if(p.requires) {
      p.requires.forEach(function(req) {
        var keys = Object.keys(req);
        keys.forEach(function(key) {
          if(this.plugins['loaded'][key]) {
            if(_versionCheck(this.plugins['loaded'][key].version, req[key])) {
              debug('[Initilize] Plugin version requirement met');
              _init(this,plugin);
            } else {
              debug('[Initilize] Plugin version requirement not met');
            }
          } else {
            debug('[Initilize] Plugin requirement not met');
            debug('[Initilize] Plugin requires %s',key);
          }
        },this);
      },this);
    } else {
      _init(this,plugin);
    }
    debug('[Initilize] Finishing');
  },
  this.initilizeAll = function() {
    debug('[InitilizeAll] Starting');
    Object.keys(this.plugins['loaded']).forEach(function(plugin) {
      this.initilize(plugin);
    },this);
    debug('[InitilizeAll] Finishing');
  },
  this.loadRoutes = function(plugin) {
    debug('[LoadRoutes] Starting');
    try {
      var p = this.plugins['initilized'][plugin];
      this.router.use('/api/' + plugin, p.loadRoutes());
      this.router.get('/api', function(req, res) {
        res.send('/api');
      });
      this.plugins['routed']['plugin'] = p;
    } catch (e) {
      debug('[LoadRoutes] plugin \'%s\' doesn\'t have a loadRoutes method',plugin);
    }
    debug('[LoadRoutes] Finishing');
    return this.router;
  },
  this.loadRoutesAll = function () {
    debug('[LoadRoutesAll] Starting');
    Object.keys(this.plugins['initilized']).forEach(function(plugin) {
      this.loadRoutes(plugin);
    },this);
    debug('[LoadRoutesAll] Finishing');
    return this.router;
  }
  this.getPlugins = function() {
    return this.plugins;
  },
  this.getDiscovered = function() {
    return this.plugins['discovered'];
  },
  this.getLoaded = function() {
    return this.plugins['loaded']; 
  },
  this.getInitilized = function() {
    return this.plugins['initilized'];
  },
  this.getRouted = function() {
    return this.plugins['routed'];
  }
}

function _listSubDirectories(directory) {
  if(_isDirectory(directory)) {
    var subDirs = fs.readdirSync(directory);
    subDirs = subDirs.filter(function(dir) { if(!~dir.indexOf('.disabled')) { return true; }});
    subDirs = subDirs.map(function(dir) { return directory + '/' + dir; });
    return subDirs.filter(function(d,i,a) { if(_isDirectory(d)) { return true;} return false;});
  } else {
    debug('[LSD] Not a directory');
    return [];
  }
}

function _isDirectory(directory) {
  return (fs.statSync(directory)).isDirectory();
}

function _versionCheck(plugin,target) {
  var satisfies = semver.satisfies(plugin, '>='+target);
  debug('[VersionCheck] %s',satisfies);
  return satisfies;
}

function _init(t,plugin) {
  debug('[Initilize] Initilizing %s', plugin);
  try {
    t.plugins['loaded'][plugin].initilize();
    t.plugins['initilized'][plugin] = t.plugins['loaded'][plugin];
  } catch(e) {
    debug('[Initilize] Plugin %s doesn\'t have an initilize method',plugin);
  }
}

module.exports = PluginLoader;
