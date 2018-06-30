juse(".context", ["run"], function remote(){

	this.juse(["promise"], function request($promise){
		return function request(spec, args/*data, method, headers*/) {
			var req = { spec:spec, url:juse.toPath(juse.resolve(spec, this)), args:args||{}, scope:this };
			return $promise(sendRequest.bind(req));
		};
	});

	function sendRequest(resolve, reject) {
		try {
			newRequest.call(this, resolve, reject).send(this.data);
		} catch (ex) {
			reject.call(this.scope, ex);
		}
	}

	function newRequest(resolve, reject) {
		this.xhr = new XMLHttpRequest();
		var method = (this.args.method||"GET").toUpperCase();
		switch (method) {
		case "GET":
			this.data = null;
			this.xhr.open(method, [this.url, keyValues(this.args.data)].filter(juse.memberValue).join("?"), true);
			break;
		case "POST":
			this.data = keyValues(this.args.data);
			this.xhr.open(method, this.url, true);
			this.xhr.setRequestHeader("Content-Length", this.data.length);
			this.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			break;
		default:
			throw Error("method not supported: " + method);
		}
		this.xhr.onreadystatechange = handleResponse.bind(this, resolve, reject);
		if (this.args.headers) {
			Object.keys(this.args.headers).forEach(setHeader, this);
		}
		return this.xhr;
	}

	function handleResponse(resolve, reject) {
		if (this.xhr.readyState != 4) return;
		if (this.xhr.status == 200 || this.xhr.status == 0 && this.xhr.responseText) {
			try {
				this.value = juse.filter(this.spec, this.scope, this.xhr.responseText);
			} catch (ex) {
				this.error = ex;
			}
		} else {
			this.error = Error(this.xhr.statusText||"Not Found");
			this.error.code = this.xhr.status||404;
		}
		if (this.error) {
			reject.call(this.scope, this.error);
		} else {
			resolve.call(this.scope, this.value);
		}
	}

	function setHeader(key) {
		this.xhr.setRequestHeader(key, this.args.headers[key]);
	}

	function keyValues(params) {
		return juse.typeOf(params, "object") ? Object.keys(params).map(keyValue, params).join('&') : params;
	}

	function keyValue(key) {
		return [encodeURIComponent(key), encodeURIComponent(this[key])].join("=");
	}

});
