# [Module Initialization](..)

* Module initializer.
    * Module meta and annotation settings.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script data-main="hello" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>
juse.define("world", "WORLD!");
juse.import("world").define("hello", function($world){ return "hello " + $world; });
</script>
```

In the example, ....

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script data-main="hello" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>
juse.define("world", "WORLD!");
juse.import("world").define("hello", function($world){ return "hello " + $world; });
</script>
</section>
