# validate@juse/valid

Module to evaluate validation rules.

Example:

```
juse(["validate"], function mymodule($validate, $scope){
	...
	var messages = $validate.call($scope, "myvalidator", null, "myvalue");
	// messages: ["myvalidator: value missing for myvalue"]
	...
});
```
