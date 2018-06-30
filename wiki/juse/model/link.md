# link@juse/model

Binder that manages link value tile:
* inits tile from binding specs
* binds tile node to dom input event and handles input value
* renders tile node of linked model based on tile value spec

Tile binding specs:
* data-value, tile value spec
* data-event, event spec

Example:

```
<div id="example">
	<div data-model>
		input: <input data-value type="text" placeholder="enter value here">
		<input data-value="link:values" type="button" value="enter">
		<input data-value type="button" value="delete">
	</div>
	list: <ul data-value="list:values"><li data-value="link:">%{}</li></ul>
	<span data-value="values;*:hidden">-- blank --</span>
</div>
```

<div id="example" class="markdown-body px-3 my-5">
	<div data-model>
		input: <input data-value type="text" placeholder="enter value here">
		<input data-value="link:values" type="button" value="enter">
		<input data-value type="button" value="delete">
	</div>
	list: <ul data-value="list:values"><li data-value="link:">%{}</li></ul>
	<span data-value="values;*:hidden">-- blank --</span>
</div>

<script src="../../../juse.js" data-app="example.model@app;"></script>
<script>juse("app.context", ["juse/model"]);</script>
