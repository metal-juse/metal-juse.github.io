# [Module Grouping by Context](..)

* **juse** supports two kinds of modules, **context** and **plain** modules.
* Context module groups logically related plain modules and effectively creates module namespace.
* Context modules themselves are grouped by the default (or root) module.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.js" data-app="hello@app"></script>
<script>
juse.define("common.context", function(){
	juse.define("world", "World!");
});
juse.import("common").define("app.context", function(){
	juse.import("world@common").define("hello", function($world){ return "Hello " + $world; });
});
</script>
```

At line 2, the **main** module is declared as `hello@app`, where `app` is the app context.

At lines 4-6, context `common` is first defined. And then in its initializer callback, module `world@common` is defined.

At lines 7-9, context `app` is first defined. Then the **main** module `hello@app` is defined, with value deriving from `world@common`. Its value is then added to the document body.

The code can be copy/pasted into a standalone html file and opened in a browser.
It is also executed right here, and the **main** module value is:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.js" data-app="hello@app"></script>
<script>
juse.define("common.context", function(){
	juse.define("world", "World!");
});
juse.import("common").define("app.context", function(){
	juse.import("world@common").define("hello", function($world){ return "Hello " + $world; });
});
</script>
</section>
