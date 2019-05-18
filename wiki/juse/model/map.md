# map@[juse/model](../../juse/model)

Binder that manages map value tile:
* inits tile from binding specs and tile node content
* updates model value based on binding specs
* renders tile node based on binding specs

Tile binding specs:
* data-value, tile value spec

Example:

```html
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="example.model@app;" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>juse.import("juse/model").define("app.context");</script>

<div id="example">
	foo: <input data-value="#foo" data-event="enter:#clear" type="text" placeholder="enter foo here"><br>
	bar: <input data-value="#bar" data-event="enter:#clear" type="text" placeholder="enter bar here"><br>
	baz: <input data-value="#baz" data-event="enter:#clear" type="text" placeholder="enter baz here"><br>
	map: <ul data-value="map:"><li>%{}</li></ul>
	<span data-value=";*=hidden">-- blank --</span>
</div>
```

Live result:

<section>
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="example.model@app;" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>juse.import("juse/model").define("app.context");</script>

<div id="example">
	foo: <input data-value="#foo" data-event="enter:#clear" type="text" placeholder="enter foo here"><br>
	bar: <input data-value="#bar" data-event="enter:#clear" type="text" placeholder="enter bar here"><br>
	baz: <input data-value="#baz" data-event="enter:#clear" type="text" placeholder="enter baz here"><br>
	map: <ul data-value="map:"><li>%{}</li></ul>
	<span data-value=";*=hidden">-- blank --</span>
</div>
</section>
