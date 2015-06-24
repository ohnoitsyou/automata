# Automata

A pluggable framework to tie together independently created devices

## Plugin API

Plugins should export the following methods:

* load(options)
* initilize()
* loadRoutes()
* registerStaticFolders(pluginDir) (Optional)
* registerStyles(pluginDir) (optional)
* registerScripts(pluginDir) (optional)

The pluginDir above will likely be optimized out in a later release

The idea is that all internal methods will be accessable via an express
  router and exported via loadRoutes

Plugins not ready for prime-time can be disabled by appending '.disabled' to
the end of the folder

## Plugin list

A list of plugins designed to work with Automata:

* [pirelay](https://github.com/ohnoitsyou/automata-pirelay) - Controller for a RasPi based relay board
* [Spark](https://github.com/ohnoitsyou/automata-spark) - An interface for communicating with Spark {core, photon, electron} devices
* [RGB Spark](https://github.com/ohnoitsyou/automata-rgb-light) - A Spark based RGB lamp
