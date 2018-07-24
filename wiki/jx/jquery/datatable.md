# datatable@[jx/jquery](../../jx/jquery)

Module to adapt jQuery plugin DataTables:
* inits tile from datatable specs

Tile binding specs:
* data-datatable, datatable init spec

Example:

```
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example.model@app;"></script>
<script>juse("app.context", ["jx/jquery"], function(){
	this.juse(["datatable@jx/jquery"]);
});</script>

<div id="example">
	<table data-datatable>
		<thead>
			<tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr>
		</thead>
		<tbody>
			<tr><td>aaa</td><td>bbb</td><td>ccc</td></tr>
			<tr><td>foo</td><td>bar</td><td>baz</td></tr>
			<tr><td>111</td><td>222</td><td>333</td></tr>
		</tbody>
		<tfoot><tr><td colspan="3" style="text-align:center;">Footer</td></tr></tfoot>
	</table
</div>
```

<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script>juse("app.context", ["jx/jquery"], function(){
	this.juse(["datatable@jx/jquery"]);
});</script>

<div id="example">
	<table data-datatable>
		<thead>
			<tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr>
		</thead>
		<tbody>
			<tr><td>aaa</td><td>bbb</td><td>ccc</td></tr>
			<tr><td>foo</td><td>bar</td><td>baz</td></tr>
			<tr><td>111</td><td>222</td><td>333</td></tr>
		</tbody>
		<tfoot><tr><td colspan="3" style="text-align:center;">Footer</td></tr></tfoot>
	</table
</div>
