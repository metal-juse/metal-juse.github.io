# Highlights

* `juse` is an [AMD][] inspired JavaScript framework to load and manage modules and dependencies.
    - Module is a name-value pair.
    - Module is the smallest unit of code that can be encapsulated in one file.
    - Modules can also be concatenated into one file and minified.
    - Modules can depend on one another.

* `juse` adds additional features on top of the base API to support module design such as module grouping, configuration and stereotype in module definitions.
* `juse` provides core framework modules as services to assist with the additional design features in module definitions.
* `juse` makes it easy to separate common reusable patterns from application modules into its own framework modules.
* `juse` also provides framework modules as API abstraction of system resources such as DOM and XMLHttpRequest.
* `juse` supports easy integration with external classic frameworks such as [jQuery][].

# Design Features

* Module Definition and Dependencies
    - `juse` follows the base [AMD][] API to define modules and dependencies.
        + `define(spec, specs, value)`
    - Module definition consists of module spec, dependency specs and module value initializer.
    - Module spec has the following extended format, where the `name` token represents the base [AMD][] module id.
        + `kind:name.type#member@context|pipe;value`
    - Module spec/specs can be partial, and the framework resolves the full spec based on configuration and usage convention.
    - Module value initializer can be a simple value, or a callback that returns a value.

* Module Grouping and Configuration
    - Context is a special module that groups other modules.

* Module Stereotype
    - Module can have stereotypes that indicate common module behaviors.
    - Stereotype itself is defined as a module.

* Module Loading and Initialization

# Contexts

* [juse](juse)
* [juse/text](juse/text)
* [juse/valid](juse/valid)
* [juse/resource](juse/resource)
* [juse/remote](juse/remote)
* [juse/run](juse/run)
* [juse/service](juse/service)
* [juse/ui](juse/ui)
* [juse/model](juse/model)

# Ext Contexts
* [jx/jquery](jx/jquery)
* more to come...

[AMD]:		https://github.com/amdjs/amdjs-api/wiki/AMD
[jQuery]:	https://en.wikipedia.org/wiki/JQuery
