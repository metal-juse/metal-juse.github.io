# value@[juse/model](../../juse/model)

Binder that manages value tile:
* inits tile from binding specs
* updates model value based on input tile value spec
* renders tile node based on tile value spec

Tile binding specs:
* data-value, tile value spec

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example.model@app;"></script>
<script>juse("app.context", ["juse/model"]);</script>

<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [<span data-value="; -- blank -- "></span>]
</div>
```

Live result:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example.model@app;"></script>
<script>juse("app.context", ["juse/model"]);</script>

<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [<span data-value="; -- blank -- "></span>]
</div>
</section>
