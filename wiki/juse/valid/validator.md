# validator.classifier@[juse/valid](../../juse/valid)

Classifier to register validation rules.

Example:

```html
juse(".validator", function myvalidator(){
	return function myvalidator(spec, value, ref) {
		return value ? "" : "myvalidator: value missing for " + ref);
	};
});
```
