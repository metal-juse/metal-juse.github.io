# [Module Loading](..)

* By default **juse** dynamically adds script tags to DOM to load modules, and module content is JavaScript code that defines the module.
* **juse** can also load modules with XMLHttpRequest, and the module content is plain text.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("world", "WORLD!");
define("hello", ["world"], function($world){ return "hello " + $world; });
</script>
```

In the example, ....

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("world", "WORLD!");
define("hello", ["world"], function($world){ return "hello " + $world; });
</script>
</section>