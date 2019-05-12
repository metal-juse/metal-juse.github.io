juse.import("promise").define(function(promise){
	var adapter = {
			resolved: function(value) {
				return promise(function(resolve, reject){
					resolve(value);
				});
			},
			rejected: function(value) {
				return promise(function(resolve, reject){
					reject(value);
				});
			},
			deferred: function() {
				var scope = { resolve:null, reject:null };
				var $resolve = function(value) { this.resolve(value); }
				var $reject = function(value) { this.reject(value); }
				var $callback = function(resolve, reject) {
					this.resolve = resolve;
					this.reject = reject;
				}

				return {
					promise: promise($callback.bind(scope)),
					resolve: $resolve.bind(scope),
					reject: $reject.bind(scope)
				};
			}
		};

	var promisesAplusTests = require("promises-aplus-tests");

	promisesAplusTests(adapter, function (err) {
	    // All done; output is in the console. Or check `err` for number of failures.
		juse.log("error: ", err);
	});

});


