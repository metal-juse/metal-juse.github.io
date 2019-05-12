# text@[juse/model](../../juse/model)

Binder that manages text tile:
* inits tile from text binding specs %{spec}
* renders tile node text based on binding specs

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example.model@app;"></script>
<script>juse.import("juse/model").define("app.context");</script>

<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [%{; -- blank -- }]
</div>
```

Live result:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example.model@app;"></script>
<script>juse.import("juse/model").define("app.context");</script>

<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [%{; -- blank -- }]
</div>
</section>
