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
* [Spark relay](https://github.com/ohnoitsyou/automata-relay) - A spark controlled relay outlet, similar to the Weaved
* [Weaved](https://github.com/ohnoitsyou/automata-weaved) - A basic controller for the Weaved IoT device
* 
### Adding plugins

Please rename the plugins as you check them out, remove the 'automata' from the folder name. The plugins I've written for Automata don't take this into account in their API scheme. (I'm working on it!)


## Authentication

Automata is configured to use basic-auth to secure the UI. Add an array called authUsers to the configuration file. Provide the following details:

* id
* username
* password
* email
