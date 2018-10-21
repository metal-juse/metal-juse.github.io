# [<<](..) Module Definition and Dependencies

* Module is simply a name-value pair that **juse** manages.
* Module is the smallest unit of code that can be encapsulated in one file.
* Multiple modules can also be concatenated into a single file and minified by a JavaScript minifier.
* Modules may depend on one another.

* **juse** follows the base [AMD][] API to define and register modules and their dependencies.
    * `define(spec, specs, value)`
* Module definition consists of **module spec**, **dependency specs** and **module value initializer**.
* Module spec has the following extended format, where the `name` token represents the base [AMD][] module id.
    * `key=kind:name.type#member@context|pipe;value`
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

At line 4, module `world` is defined as value `World!`.

At line 5, the **main** module `hello` is defined as value deriving from `world`, and its value is then added to the document body.

The code can be copy/pasted into a standalone html file and opened in a browser.
It is also executed right here, and the **main** module value is:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("world", "World!");
define("hello", ["world"], function($world){ return "Hello " + $world; });
</script>
</section>

[AMD]: https://github.com/amdjs/amdjs-api/wiki/AMD (Asynchronous Module Definition)
