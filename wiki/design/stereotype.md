# [<<](..) Module Stereotype

* Module stereotype may exchange predefined state with a module during module initialization.
* Module spec token `.type` indicates module stereotype.
* `juse` provides some useful stereotype modules, and application may create its own stereotype modules.

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

In the example, ....

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example|replace@juse/ui"></script>
<script>
define("world", "WORLD!");
define("hello", ["world"], function($world){ return "hello " + $world; });
</script>

<div id="example">module hello: ${hello}</div>
</section>
