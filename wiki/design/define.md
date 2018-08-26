# [<<](..) Module Definition and Dependencies

* Module is a name-value pair.
* Module is the smallest unit of code that can be encapsulated in one file.
* Modules can also be concatenated into one file and minified.
* Modules can depend on one another.
* `juse` follows the base [AMD][] API to define modules and dependencies.
    * `define(spec, specs, value)`
* Module definition consists of module spec, dependency specs and module value initializer.
* Module spec has the following extended format, where the `name` token represents the base [AMD][] module id.
    * `kind:name.type#member@context|pipe;value`
* Module spec/specs can be partial, and the framework resolves the full spec based on configuration and usage convention.
* Module value initializer can be a simple value, or a callback that returns a value.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("world", "World!");
define("hello", ["world"], function($world){ return "Hello " + $world; });
</script>
```

At line 4, module `world` is defined with value `WORLD!`.
At line 5, module `hello` is defined with value deriving from `world`.
The value of `hello` is then added to the document body as the main module.

The code is executed right here in this page, producing the following result.

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("world", "World!");
define("hello", ["world"], function($world){ return "Hello " + $world; });
</script>
</section>

[AMD]: https://github.com/amdjs/amdjs-api/wiki/AMD (Asynchronous Module Definition)
