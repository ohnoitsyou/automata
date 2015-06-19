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
