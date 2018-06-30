# value@juse/model

Binder that manages value tile:
* inits tile from binding specs
* updates model value based on input tile value spec
* renders tile node based on tile value spec

Tile binding specs:
* data-value, tile value spec

Example:

```
<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [<span data-value="; -- blank -- "></span>]
</div>
```

<div id="example" class="markdown-body px-3 my-5">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [<span data-value="; -- blank -- "></span>]
</div>

<script src="../../../juse.js" data-app="example.model@app;"></script>
<script>juse("app.context", ["juse/model"]);</script>
