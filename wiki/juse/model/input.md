# input@[juse/model](../../juse/model)

Binder that manages input value tile:
* inits tile from binding specs
* binds tile node to dom input event and handles input value
* renders tile node based on tile value spec

Tile binding specs:
* data-value, tile value spec
* data-valid, validation spec
* data-event, event spec

Example:

```html
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="example.model@app;" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>juse.import("juse/model").define("app.context");</script>

<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [%{; -- blank -- }]
</div>
```

Live result:

<section>
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="example.model@app;" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>juse.import("juse/model").define("app.context");</script>

<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [%{; -- blank -- }]
</div>
</section>
