# list@juse/model

Binder that manages list value tile:
* inits tile from binding specs and tile node content
* updates model value based on binding specs
* renders tile node based on binding specs

Tile binding specs:
* data-value, tile value spec

Example:

```
<div id="example">
	input: <input data-value data-event="enter:#clear" type="text" placeholder="enter value here"><br>
	list: <ul data-value="list:"><li>%{}</li></ul>
	<span data-value=";*:hidden">-- blank --</span>
</div>
```

<div id="example" class="markdown-body px-3 my-5">
	input: <input data-value data-event="enter:#clear" type="text" placeholder="enter value here"><br>
	list: <ul data-value="list:"><li>%{}</li></ul>
	<span data-value=";*:hidden">-- blank --</span>
</div>

<script src="../../../juse.js" data-app="example.model@app;"></script>
<script>juse("app.context", ["juse/model"]);</script>
