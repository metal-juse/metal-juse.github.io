# input@juse/model

Binder that manages input value tile:
* inits tile from binding specs
* binds tile node to dom input event and handles input value
* renders tile node based on tile value spec

Tile binding specs:
* data-value, tile value spec
* data-valid, validation spec
* data-event, event spec

Example:

```
<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [%{; -- blank -- }]
</div>
```

<div id="example">
	input: <input data-value type="text" placeholder="enter value here"><br>
	value: [%{; -- blank -- }]
</div>

<script src="../../../juse.js" data-app="example.model@app;"></script>
<script>juse("app.context", ["juse/model"]);</script>
