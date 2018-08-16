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

* Module Definition and Dependencies
    - `juse` follows the base [AMD][] API to define modules and dependencies.
        + `define(spec, specs, value)`
    - Module definition consists of module spec, dependency specs and module value initializer.
    - Module spec has the following extended format, where the `name` token represents the base [AMD][] module id.
        + `kind:name.type#member@context|pipe;value`
    - Module spec/specs can be partial, and the framework resolves the full spec based on configuration and usage convention.
    - Module value initializer can be a simple value, or a callback that returns a value.

Example: The following code defines module `world` with value `WORLD!`, and module `hello`, which depends on `world`, with its value deriving from `world`. The sample code then displays value of `hello` with replacement variable `${hello}`.

```
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example|replace@juse/ui"></script>
<script>
define("world", "WORLD!");
define("hello", ["world"], function($world){ return "hello " + $world; });
</script>

<div id="example">module hello: ${hello}</div>
```

<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example|replace@juse/ui"></script>
<script>
define("world", "WORLD!");
define("hello", ["world"], function($world){ return "hello " + $world; });
</script>

<div id="example">module hello: ${hello}</div>

* Module Stereotype
    - Module stereotype may exchange predefined state with a module during module initialization.
    - Module spec token `.type` indicates module stereotype.
    - `juse` provides some useful stereotype modules, and application may create its own stereotype modules.

Example: The following code defines module ----.

```
define("----", "----");
```

* Module Grouping
    - Context module is a special module that groups logically related modules.
    - Every defined module is part of a context module, either a named context, or the default/root context.
    - All context modules are part of the default/root module.

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
