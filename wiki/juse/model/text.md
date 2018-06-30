# text@juse/model

Binder that manages text tile:
* inits tile from text binding specs %{spec}
* renders tile node text based on binding specs

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
