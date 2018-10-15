# [<<](..) Module Configuration

* Module is configured by context properties.
* Module obtains context property by calling context.property(key, value). The call returns the existing property, if not it sets the property and returns the value.
* Context property is populated by one of the following ways:
    * context.property(key, value)
    * in context value initializer, return { "properties": { key: value }}
    * in context scope, this.define(["some.properties"])

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example@app"></script>
<script>
define("app.context", ["juse/resource"], function(){
	this.define(["config.properties"]);
	this.property("property-1", "from property call; ");
	
	this.define("example", function($scope){
		return function(){
			return	"property-1 = " + $scope.context.property("property-1", "from default value; ") +
					"property-2 = " + $scope.context.property("property-2", "from default value; ") +
					"property-3 = " + $scope.context.property("property-3", "from default value; ") +
					"property-4 = " + $scope.context.property("property-4", "from default value; ");
		}
	});
	
	return {
		map: {"*.properties":"properties:"},
		"properties": {
			"property-1": "from context properties; ",
			"property-2": "from context properties; "
		}
	};
});
</script>
```

At line 2, the script tag loads the **juse** bootstrap script and declares the **main** module `example`.

At line 4, the **main** module `example` is defined via the global function `define`, and its value is then added to the document body.

The code can be copy/pasted into a standalone html file and opened in a browser.
It is also executed right here, and the **main** module value is:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="example@app"></script>
<script>
define("app.context", ["juse/resource"], function(){
	this.define(["config.properties"]);
	this.property("property-1", "from property call; ");
	
	this.define("example", function($scope){
		return function(){
			return	"property-1 = " + $scope.context.property("property-1", "from default value; ") +
					"property-2 = " + $scope.context.property("property-2", "from default value; ") +
					"property-3 = " + $scope.context.property("property-3", "from default value; ") +
					"property-4 = " + $scope.context.property("property-4", "from default value; ");
		}
	});
	
	return {
		map: {"*.properties":"properties:"},
		"properties": {
			"property-1": "from context properties; ",
			"property-2": "from context properties; "
		}
	};
});
</script>
</section>
