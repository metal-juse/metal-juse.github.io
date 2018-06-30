juse(".context", ["juse/run"], function service(){
	this.juse(".classifier", ["promise", "follower"], function provider($promise, $follower, $scope){
		return juse.seal(function provider(){
			addProviders.call(this, this.meta.provide);
		}, fire);

		function addProviders(spec) {
			if (juse.typeOf(spec, "array")) {
				spec.forEach(addProvider, this);
			} else if (juse.typeOf(spec, "string")) {
				addProvider.call(this, spec);
			}
		}

		function addProvider(spec) {
			var event = juse.toRef(spec||this.spec);
			$scope.contextOf(event).cacheValue("providers", event.name, juse.toRef(event.value||"", this.spec));
		}

		function fire(spec, value) {
			var event = juse.toRef(spec);
			var provide = juse.lookup($scope.contextOf(event).cacheValue("providers", event.name));
			var args = {event:event, value:value};
			if (juse.typeOf(provide, "function")) {
				return $promise(provide.bind(args)).then(resolve.bind(args), reject.bind(args));
			} else {
				return $promise.reject(Error("provider not found for: " + juse.toSpec(event))).then(null, reject.bind(args));
			}
		}

		function resolve(value) {
			$follower.notify(this.event, value);
			return $promise.resolve(value);
		}

		function reject(value) {
			$follower.notify(this.event, null, value);
			return $promise.reject(value);
		}
	});
});
