# validate@[juse/valid](../../juse/valid)

Module to evaluate validation rules.

Example:

```html
juse(["validate"], function mymodule($validate, $scope){
	...
	var messages = $validate.call($scope, "myvalidator", null, "myvalue");
	// messages: ["myvalidator: value missing for myvalue"]
	...
});
```
