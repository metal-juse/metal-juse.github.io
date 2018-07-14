# validator.classifier@juse/valid

Classifier to register validation rules.

Example:

```
juse(".validator", function myvalidator(){
	return function myvalidator(spec, value, ref) {
		return value ? "" : "myvalidator: value missing for " + ref);
	};
});
```
