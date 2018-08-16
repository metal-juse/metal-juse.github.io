# Highlights

* `juse` is an [AMD][] inspired JavaScript framework to load and manage modules and dependencies.
    - Module is a name-value pair.
    - Module is the smallest unit of code that can be encapsulated in one file.
    - Modules can also be concatenated into one file and minified.
    - Modules can depend on one another.

* `juse` adds additional features on top of the base [AMD][] API to support modular design such as module stereotype and grouping.
* `juse` provides core framework modules as services to assist with the additional design features in module definitions.
* `juse` makes it easy to separate common reusable patterns from application modules into its own framework modules.
* `juse` also provides framework modules as API abstraction of system resources such as DOM and XMLHttpRequest.
* `juse` supports easy integration with external classic frameworks such as [jQuery][].

# Design Features

* Module Definition and Dependencies [>>](design/define)
* Module Stereotype [>>](design/stereotype)
* Module Grouping and Context [>>](design/context)
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
