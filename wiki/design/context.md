# [<<](..) Module Context and Grouping

* **juse** supports two kinds of modules, **context** and **plain** modules.
* Context module groups logically related plain modules and creates module namespace.
* Context modules are grouped by a default/root module.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello@app"></script>
<script>
define("common.context", function(){
	this.define("world", "World!");
});
define("app.context", ["common"], function(){
	this.define("hello", ["world@common"], function($world){ return "hello " + $world; });
});
</script>
```

At line 2, the script tag loads the **juse** bootstrap script and declares the **main** module `hello`.

At line 4, the **main** module `hello` is defined via the global function `define`, and its value is then added to the document body.

The code can be copy/pasted into a standalone html file and opened in a browser.
It is also executed right here, and the **main** module value is:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello@app"></script>
<script>
define("common.context", function(){
	this.define("world", "World!");
});
define("app.context", ["common"], function(){
	this.define("hello", ["world@common"], function($world){ return "hello " + $world; });
});
</script>
</section>
