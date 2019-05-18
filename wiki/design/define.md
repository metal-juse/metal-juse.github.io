# [Module Definition and Dependencies](..)

* Module is simply a name-value pair that **juse** manages.
* Module is the smallest unit of code that can be encapsulated in one file.
* Multiple modules can also be concatenated into a single file and minified.
* Module may depend on other modules.
* **juse** defines and registers modules and their dependencies as below:
    * `juse.define(spec, value)`, defines a module
    * `juse.import(spec1, spec2, ...)`, loads given modules
    * `juse.import(spec1, spec2, ...).define(spec, function($value1, $value2, ...){...})`, loads given modules, and subsequently make them dependencies of the defined module
* Module definition consists of **module spec**, and **value initializer**.
* Module spec has the following format:
    * `key=kind:name.type#member@context|pipe;value`
* Module spec can be partial, and the framework resolves the full spec based on convention and configuration.
* Module value initializer can be a simple value, or a callback that returns a value.

Example:

```html
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="hello" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>
juse.define("world", "World!");
juse.import("world").define("hello", function($world){ return "Hello " + $world; });
</script>
```

At line 4, module `world` is defined as value `World!`.

At line 5, the **main** module `hello` is defined as value derived from `world`.

The code can be copy/pasted into a standalone html file and opened in a browser.
The exact code is also executed right here on this page, with the **main** module value to be seen as:

<section>
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="hello" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>
juse.define("world", "World!");
juse.import("world").define("hello", function($world){ return "Hello " + $world; });
</script>
</section>
