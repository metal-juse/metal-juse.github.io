# [Module Stereotyping](..)

* Module stereotype may exchange predefined state with a module during module initialization.
* Module spec token `.type` indicates module stereotype.
* **juse** provides some useful stereotype modules, and application may create its own stereotype modules.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.js" data-app="hello"></script>
<script>
juse.define("world", "WORLD!");
juse.import("world").define("hello", function($world){ return "hello " + $world; });
</script>
```

In the example, ....

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.js" data-app="hello"></script>
<script>
juse.define("world", "WORLD!");
juse.import("world").define("hello", function($world){ return "hello " + $world; });
</script>
</section>
