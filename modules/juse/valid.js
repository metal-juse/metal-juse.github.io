juse(".context", ["juse/text"], function valid($text, $context){

	this.juse(".classifier", function validator(){
		return function validator(value){
			$context.cacheValue("validators", this.spec.name, value);
		};
	});

	this.juse(function validate(){
		return function validate(spec, value, ref){
			var messages;
			for (spec = juse.toRef(spec); spec; spec = juse.toRef(spec.value)) {
				var name = spec.kind || spec.name;
				var validator = $context.cacheValue("validators", name);
				var message = juse.typeOf(validator, "function") && validator.call(this, value, ref);
				messages = addMessage(messages, message);
			}
			return messages;
		};

		function addMessage(messages, message) {
			if (message) {
				messages = messages || [];
				messages.push(message);
			}
			return messages;
		}
	});

	this.juse(".validator", ["replace"], function required($replace){
		return function required(value, ref) {
			return value ? "" : $replace(juse.lookup("#required.message", this) || "required: ${0}", juse.toSpec(ref));
		};
	});

});
