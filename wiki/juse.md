# root

`root` is the default context module that contains all other contexts, as well as modules without explicit context.

# juse

`juse` is the first module contained in `root`. It can also be accessed directly as a global function. It is the framework entry point to define and register a module.

* signature, (spec, refs, value)
* spec format
* meta format
* log cats
* hashchange
* loading events: juse/app/load, juse/app/done
* data-app, app module spec

Supported features:
* browser and/or node
* html5 async loading

Members:
* resolve
* lookup
* filter
* ...

# juse/cache

Classifier to enhance module with cache store.

# juse/context

Classifier to init and cache context settings.

# juse/follower

Classifier to register/notify follower modules to respond to context based events.

# juse/classifier

Classifier to mark modules as classifiers so other module may refer to a classifier by its short name.
