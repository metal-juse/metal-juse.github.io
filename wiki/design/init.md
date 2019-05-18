# [Module Initialization](..)

* Module initializer.
    * Module meta and annotation settings.

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
