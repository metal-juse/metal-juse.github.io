# [<<](..) Module Configuration

* Context is also the place to define or source configuration settings (or properties).
* Module obtains property by calling `$scope.context.property(key)`.
* Context properties are populated by the following means in descending precedence:
    * calling `this.property(key, value)` in the context initializer callback
    * returned by the context initializer callback as `{ "properties": { key: value }}`
    * loaded from external source by calling `this.define(["some.properties"])` in the context initializer callback
    * calling `$scope.context.property(key, value)` where the property is needed, and is not yet associated with any value

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example@app"></script>
<script>
define("app.context", ["juse/resource"], function(){
	this.define(["config.properties"]);
	this.property("property-1", "from property(key, value) call; ");
	
	this.define("example", ["html"], function($html, $scope){
		return function(){
			return $html("<ul>" +
					"<li>property-1: " + $scope.context.property("property-1", "from default value; ") + "</li>" +
					"<li>property-2: " + $scope.context.property("property-2", "from default value; ") + "</li>" +
					"<li>property-3: " + $scope.context.property("property-3", "from default value; ") + "</li>" +
					"<li>property-4: " + $scope.context.property("property-4", "from default value; ") + "</li>" +
				"</ul>");
		}
	});
	
	return {
		map: {"*.properties":"properties:"},
		"properties": {
			"property-1": "from context properties initializer; ",
			"property-2": "from context properties initializer; "
		}
	};
});
</script>
```

At line 2, the **main** module is declared as `example@app`.

At line 5, file `config.properties` is sourced, and at line 6, property `property-1` is defined in the context initializer callback.

At lines 21-24, properties are returned as part of context initializer value.

At lines 11-14, property values are accessed in the **main** module and are later added to the document body.

The code can be copy/pasted into a standalone html file and opened in a browser.
It is also executed right here, and the **main** module value is:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example@app"></script>
<script>
define("app.context", ["juse/resource"], function(){
	this.define(["config.properties"]);
	this.property("property-1", "from property(key, value) call; ");
	
	this.define("example", ["html"], function($html, $scope){
		return function(){
			return $html("<ul>" +
					"<li>property-1: " + $scope.context.property("property-1", "from default value; ") + "</li>" +
					"<li>property-2: " + $scope.context.property("property-2", "from default value; ") + "</li>" +
					"<li>property-3: " + $scope.context.property("property-3", "from default value; ") + "</li>" +
					"<li>property-4: " + $scope.context.property("property-4", "from default value; ") + "</li>" +
				"</ul>");
		}
	});
	
	return {
		map: {"*.properties":"properties:"},
		"properties": {
			"property-1": "from context properties initializer; ",
			"property-2": "from context properties initializer; "
		}
	};
});
</script>
</section>
