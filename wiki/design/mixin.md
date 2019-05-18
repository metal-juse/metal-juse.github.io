# [Module Mixin](..)

* Module stereotype may exchange predefined state with a module during module initialization.
* Module spec token `.type` indicates module stereotype.
* **juse** provides some useful stereotype modules, and application may create its own stereotype modules.

Example:

```html
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="hello" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>
juse.define("world", "WORLD!");
juse.import("world").define("hello", function($world){ return "hello " + $world; });
</script>
```

In the example, ....

<section>
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="hello" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>
juse.define("world", "WORLD!");
juse.import("world").define("hello", function($world){ return "hello " + $world; });
</script>
</section>
