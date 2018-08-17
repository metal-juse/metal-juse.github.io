# [<<](..) Module Grouping and Context

* Context module is a special module that groups logically related modules.
* Every defined module is part of a context module, either a named context, or the default/root context.
* All context modules are part of the default/root module.

Example:

```
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
