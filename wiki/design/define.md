# [<<](..) Module Definition and Dependencies

* `juse` follows the base [AMD][] API to define modules and dependencies.
    * `define(spec, specs, value)`
* Module definition consists of module spec, dependency specs and module value initializer.
* Module spec has the following extended format, where the `name` token represents the base [AMD][] module id.
    * `kind:name.type#member@context|pipe;value`
* Module spec/specs can be partial, and the framework resolves the full spec based on configuration and usage convention.
* Module value initializer can be a simple value, or a callback that returns a value.

Example:

```
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example|replace@juse/ui"></script>
<script>
define("world", "WORLD!");
define("hello", ["world"], function($world){ return "hello " + $world; });
</script>

<div id="example">module hello: ${hello}</div>
```

In the example, module `world` is defined with value `WORLD!`, and module `hello` with value deriving from `world`. The value of `hello` is then rendered by replacement variable `${hello}`.

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example|replace@juse/ui"></script>
<script>
define("world", "WORLD!");
define("hello", ["world"], function($world){ return "hello " + $world; });
</script>

<div id="example">module hello: ${hello}</div>
</section>

[AMD]: https://github.com/amdjs/amdjs-api/wiki/AMD
