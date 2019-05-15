# root

`root` is the default context module that contains all other contexts, as well as modules without explicit context.

# juse

`juse` is the first module contained in `root`. It can also be accessed directly as a global function. It is the framework entry point to define and register a module.

* signature, (spec, refs, value)
* spec format
* meta format
* log cats
* hashchange
* loading events: load@juse/core, done@juse/core
* data-main, main module spec

Supported features:
* browser and/or node
* html5 async loading

Members:
* resolve
* lookup
* filter
* ...

## Modules
* [juse/cache](juse/cache)
* [juse/context](juse/context)
* [juse/follower](juse/follower)
* [juse/classifier](juse/classifier)
