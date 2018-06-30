juse(".classifier", ["try", "async"], function promise($try, $async){

	var $outer, $error = {};

	return juse.seal(promise,
		function resolve(value){
			return promise(function(resolve, reject){
				resolve(value);
			});
		},
		function reject(reason){
			return promise(function(resolve, reject){
				reject(reason);
			});
		}
	);

	function promise(callback){
		if (typeof callback != "function") {
			throw TypeError("not a function: " + callback);
		}
		var promise = makePromise();
		var result = $try(resolve, [promise, callback], $error);
		if (result === $error) {
			settle(promise, "rejected", $error.ex);
		}
		return promise.handle;
	}

	function get(object, name) {
		return object && object[name];
	}

	function Promise(then_, catch_) {
		this["then"] = then_;
		this["catch"] = catch_;
	}

	function makePromise(parent, fulfilled, rejected) {
		var promise = {depth:0};
		promise.handle = new Promise(then.bind(promise), then.bind(promise, null));
		if (parent) {
			parent.children = parent.children || [];
			parent.children.push(promise);
			promise.fulfilled = fulfilled;
			promise.rejected = rejected;
		}
		if ($outer) {
			$outer.inner = promise;
			promise.outer = $outer;
		}
		return promise;
	}

	function then(fulfilled, rejected) {
		var promise = makePromise(this, fulfilled, rejected);
		notifyAsync.call(this, promise);
		return promise.handle;
	}

	function deliver(depth, state, value) {
		if (this.depth >= depth || this.state) return;
		this.depth = depth;
		if (settle(this, state, value)) {
			notifyAll(this);
		}
	}

	function resolve(promise, callback, target) {
		callback.call(target, deliver.bind(promise, promise.depth+1, "fulfilled"), deliver.bind(promise, promise.depth+1, "rejected"));
	}

	function notifyAll(promise) {
		if (!promise.state) return;
		if (promise.children) {
			promise.children.forEach(notifyAsync, promise);
		} else if (promise.outer) {
			notifyAsync.call(promise, promise.outer);
		}
	}

	function notifyAsync(promise) {
		var settled = this;
		if (!settled.state || promise.state) return;
		$async(function(){
			if (notify(promise, settled)) {
				notifyAll(promise);
			}
		});
	}

	function notify(promise, settled) {
		if (!settled.state || promise.state) return;
		var state = settled.state;
		var value = settled.value;
		if (typeof promise[state] == "function") {
			$outer = promise;
			value = $try(promise[state], [value], $error);
			if (value !== $error) {
				state = "fulfilled";
			} else {
				value = $error.ex;
				state = "rejected";
			}
			$outer = null;
		}
		return settle(promise, state, value);
	}

	function settle(promise, state, value) {
		if (promise.handle === value) {
			value = TypeError("cyclic promise");
			state = "rejected";
		} else if (promise.inner && promise.inner.handle === value) {
			var settled = promise.inner;
			while (settled) {
				if (settled.state) {
					state = settled.state;
					value = settled.value;
					break;
				}
				settled = settled.inner;
			}
		}
		var callback = $try(get, [value, "then"], $error);
		if (callback === $error) {
			value = $error.ex;
			state = "rejected";
		}
		if (typeof callback == "function" && (typeof value == "object" || typeof value == "function")) {
			if (state == "fulfilled") {
				var depth = promise.depth;
				var result = $try(resolve, [promise, callback, value], $error);
				if (result !== $error || depth < promise.depth) {
					return false;
				} else {
					value = $error.ex;
					state = "rejected";
				}
			}
		}
		promise.state = state;
		promise.value = value;
		return true;
	}

});
