juse(".context", function text(){

	this.juse(["eval"], function replace($eval, $scope){
		var $replaceFormat = /\$\{([^\}]+)\}/g;
		var $testFormat = /\$\{([^\}]+)\}/;

		return function replace(text, dataset){
			$eval = $eval || juse.lookup("eval", $scope);
			var scope = this;
			var args = arguments;
			if (!text || typeof(text) != "string" || !$testFormat.test(text)) return text;
			return text.replace($replaceFormat, function(match, spec) {
				var value = match;
				var idx = parseInt(spec)+1;
				if (idx) {
					if (idx in args) value = args[idx];
				} else {
					value = $eval.call(scope, spec, dataset) || value;
				}
				return value;
			});
		};
	});

	this.juse(["map", "replace"], function eval($map, $replace, $scope){
		return function eval(spec, dataset) {
			$replace = $replace || juse.lookup("replace", $scope);
			var ref = juse.toRef(spec);
			var value = juse.filter(ref, this, dataset);
			value = dataset === undefined ? value || juse.lookup(ref, this) : value;
			var map = juse.filter(ref.value, this) || $map(ref.value);
			if (map) {
				value = (juse.typeOf(value, "array") && !value.length || juse.typeOf(value, "object") && !Object.keys(value).length) ? null : value;
				var value2 = juse.memberName(map, value) ? map[value]
						: (value && "*" in map) ? map["*"]
								: (!value && "" in map) ? map[""] : value;
				if (value2 !== value) value = $replace.call(this, value2, value);
			}
			return value;
		};
	});

	this.juse(function map(){
		return function map(spec){
			var map = {};
			for (var ref = juse.toRef(spec); ref; ref = juse.toRef(ref.value)) {
				map[ref.kind||""] = ref.name;
			}
			return map;
		};
	});

});
