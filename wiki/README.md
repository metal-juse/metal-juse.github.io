# Highlights

* `juse` is an [AMD][] inspired JavaScript framework to manage and load modules and dependencies.
    - Module is a name-value pair.
    - Module is the smallest unit of code that can be encapsulated in one file.
    - Modules can also be concatenated into one file and minified.
    - Modules can depend on one another.

* `juse` supports module grouping, configuration and stereotype in module definitions.
* `juse` provides framework modules as services to assist with all aspects of module definitions.
* `juse` also provides framework modules as API abstraction of system resources such as DOM and XMLHttpRequest.
* `juse` supports easy integration with external classic frameworks such as [jQuery][].

# Design Details

* Module Definition and Dependencies
    - `juse` follows the [AMD][] approach to define modules and dependencies.
    - Module is identified by its ref spec, in the format of `kind:name.type#member@context|pipe;value`
    - Module ref spec can be partial in module definition, and the framework resolves the full spec based on configuration and usage convention.

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

[AMD]:		https://en.wikipedia.org/wiki/Asynchronous_module_definition
[jQuery]:	https://en.wikipedia.org/wiki/JQuery
