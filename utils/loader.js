// Ok, node is really awesome, but this async thing is getting annoying
// I'm going to try to make this as sync as possible
//
var debug = require('debug')('loader');
var fs = require('fs');
var Q = require('q');
var path = require('path');
var util = require('util');

var PluginLoader = function(pluginDirectory) {
  this.basepath = path.join('/',path.relative('/',pluginDirectory)); 
  console.log('[PluginLoader] [Init] ', this.basepath);
  debug('[PluginLoader] [Init]',this.basepath);
  this.plugins = {'discovered':{},'loaded':{},'initilized':{}};
  this.directories,
  this.discover = function() {
    console.log('[PluginLoader] [Discover] Starting');
    var that = this;
    this.directories = _listSubDirectories(this.basepath);
    this.plugins['discovered'] = this.directories;
    this.plugins['discovered'].forEach(function(plugin) {
      console.log('[PluginLoader] [Discover] Found plugin at',plugin);
    });
    console.log('[PluginLoader] [Discover] Finished');
  },
  this.load = function(options) {
    console.log('[PluginLoader] [Load] Starting');
    for(var i = 0; i < this.directories.length; i++) {
      var plugin = require(this.directories[i]);
      var pluginNameSplit = this.directories[i].split('/');
      var pluginName = pluginNameSplit[pluginNameSplit.length - 1];
      console.log('[PluginLoader] [Load] Loading:',pluginName);
      this.plugins['loaded'][pluginName] = new plugin;
      try {
        this.plugins['loaded'][pluginName].load(options);
      } catch (e) {
        console.log('[PluginLoader] [Load] Plugin',pluginName,'doesnt have a load method');
      }
    }
    console.log('[PluginLoader] [Load] Finished');
  },
  this.initilize = function(plugin) {
    // need to create a dependency chain
    console.log('[PluginLoader] [Initilize] Starting');
    console.log('[PluginLoader] [Initilize] Initilizing', plugin);
    console.log('[PluginLoader] [Debug]',this.plugins['loaded'][plugin]);
    //console.log('[PluginLoader] [VersionCheck]',_versionCheck(this.plugins['loaded'][plugin]);

    this.plugins['loaded'][plugin].initilize();
    this.plugins['initilized'][plugin] = this.plugins['loaded'][plugin];
    console.log('[PluginLoader] [Initilize] Finishing');
  },
  this.initilizeAll = function() {
    console.log('[PluginLoader] [InitilizeAll] Starting');
    Object.keys(this.plugins['loaded']).forEach(function(elem) {
      this.initilize(elem);
    },this);
    console.log('[PluginLoader] [InitilizeAll] Finishing');
  },
  this.loadRoutes = function() {
    console.log('[PluginLoader] [LoadRoutes] Starting');
    Object.keys(this.plugins['initilized']).forEach(function(plugin) {
      try {
        plugin.loadRoutes();
      } catch (e) {
        console.log('');
    }},this);
    console.log('[PluginLoader] [LoadRoutes] Finishing');
  },
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
  }
}

function _listSubDirectories(directory) {
  if(_isDirectory(directory)) {
    var subDirs = fs.readdirSync(directory);
    subDirs = subDirs.filter(function(dir) { if(!~dir.indexOf('.disabled')) { return true; }});
    subDirs = subDirs.map(function(dir) { return directory + '/' + dir; });
    return subDirs.filter(function(d,i,a) { if(_isDirectory(d)) { return true;} return false;});
  } else {
    console.log('[PluginLoader] [LSD] Not a directory');
    return [];
  }
}

function _isDirectory(directory) {
  return (fs.statSync(directory)).isDirectory();
}

function _checkVersion(plugin,target) {
  var re = /(\d).(\d).(\d)/;
  var major, minor, bug = re.test(target.version);
  return true;
}



module.exports = PluginLoader;
