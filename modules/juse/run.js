juse(".context", function run(){

	this.juse(["promise"]);

	this.juse("try", function $try(){
		return function $try(fn, args, error, target){
			try {
				return fn.apply(target, args);
			} catch (ex) {
				if (error) error.ex = ex;
				return error;
			}
		};
	});

	this.juse(["try"], function async($try){
		var callAsync = typeof setImmediate == "function" ? setImmediate : setTimeout;
		var $buffer = [];

		return function async(callback){
			if (!$buffer.length) {
				callAsync(flush);
			}
			$buffer.push(callback);
		};

		function flush() {
			var error = {};
			while ($buffer.length) {
				if ($try($buffer.shift(), null, error) === error) {
					juse.log("error", error.ex);
				}
			}
		}

	});

});
