/**
 * Another AMD inspired framework to manage modules and dependencies.
 */
(function(){

	var $defArgKeys = ["spec", "refs", "value"];
	var $baseKeys = ["kind", "context"];
	var $refKeys = ["kind", "name", "type", "member", "context", "pipe", "value"];
	var $refFormatKeys = [""].concat($refKeys);
	var $refFormat = /(?:\s*([^.#@|;\s]*)\s*:)?\s*([^.#@|;]*)(?:\.([^#@|;\s]*))?(?:#([^@|;\s]*))?(?:@([^|;\s]*))?(?:\s*\|\s*([^;\s]*))?(?:\s*;\s*([\S\s]*))?/;
	var $refDelims = [":", "", ".", "#", "@", "|", ";"];
	var $fnFormatKeys = ["", "name", "value"];
	var $fnFormat = /function\s*([\S]*?)\s*\([^)]*\)\s*{\s*(?:\/\*\*+\s*([\S\s]*?)\s*\*\*+\/)?/;
	var $metaFormat = /^[\s*]*@([^\s]+)[ \f\r\t\v]*([^\n]*\S)?\s*/;
	var $flushStates = enums(["BUFFER", "LOAD", "DEFINE", "RESOLVE", "READY", "FLUSH", "DONE", "ERROR"]);
	var $logKeys = enums(["error", "warn", "info", "debug"]);
	var $boot = {
		buffer: [],
		flushCount: 0,
		moduleCount: 0,
		fn: function(){},
		global: this.document ? this : this.global||this
	};

	/** @member boot */
	return function boot(){
		if ($boot.global.juse) return;
		$boot.global.juse = juse;
		$boot.doc = $boot.global.document;
		if ($boot.doc) {
			$boot.async = !!$boot.doc.currentScript;
			$boot.script = currentScript();
			$boot.jusePath = slicePath($boot.script.getAttribute("src"), -1);
			$boot.app = toRef($boot.script.getAttribute("data-app")||"");
			if ($boot.doc.head != $boot.script.parentNode) {
				$boot.doc.head.appendChild($boot.script);
			}
		} else {
			$boot.jusePath = __dirname;
			$boot.app = toRef(process.argv[2]||"");
		}

		log("--boot--");
		defineRoot();
		if ($boot.doc) {
			$boot.global.addEventListener("hashchange", loadApp);
			$boot.global.addEventListener("load", loadApp);
		} else {
			loadApp();
		}
	};

	/** @member boot */
	function done() {
		if ($boot.doc) log($boot);
		log("--done--");
	}

	/** @member boot */
	function loadApp() {
		/** @provide juse/app/load **/
		var app = toRef(currentHash(), currentApp());
		var context = toRef(app.context||"");
		app.context = context.name || app.context;
		$boot.appPath = context.kind || toRef($boot.app.context||"").kind;
		getContext().scope.juse([toRef(app.context, ".context")], function(){
			getContext().scope.juse([app, "follower"], function($app, $follower){
				if ($follower.notify("juse/app/load", app)) {
					currentApp(app);
				} else if (typeOf($app, "function")) {
					$app();
				}
				if (!$follower.notify("juse/app/done", app)) {
					setTimeout(done);
				}
			});
		});
	}

	/** @member boot */
	function defineRoot() {
		juse(".context", function root(){

			this.juse(function juse(){
				return seal(this.context.juse,
					{global: $boot.global},
					toRef,
					toPath,
					toSpec,
					resolve,
					lookup,
					filter,
					memberName,
					memberValue,
					typeOf,
					valueOf,
					copyTo,
					seal
				);
			});

			this.juse("juse/cache.classifier", function cache(){
				return function cache(value){
					getModule(this.spec).cache = copyTo({}, value);
					this.cacheEntry = cacheEntry;
					this.cacheValue = cacheValue;
					this.cacheLookup = cacheLookup;
				};

				function cacheValue(name, member, value) {
					var cache = this.cacheEntry(name);
					if (value !== undefined) cache[member] = cache[member] || value;
					return cache[member];
				}

				function cacheLookup(name, member) {
					var cache = this.cacheEntry(name);
					for (var name in cache) {
						var value = memberValue(cache, name, member);
						if (value) return value;
					}
				}

				function cacheEntry(name) {
					var cache = getModule(this.spec).cache;
					return cache[name] = cache[name] || {};
				}
			});

			this.juse("juse/context.classifier", ["cache"], function context($cache){
				$cache.call(this.context, initContext({
					map: { "*": "modules:" }
				}));
				return function context(value){
					$cache.call(this, initContext(value));
					return {};
				};

				function initContext(value) {
					if (value && value.map) initContextMap(value.map);
					if (value && value.remap) Object.keys(value.remap).map(valueOf, value.remap).forEach(initContextMap);
					return value;
				}

				function initContextMap(map) {
					if (map) copyTo(map, Object.keys(map).map(valueOf, map).map(toRef), Object.keys(map), true, true);
				}
			});

			this.juse("juse/follower.classifier", function follower($scope){
				return juse.seal(function follower(){
					addFollowers.call(this, this.meta.follow);
				}, notify);

				function addFollowers(spec) {
					if (typeOf(spec, "array")) {
						spec.forEach(addFollower, this);
					} else if (typeOf(spec, "string")) {
						addFollower.call(this, spec);
					}
				}

				function getFollowers(event) {
					return $scope.contextOf(event).cacheValue("followers", event.name, []);
				}

				function addFollower(spec) {
					var event = toRef(spec||this.spec);
					getFollowers(event).push(toRef(event.value||"#follow", this.spec));
				}

				function notify(spec, value, error) {
					var args = {event:toRef(spec), value:value, error:error};
					getFollowers(args.event).forEach(notifyFollower, args);
				}

				function notifyFollower(spec) {
					var follow = lookup(spec);
					if (typeOf(follow, "function")) {
						try {
							return follow(this.event, this.value, this.error);
						} catch (ex) {
							$scope.log("error", ex);
						}
					}
				}
			});

			this.juse("juse/classifier.classifier", ["follower"], function classifier($follower){
				initClassifier(this);
				initClassifier(getModule(toRef("juse/cache")).scope);
				initClassifier(getModule(toRef("juse/context")).scope);
				initClassifier(getModule(toRef("juse/follower")).scope);

				return function classifier(){
					initClassifier(this);
				};

				function initClassifier(scope) {
					scope.context.cacheValue("map", scope.meta.name||scope.spec.name, scope.spec);
					scope.contextOf = contextOf;
					$follower.call(scope);
				}

				function contextOf(spec) {
					return getContext(toRef(spec)).scope;
				}
			});

			function resolve(spec, scope) {
				return remap(spec, getModule(scope && scope.spec || currentApp()));
			}

			function lookup(spec, scope) {
				var ref = toRef(spec);
				if (ref) {
					return ref.name ? memberValue(getModuleValue(resolve(ref, scope)), ref.member) :
						scope.context.cacheLookup("properties", ref.member) || scope.meta[ref.member];
				}
			}

			function filter(spec, scope, value) {
				var ref = toRef(spec);
				if (!ref) return;
				var module = getModule(scope && scope.spec || currentApp());
				if (value !== undefined) {
					value = applyFilters(value, ref, "type", module);
					value = applyFilters(memberValue(value, ref.member), ref, "pipe", module);
				} else {
					value = filterRefValue.call(module, resolve(ref, scope));
				}
				return value;
			}
		});
	}

	/** @member define */
	function juse(spec, refs, value) {
		var def = resolveDef(currentSpec(), getDefArgs([spec, refs, value], arguments.length), this);
		var module = getModule(def);
		if (module && isError(module)) setModule(def);
		if (!module || isPending(module)) {
			log("define:", toSpec(def));
			module = makeModule(def, $flushStates.DEFINE);
			$boot.context = $boot.context || module;
			if (this == $boot.global || $boot.buffer.length == 1) {
				flush();
			}
		}
	}

	/** @member define */
	function resolveDef(spec, args, scope) {
		var def = scope ? {meta:{}, args:args, refs:[]} : {args:{}, spec:spec};
		if (scope) {
			def.spec = toRef(def.args.spec, spec);
			def.value_ = getMetaSpec(def.meta, def.args.value);
		}
		if (!scope || !$boot.context) {
			copyTo(def, def.spec);
		} else if (scope != $boot.global) {
			def.spec = toRef(def.args.spec, {name:def.meta.name, context:scope.spec.name});
			copyTo(def, {name:def.spec.name, context:def.spec.context});
		} else {
			copyTo(def, spec);
			copyTo(def, getRefMap(def, def, true), $refKeys, true, true);
			copyTo(def, {name:def.spec.name||def.meta.name, type:def.spec.type=="context"&&"context"});
		}
		return def;
	}

	/** @member define */
	function makeModule(def, flushState) {
		var module = getModule(def) || {};
		copyTo(module, def, $refKeys, true, true);
		module.def = def;
		module.flushState = flushState;
		if (!getModule(def)) {
			module.id = $boot.moduleCount++;
			if (!setModule(def, module)) return;
			$boot.buffer.push(module);
		}
		return module;
	}

	/** @member define */
	function getDefArgs(args, count) {
		if (count < $defArgKeys.length) {
			if (typeOf(args[0], "array")) {
				args.unshift("");
			} else if (count < 2) {
				args.unshift("", null);
			} else if (!typeOf(args[1], "array")) {
				args.splice(1, 0, null);
			}
		}
		return copyTo({}, args, $defArgKeys);
	}

	/** @member define */
	function getMetaSpec(meta, value) {
		var values = typeOf(value, "function") && $fnFormat.exec($boot.fn.toString.call(value));
		copyTo(meta, values, $fnFormatKeys);
		value = meta.value;
		delete meta.value;
		while (values = $metaFormat.exec(value)) {
			var key = values[1], val = values[2]||"";
			if (!meta[key]) {
				meta[key] = val;
			} else {
				if (!typeOf(meta[key], "array")) {
					meta[key] = [meta[key]];
				}
				meta[key].push(val);
			}
			value = value.substring(values.index + values[0].length);
		}
		return value;
	}

	/** @member module */
	function getContext(ref, context) {
		var name = typeOf(ref, "object") ? ref.context||context : ref;
		return name ? memberValue($boot.context, "modules", name) : $boot.context;
	}

	/** @member module */
	function getModule(ref, i, a, context) {
		return (ref.type == "context") ? getContext(ref.name) : memberValue(getContext(ref, context), "modules", getModuleName(ref));
	}

	/** @member module */
	function getModuleValue(ref) {
		return memberValue(getModule(ref), "value");
	}

	/** @member module */
	function getModuleName(ref, type) {
		var name = typeOf(ref, "object") ? ref.name : ref;
		type = (ref.type && ref.type != "context" && ref.type != "js") ? ref.type : type;
		return type ? [name, type].join(".") : name;
	}

	/** @member module */
	function setModule(ref, module) {
		if (ref.name) {
			var context = getContext(ref);
			if (context) context.modules[getModuleName(ref)] = module;
			else if (ref.context) {
				log("warn", "undefined context:", ref.context);
				return;
			}
		}
		return module;
	}

	/** @member resolve */
	function resolveRef(spec) {
		return remap(spec, this);
	}

	/** @member resolve */
	function remapRef(spec) {
		return remap(spec, this, true);
	}

	/** @member resolve */
	function remap(spec, module, mapOnly) {
		var ref = toRef({}, spec);
		if (!ref.name) return;
		if (!module) return ref;
		var target = !mapOnly && getModule(ref, null, null, module.context);
		var map = getRefMap(ref, module, true);
		if (map || !target || target == module) {
			map = map || getRefMap(ref, module);
			if (mapOnly && !map) return;
			copyTo(ref, map, $refKeys, true, true);
			if (!map) {
				ref.name = getRefName(ref, module);
			}
		}
		if (ref.type && ref.type != module.type) {
			copyTo(ref, getRefMap(getModuleName("*", ref.type), module));
		}
		if (module != $boot.context && ref.context || ref.name.indexOf("juse/")==0) {
			copyTo(ref, getRefMap("*", module));
		}
		if (ref.name.indexOf("juse/")!=0) {
			copyTo(ref, module, $baseKeys);
		}
		if (module != $boot.context && ref.context || module.type == "context") {
			copyTo(ref, getRefMap("*", module));
		}
		return ref;
	}

	/** @member resolve */
	function getRefMap(ref, module, remapOnly) {
		var refKey = typeOf(ref, "object") ? getModuleName(ref, ref.type) : ref;
		var moduleKey = getModuleName(module, module.type);
		var remap = memberValue(getContext($boot.app), "cache", "remap", moduleKey, refKey)
			|| memberValue(getContext(module), "cache", "remap", moduleKey, refKey)
		return remapOnly ? remap : remap
			|| memberValue(getContext($boot.app), "cache", "map", refKey)
			|| memberValue(getContext(module), "cache", "map", refKey)
			|| memberValue(getContext(), "cache", "map", refKey)
			|| module.name && contextRefMaps(module, refKey);
	}

	/** @member resolve */
	function contextRefMaps(module, refKey) {
		var args = {refKey:refKey};
		return getContext(module).refs.some(contextRefMap, args) && args.value;
	}

	/** @member resolve */
	function contextRefMap(ref) {
		return this.value = memberValue(getModule(ref), "cache", "map", this.refKey);
	}

	/** @member resolve */
	function getRefName(ref, module) {
		var absolute = "context" in ref || ref.name.indexOf("/") >= 0;
		var base = absolute ? null : slicePath(module.name, -1);
		return [base].concat(ref.name.split("/")).filter(memberValue).join("/");
	}

	/** @member filter */
	function filterRefValue(ref) {
		var module = ref && getModule(ref);
		if (!module) return;
		var value = applyFilters(module.value, module.def.spec, "pipe", module);
		if (ref.member && ref.member != module.member) {
			value = memberValue(value, ref.member);
		}
		return applyFilters(value, ref, "pipe", this);
	}

	/** @member filter */
	function resolveFilters(ref, key, module) {
		var delim = (key == "type") ? "." : "|";
		var mapper = (key == "type") ? remapRef : resolveRef;
		return (ref && ref[key]) ? ref[key].split(delim).map(mapper, module).filter(memberValue) : [];
	}

	/** @member filter */
	function applyFilters(value, ref, key, module) {
		return resolveFilters(ref, key, module).map(getModuleValue).reduce(applyFilter, {scope:module.scope, value:value}).value;
	}

	/** @member filter */
	function applyFilter(args, filter) {
		args.value = typeOf(filter, "function") && filter.call(args.scope, args.value) || args.value;
		return args;
	}

	/** @member flush */
	function flush() {
		clearTimeout($boot.flushTimeout);
		$boot.buffer.filter(isContext).filter(resolveRefs).forEach(bufferRefs);
		if (!$boot.buffer.some(isContextReady)) {
			$boot.buffer.filter(resolveRefs).forEach(bufferRefs);
		}
		if (!$boot.buffer.some(isPending)) {
			$boot.buffer.forEach(flushModule);
		}
		if ($boot.async || !$boot.buffer.some(isLoading)) {
			$boot.buffer.some(loadModule);
		}
		if ($boot.flushCount > $boot.moduleCount) {
			log($boot);
			log("--timeout--");
		} else if ($boot.buffer.some(isLoading)) {
			$boot.flushCount++;
			$boot.flushTimeout = setTimeout(flushPending, 1000);
		} else {
			$boot.buffer = $boot.buffer.filter(isFlushing);
			if ($boot.buffer.length && !$boot.buffer.some(isLoading)) {
				$boot.flushCount++;
				flush();
			} else if (!$boot.buffer.length) {
				$boot.flushCount = 0;
			}
		}
	}

	/** @member flush */
	function isPending(module) {
		return module.flushState < $flushStates.DEFINE;
	}

	/** @member flush */
	function isLoading(module) {
		return module.flushState == $flushStates.LOAD;
	}

	/** @member flush */
	function isError(module) {
		return module.flushState == $flushStates.ERROR;
	}

	/** @member flush */
	function isReady(module) {
		return module.flushState >= $flushStates.READY;
	}

	/** @member flush */
	function isFlushing(module) {
		return module.flushState < $flushStates.DONE;
	}

	/** @member flush */
	function isFlushed(module) {
		return module.flushState >= $flushStates.FLUSH;
	}

	/** @member flush */
	function isContext(module) {
		return module.type == "context";
	}

	/** @member flush */
	function isContextReady(module) {
		return isContext(module) && (module.flushState == $flushStates.READY || module.flushState == $flushStates.FLUSH);
	}

	/** @member flush */
	function allFlushed(module) {
		return isFlushed(module) && (!module.modules || Object.keys(module.modules).map(valueOf, module.modules).every(isFlushed));
	}

	/** @member flush */
	function resolveRefs(module) {
		if (module.flushState == $flushStates.DEFINE || module.flushState == $flushStates.RESOLVE) {
			module.flushState = $flushStates.RESOLVE;
			module.refs = [];
			if (module.def.args.refs) {
				module.def.refs = module.def.args.refs.map(resolveRef, module);
				module.refs.push.apply(module.refs, module.def.refs.filter(memberValue));
				module.def.refs.forEach(resolvePipe, module);
			}
			module.refs.push.apply(module.refs, resolveFilters(module.def.spec, "type", module));
			resolvePipe.call(module, module.def.spec);
			return true;
		}
	}

	/** @member flush */
	function resolvePipe(ref) {
		this.refs.push.apply(this.refs, resolveFilters(ref, "pipe", this));
	}

	/** @member flush */
	function bufferRefs(module) {
		if (module.flushState == $flushStates.RESOLVE) {
			if (!module.refs.every(getModule) && !getContext(module).refs.map(getModule).every(allFlushed)) return;
			module.flushState = $flushStates.READY;
			module.refs.forEach(bufferModule, module);
			if (typeOf(module.value, "string") && module.value && !external(module)) {
				module.flushState = $flushStates.BUFFER;
			}
		}
	}

	/** @member flush */
	function bufferModule(ref) {
		if (ref && !getModule(ref)) {
			log("buffer:", toSpec(ref), "by", toSpec(this));
			if (external(ref)) {
				makeModule(resolveDef(ref), $flushStates.DEFINE);
			} else if (!makeModule(resolveDef(ref), $flushStates.BUFFER)) {
				log("warn", "fail to buffer", toSpec(ref), "by", toSpec(this));
			}
		}
	}

	/** @member flush */
	function loadModule(module) {
		if (module.flushState == $flushStates.BUFFER) {
			module.flushState = $flushStates.LOAD;
			if (makeRequest(module.def)) {
				return !$boot.async;
			}
		}
	}

	/** @member flush */
	function failModule(module, i, a, error) {
		if (error || isPending(module)) {
			module.flushState = $flushStates.ERROR;
			module.value = error || Error("timeout error");
			log("error", toSpec(module.def), module.value.message);
		}
	}

	/** @member flush */
	function flushPending() {
		$boot.buffer.forEach(failModule);
		flush();
	}

	/** @member flush */
	function flushModule(module) {
		if (module.flushState == $flushStates.READY || module.flushState == $flushStates.FLUSH) {
			if (module.flushState == $flushStates.READY) {
				if (!module.refs.map(getModule).every(isReady)) return;
				module.flushState = $flushStates.FLUSH;
				module.refs.map(getModule).forEach(flushModule);
			}
			if (module.flushState == $flushStates.DONE) return;
			if (!module.refs.map(getModule).every(isFlushed)) return;
			if (!getContext(module).refs.map(getModule).every(allFlushed)) return;
			try {
				initModule(module);
				module.flushState = $flushStates.DONE;
			} catch (e) {
				failModule(module, null, null, e);
			}
		}
	}

	/** @member flush */
	function initModule(module) {
		log("init:", toSpec(module.def));
		if (module.type == "context") {
			module.modules = {};
		}
		initScope(module);
		module.value = typeOf(module.value, "string") ? external(module) :
			typeOf(module.def.args.value, "function") ? module.def.value_ : module.def.args.value;
		initValue(module);
	}

	/** @member flush */
	function initValue(module) {
		var filter;
		if (module.value) {
			filter = module.value = applyFilters(module.value, module.def.spec, "type", module);
		}
		if (typeOf(module.def.args.value, "function")) {
			var values = module.def.refs.map(filterRefValue, module);
			values.push(module.scope);
			module.scope.value = module.value;
			module.value = module.def.args.value.apply(module.scope, values) || module.value;
			delete module.scope.value;
		}
		if (!filter) {
			module.value = applyFilters(module.value, module.def.spec, "type", module);
		}
	}

	/** @member flush */
	function initScope(module) {
		var scope = module.scope = {spec:copyTo({}, module.def, $refKeys), meta:copyTo({}, module.def.meta), log:log};
		if (module.type == "context") {
			module.scope.juse = juse;
		} else {
			module.scope.context = getContext(module).scope;
			if (scope.context.cacheValue && (scope.meta.name||scope.spec.name)) {
				scope.context.cacheValue("map", scope.meta.name||scope.spec.name, scope.spec);
			}
		}
	}

	/** @member request */
	function makeRequest(ref) {
		if (!$boot.doc) {
			var path = toPath(ref);
			log("load:", toSpec(ref), "<-", path);
			$boot.currentSpec = ref;
			require(path);
			var module = getModule(ref);
			if (external(module)) {
				module.flushState = $flushStates.DEFINE;
			}
			return true;
		} else if (!getRequest(ref)) {
			var script = newRequest(ref);
			script.addEventListener("load", failRequest);
			script.addEventListener("error", failRequest);
			$boot.script.parentNode.insertBefore(script, $boot.script);
			return true;
		}
	}

	/** @member request */
	function failRequest(event) {
		var module = getModule(toRef(getSpec(event.target)));
		if (isPending(module)) {
			if (typeOf(module.value, "string") && event.type == "load") {
				if (external(module)) {
					module.flushState = $flushStates.DEFINE;
				}
			} else if (module.type == "css") {
				module.refs = [];
				module.flushState = $flushStates.DONE;
			} else {
				failModule(module, null, null, Error("response " + event.type));
			}
			flush();
		}
	}

	/** @member request */
	function getRequest(ref) {
		var script = $boot.script, spec = toSpec(ref);
		while (script = script.previousElementSibling) {
			if (getSpec(script) == spec) {
				return script;
			}
		}
	}

	/** @member request */
	function newRequest(ref) {
		var spec = toSpec(ref), path = toPath(ref);
		var tagName = ref.type == "css" ? "link" : "script";
		var script = $boot.doc.createElement(tagName);
		script.setAttribute("data-spec", spec);
		if (tagName == "link") {
			script.rel = "stylesheet";
			script.href = path;
			path = script.href;
		} else {
			script.async = $boot.async;
			script.src = path;
			path = script.src;
		}
		log("load:", spec, "<-", path);
		return script;
	}

	/** @member request */
	function getSpec(node) {
		return node.getAttribute("data-spec");
	}

	/** @member request */
	function currentScript() {
		var nodes;
		return $boot.doc.currentScript || ($boot.script && $boot.script.previousElementSibling) || (nodes = $boot.doc.getElementsByTagName("script"), nodes[nodes.length-1]);
	}

	/** @member request */
	function currentHash() {
		return $boot.doc ? $boot.global.location.hash.substring(1) : "";
	}

	/** @member request */
	function currentSpec() {
		return $boot.doc ? toRef(getSpec(currentScript())) : $boot.currentSpec;
	}

	/** @member request */
	function currentApp(app) {
		$boot.currentApp = app||$boot.currentApp;
		return $boot.currentApp||$boot.app;
	}

	/** @member ref */
	function toPath(spec) {
		var ref = toRef(spec);
		var path = ref.value;
		if (!path) {
			var context = getContext(ref);
			var name = getModuleName(ref, "js");
			name = context.kind ? [context.name, name].join("/") : name;
			var base = (name.indexOf("juse/") == 0 || $boot.doc) ? "" : ".";
			path = name.indexOf("juse/") == 0 ? $boot.jusePath : $boot.appPath;
			path = [base, path, ref.kind, name].filter(memberValue).join("/");
		}
		return path;
	}

	/** @member ref */
	function toRef(spec, base, keys) {
		if (typeOf(spec, "string")) spec = copyTo({}, $refFormat.exec(spec), $refFormatKeys);
		if (typeOf(base, "string")) base = copyTo({}, $refFormat.exec(base), $refFormatKeys);
		keys = typeOf(keys, "array") && keys || keys && spec && Object.keys(spec) || $refKeys;
		spec = copyTo(spec, base, keys, true);
		if (spec && spec.name) spec.name = spec.name.trim();
		return spec;
	}

	/** @member ref */
	function toSpec(ref) {
		var parts = [];
		for (var i = 0; i < $refKeys.length; i++) {
			var value = ref[$refKeys[i]];
			var delim = $refDelims[i];
			if (value || typeof(value) == "string" && delim) {
				if (i) parts.push(delim, value);
				else parts.push(value, delim);
			}
		}
		return parts.join("");
	}

	/** @member ref */
	function slicePath(path, index, count, delim) {
		if (!path) return path;
		index = index || 0;
		delim = delim || "/";
		var parts = path.split(delim);
		count = arguments.length>2 ? count : index<0 ? index : parts.length-index;
		var retain = count > 0;
		count = count>0 ? count : -count;
		var selected = parts.splice(index, count);
		return (retain ? selected : parts).join(delim);
	}

	/** @member util */
	function enums(names) {
		for (var i = 0; i < names.length; i++) {
			names[names[i]] = i;
		}
		return seal(names);
	}

	/** @member util */
	function seal(value) {
		for (var i = 1; i < arguments.length; i++) {
			copyValues(value, arguments[i]);
		}
		return Object.freeze(value);
	}

	/** @member util */
	function copyValues(to, from) {
		var name = typeOf(from, "function") && $fnFormat.exec($boot.fn.toString.call(from))[1];
		name ? (to[name] = from) : copyTo(to, from);
	}

	/** @member util */
	function copyTo(to, from, names, override, positive) {
		if (!to || !from) return to;
		if (typeOf(from, ["array","arguments"]) && names) {
			for (var i = 0; i < from.length; i++) {
				var name = names[i], value = from[i];
				copyValue(to, name, value, names, override, positive);
			}
		} else {
			var keys = Object.keys(from);
			for (var i = 0; i < keys.length; i++) {
				var name = keys[i], value = from[name];
				copyValue(to, name, value, names, override, positive);
			}
		}
		return to;
	}

	/** @member util */
	function copyValue(to, name, value, names, override, positive) {
		if (!name) return;
		if (names && names.indexOf(name) < 0) return;
		if (!value && typeof(value) != "string") return;
		if (to.propertyIsEnumerable(name) && !override) return;
		if (to[name] && !value) return;
		if (to[name] && !positive) return;
		to[name] = value;
	}

	/** @member util */
	function typeOf(value, expected, prefix) {
		var type = typeof(value);
		if (type == "object") {
			type = $boot.toString.call(value);
			type = type.substring(8, type.length-1).toLowerCase();
		}
		return expected ? prefix ? type.indexOf(expected) == 0 : $boot.buffer.constructor === expected.constructor ? expected.indexOf(type) >= 0 : expected == type : type;
	}

	/** @member util */
	function valueOf(name) {
		return this[name];
	}

	/** @member util */
	function external(ref) {
		return typeOf(ref.value, "string") && ($boot.doc && $boot.doc.getElementById(ref.member||ref.name) || $boot.global[ref.member||ref.name]);
	}

	/** @member util */
	function memberValue(value, name) {
		return spot(value, name, arguments);
	}

	/** @member util */
	function memberName(value, name) {
		return spot(value, name, arguments, true);
	}

	/** @member util */
	function spot(value, name, args, nameOnly) {
		if (typeOf(name, "string") && name) {
			for (var i = 1; i < args.length; i++) {
				if (!value) break;
				name = args[i];
				value = (name in value) ? value[name] : (name = null);
			}
		}
		return nameOnly ? typeOf(name, "string") && name : value;
	}

	/** @member util */
	function log(value) {
		if (typeof(console) == "undefined") return;
		if (typeof(value) == "string") {
			var i = $logKeys.indexOf(value);
			var log = (i<0) ? console.log : console[$logKeys[i]];
			log.apply(console, arguments);
		} else {
			console.dir(value);
		}
	}

})()();

juse("juse/resource.context", function resource(){

	this.juse(".classifier", function properties(){
		return function properties(value){
			this.context.cacheValue("properties", this.spec.name, value);
		};
	});

	this.juse(".classifier", function json(){
		return function json(value){
			return JSON.parse(value);
		};
	});

	this.juse(".classifier", function html(){
		return function html(value, name){
			var div = juse.global.document.createElement(name||"div");
			div.innerHTML = value;
			return div;
		};
	});
});

juse("juse/run.context", function run(){

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

	this.juse(["try"], function async($try, $scope){
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
					$scope.log("error", error.ex);
				}
			}
		}

	});

	this.juse(".classifier", ["try", "async"], function promise($try, $async){

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
});

juse("juse/remote.context", ["run"], function remote(){

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

juse("juse/service.context", ["juse/run"], function service(){

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

juse("juse/text.context", function text(){

	this.juse(["teval"], function replace($teval, $scope){
		var $replaceFormat = /\$\{([^\}]+)\}/g;
		var $testFormat = /\$\{([^\}]+)\}/;

		return function replace(text, dataset){
			$teval = $teval || juse.lookup("teval", $scope);
			var scope = this;
			var args = arguments;
			if (!text || typeof(text) != "string" || !$testFormat.test(text)) return text;
			return text.replace($replaceFormat, function(match, spec) {
				var value = match;
				var idx = parseInt(spec)+1;
				if (idx) {
					if (idx in args) value = args[idx];
				} else {
					value = $teval.call(scope, spec, dataset) || value;
				}
				return value;
			});
		};
	});

	this.juse(["map", "replace"], function teval($map, $replace, $scope){
		return function teval(spec, dataset) {
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

juse("juse/ui.context", ["juse/resource", "juse/text"], function ui(){
	var $view, $array = [];

	this.juse(".classifier", function view($scope){
		/** @follow juse/app/load **/
		return juse.seal(
			function view(){
				$scope.context.cacheValue("views", this.spec.name, this.spec);
			},
			function follow(event, ref) {
				$view = $view || juse.global.document.body.querySelector("[data-view]") || juse.global.document.body;
				var value = juse.lookup(ref);
				if (juse.typeOf(value, "html", true)) {
					$view.setAttribute("data-view", juse.toSpec(ref));
					if ($view.lastElementChild) {
						$view.replaceChild(value, $view.lastElementChild);
					} else {
						$view.appendChild(value);
					}
					return true;
				}
			}
		);
	});

	this.juse(".classifier", ["html"], function dom($html){
		var $dom;
		return $dom = juse.seal(function dom(value, clone){
			return juse.typeOf(value, "string") ? $html.call(this, value) : clone ? value.cloneNode(true) : value;
		}, {
			TEXT_NODE: juse.global.document.TEXT_NODE,
			ELEMENT_NODE: juse.global.document.ELEMENT_NODE,
			ATTRIBUTE_NODE: juse.global.document.ATTRIBUTE_NODE },
			moveContent,
			replaceContent,
			removeContent,
			childNodes,
			forNodes,
			closest,
			filterNodes,
			data,
			textNode,
			forTextNodes,
			toggleClass
		);

		function moveContent(a, b) {
			b = b || juse.global.document.createDocumentFragment();
			b = typeof(b) == "string" ? juse.global.document.createElement(b) : b;
			if (juse.typeOf(a, "array")) a.forEach(moveChild, b);
			else while (a.firstChild) moveChild.call(b, a.firstChild);
			return b;
		}

		function moveChild(child) {
			if (this.parentNode) this.parentNode.insertBefore(child, this);
			else this.insertBefore(child, null);
		}

		function replaceContent(a, b) {
			if (a && a.parentNode && b) {
				moveContent(b, a);
				a.parentNode.removeChild(a);
			}
		}

		function removeContent(node) {
			if (juse.typeOf(node, "array")) node.forEach(removeChild);
			else while (node.firstChild) removeChild(node.firstChild);
		}

		function removeChild(child) {
			if (child.parentNode) child.parentNode.removeChild(child);
		}

		function childNodes(node, name) {
			return name ? node ? visitNodes(node.childNodes, {name:name,nodes:{}}).nodes : {}
				: $array.slice.call(node.childNodes);
		}

		function forNodes(node, name, callback, args) {
			args = {name:name, nodes:[node.childNodes], callback:callback, scope:args};
			for (var i = 0; i < args.nodes.length; i++) {
				visitNodes(args.nodes[i], args);
			}
		}

		function visitNodes(nodes, args) {
			return $array.reduce.call(nodes, visitNode, args);
		}

		function visitNode(args, node) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				if (args.callback) {
					if (!args.name || node.hasAttribute(args.name)) args.callback.call(args.scope, node);
					args.nodes.push(node.childNodes);
				} else if (node.hasAttribute(args.name)) {
					args.nodes[node.getAttribute(args.name)] = node;
				}
			}
			return args;
		}

		function closest(node, selectors) {
			var args = { selectors:selectors };
			for (var parent = node.parentNode; parent; parent = parent.parentNode) {
				node = $array.some.call(parent.childNodes, matches, args) && args.node;
				if (node) return node;
			}
		}

		function matches(node) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				var matched = node.matches ? node.matches(this.selectors) : node.parentNode.querySelector(this.selectors) == node;
				return this.node = matched && node;
			}
		}

		function data(node, name, value) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				var data = node.getAttribute(name);
				if (value === null) {
					node.removeAttribute(name);
				} else if (value !== undefined) {
					node.setAttribute(name, value);
				}
				return data;
			}
		}

		function filterNodes(node, selector) {
			selector = selector || node.nodeType != $dom.ELEMENT_NODE && "*";
			var nodes = selector ? node.querySelectorAll(selector) : node.getElementsByTagName("*");
			return $array.slice.call(nodes);
		}

		function textNode(node) { return node.nodeType == $dom.ATTRIBUTE_NODE || node.nodeType == $dom.TEXT_NODE; }

		function forTextNodes(nodes, callback, scope) {
			nodes && $array.filter.call(nodes, textNode).forEach(callback, scope);
		}

		function toggleClass(node, name, toggle) {
			var names = node.className ? node.className.split(" ") : [];
			var index = names.indexOf(name);
			if (toggle && index < 0) {
				names.push(name);
			} else if (!toggle && index >= 0) {
				names.splice(index, 1);
			}
			name = names.join(" ");
			if (node.className != name) {
				node.className = name;
			}
		}

	});

	this.juse(["dom", "replace@juse/text"], function replace($dom, $replace){
		return function replace(node, dataset) {
			var args = {scope:this, dataset:dataset};
			$dom.filterNodes(node).forEach(replaceTexts, args);
			replaceTexts.call(args, node);
			return node;
		};

		function replaceTexts(node) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				$array.forEach.call(node.attributes, replaceText, this);
				$array.forEach.call(node.childNodes, replaceText, this);
			}
		}

		function replaceText(node) {
			if (node.nodeType == $dom.ATTRIBUTE_NODE || node.nodeType == $dom.TEXT_NODE) {
				node.nodeValue = $replace.call(this.scope, node.nodeValue, this.dataset);
			}
		}
	});

	this.juse(".classifier", ["dom", "replace", "map"], function tile($dom, $replace, $map){

		return function tile(node, dataset){
			node = $dom.call(this, node);
			makeTile(node, dataset, this);
			return node;
		};

		function makeTile(node, dataset, scope, outertag) {
			$replace.call(scope, node, dataset);
			replaceTags.call(scope, node, dataset, outertag);
		}

		function replaceTags(tile, dataset, outertag) {
			var tiles = $dom.childNodes(outertag, "data-tile");
			var scope = {scope:this, dataset:dataset, outertag:outertag, tiles:tiles};
			$dom.filterNodes(tile, "[data-tag]").forEach(replaceTag, scope);
		}

		function replaceTag(tag) {
			var spec = tag.getAttribute("data-tag");
			var ref = spec && juse.toRef(spec);
			var tile = ref && juse.filter(juse.toRef(ref, ".html"), this.scope);
			if (!ref && this.outertag) {
				tile = this.outertag;
			} else if (this.tiles[ref.name]) {
				tile = this.tiles[ref.name];
			} else if (tile) {
				makeTile(tile, this.dataset||$map(ref.value), this.scope, tag);
			}
			$dom.replaceContent(tag, tile);
		}

	});

	this.juse(".classifier", ["dom"], function widget($dom){

		var $eventKeys = ["click","dblclick","mousedown","mouseenter","mouseleave","mousemove","mouseover","mouseout","mouseup","input","change","keyup","keydown","keypress"];
		var $eventMap = {
			enter: juse.toRef("keyup:13")
		};

		return juse.seal(function widget(node, scope) {
			node = $dom.call(this, node);
			bindWidgets(node, scope||this);
			return node;
		}, bindEvent);

		function bindWidgets(node, scope) {
			$dom.filterNodes(node, "[data-widget]").forEach(bindWidget, scope);
			applyBindings(scope, node);
		}

		function bindWidget(node) {
			var spec = juse.toRef($dom.data(node, "data-widget", null));
			var widget = juse.lookup(spec, this);
			if (typeof(widget) == "function") {
				widget.call(this, node);
			}
			applyBindings(this, node, spec);
		}

		function applyBindings(scope, node, base) {
			$dom.filterNodes(node, "[data-event]").forEach(applyBinding, {scope:scope, base:base});
		}

		function applyBinding(node) {
			var spec = $dom.data(node, "data-event", null);
			while (spec) {
				var ref = juse.toRef(spec, this.base);
				if (!bindEvent(this.scope, node, ref)) {
					$dom.data(node, "data-event", spec);
					break;
				}
				spec = ref.value;
			}
		}

		function bindEvent(scope, node, spec, action, target) {
			var event = juse.toRef(spec);
			if (event) {
				var map = eventMap(event);
				var kind = map && map.kind || event.kind || $eventKeys[0];
				var i = $eventKeys.indexOf(kind);
				if (i >= 0) {
					action = action || juse.lookup(event, scope);
					if (juse.typeOf(action, "function")) {
						var args = {action:action, target:target, event:event};
						node.addEventListener(kind, fire.bind(args));
						return true;
					}
				}
			}
		}

		function fire(event) {
			var map = eventMap(this.event);
			if (map && map.name != event.keyCode) return;
			if (this.target) this.action.call(null, this.target, event);
			else this.action.call(null, event);
		}

		function eventMap(event) {
			return $eventMap[event.kind];
		}
	});
});

juse("juse/valid.context", ["juse/text"], function valid($text, $context){

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

juse("juse/model.context", ["juse/remote", "juse/service", "juse/ui", "juse/valid", "juse/text"], function model(){
	var $modelKeys = ["kind","name"], $context = this;

	this.juse(".classifier", function binder(){
		return function binder(){
			$context.cacheValue("binders", this.spec.name, this.spec);
		};
	});

	function getBinder(kind) {
		return juse.lookup($context.cacheValue("binders", kind)) || juse.lookup($context.cacheValue("binders", "value"));
	}

	function getModel(spec, create) {
		spec = juse.toRef(spec);
		var model = spec && $context.cacheValue("models", spec.name);
		if (!model && create) {
			model = { tiles:[], value:null };
			if (spec) {
				model.spec = {};
				$context.cacheValue("models", spec.name, model);
			}
		}
		if (model && create) {
			juse.copyTo(model.spec, spec, $modelKeys);
			model.binder = getBinder(model.spec&&model.spec.kind);
		}
		return model;
	}

	this.juse(".classifier", ["dom", "tile", "provider", "validate"], function model($dom, $tile, $provider, $validate, $scope){
		/** @follow juse/app/load **/
		return juse.seal(function model(node) {
			node = $dom.call(this, node);
			makeModels.call(this, node);
			return node;
		},
		function follow() {
			var models = $context.cacheEntry("models");
			Object.keys(models).map(juse.valueOf, models).forEach(renderDefault);
		},
		renderChild, renderModel, fireEvent, notifyInput, addTile, getModel, getModelValue, notifyModel, resolveEvent, rejectEvent);

		function makeModels(node) {
			$dom.filterNodes(node, "[data-model]").forEach(makeModel, this);
			makeTiles.call(this, node);
		}

		function makeModel(node) {
			var spec = $dom.data(node, "data-model", null);
			var model = getModel(spec, true);
			makeTiles.call(this, node, model);
			return model;
		}

		function makeTiles(node, model) {
			var args = {scope:this, model:model};
			$dom.forNodes(node, "data-value", makeTile, args);
			$dom.filterNodes(node).forEach(makeTextTiles, args);
			makeTextTiles.call(args, node);
		}

		function makeTextTiles(node) {
			$dom.forTextNodes(node.attributes, makeTile, this);
			$dom.forTextNodes(node.childNodes, makeTile, this);
		}

		function makeTile(node) {
			var args = this;
			var kind = kindOf(node, $dom.data(node, "data-value"), args.model && args.model.spec);
			var binder = getBinder(kind);
			if (binder) {
				var spec = $dom.data(node, "data-value", null);
				var tile = addTile.call(args.scope, node, args.model, spec);
				binder.call(args.scope, tile, node, args.model);
			}
		}

		function kindOf(node, spec, base) {
			return spec && juse.toRef(spec, base, true).kind || ($dom.textNode(node) ? "text" : ("form" in node) ? "input" : "");
		}

		function addTile(node, model, spec) {
			spec = juse.toRef(spec, model && model.spec, true);
			if (!spec) return;
			model = (spec.kind || model && !model.spec) && model || getModel(spec, true);
			var args = {node:node}, tile = model.tiles.some(nodeEquals, args) && args.tile;
			if (tile) {
				tile.specs = tile.specs || [];
				tile.specs.push(spec);
			} else {
				tile = { node:node, spec:spec, binder:getBinder(kindOf(node, spec)), model:model, scope:this };
				model.tiles.push(tile);
			}
			return tile;
		}

		function nodeEquals(tile) { this.tile = tile; return this.node == tile.node; }

		function fireEvent(input, value) {
			var success = validateModel(input, value);
			if (success && input.event && (input.event.name||input.event.member)) {
				notifyEvent(input, value);
			} else {
				notifyInput(input, value);
			}
		}

		function notifyEvent(input, value) {
			var args = {input:input};
			var binder = input.binder[input.event.member];
			if (juse.typeOf(binder, "function")) {
				binder(input, value);
			} else {
				$provider.fire(input.event, value).then(resolveEvent.bind(args), rejectEvent.bind(args));
			}
		}

		function resolveEvent(value) {
			notifyInput(this.input, value);
		}

		function rejectEvent(error) {
			notifyMessage(this.input, "event: " + juse.toSpec(this.input.event) + ", message: " + error.message);
		}

		function notifyInput(input, value) {
			if (input.binder.notify) {
				input.binder.notify(input, value);
			} else if (input.model.linkTile) {
				input.model.linkTile.binder.notify(input, value);
			} else {
				notifyModel(input.model, value, input);
			}
		}

		function notifyMessage(input, messages) {
			$dom.toggleClass(input.node, "error", !!messages);
			if (!notifyModel(getModel("messages"), messages, input) && messages) {
				$scope.log("error", messages);
			}
		}

		function notifyModel(model, value, input) {
			if (updateModel(model, value, input)) {
				renderModel(model, value, input);
				return true;
			}
		}

		function updateModel(model, value, input) {
			if (model && model.binder.update) {
				model.binder.update(model, value, input);
				return true;
			}
		}

		function renderDefault(model) {
			renderModel(model, model.value);
		}

		function renderModel(model, value, input) {
			var tiles = (input && value !== null && !(model.spec && model.spec.kind)) ? model.tiles.filter(tileMatches, input) : model.tiles;
			for (var i = 0; i < tiles.length; i++) {
				renderTile(tiles[i], value, input);
			}
		}

		function renderChild(tile, value) {
			var node = $tile.call(tile.scope, tile.content.cloneNode(true));
			var model = makeModel.call(tile.scope, node);
			model.nodes = $dom.childNodes(node);
			model.parentTile = tile;
			model.value = value;
			renderModel(model, value);
			tile.node.appendChild($dom.moveContent(model.nodes));
			return model;
		}

		function renderTile(tile, value, input) {
			if (tile && tile.binder.render && tile !== input) {
				tile.binder.render(tile, value, input);
			}
		}

		function validateModel(tile, value) {
			return tile.spec.member ? validateTile(tile, value) : tile.model.tiles.reduce(validateEach, {value:value, valid:true}).valid;
		}

		function validateTile(tile, value) {
			var messages = (value === null) ? null : $validate.call(tile.scope, tile.valid, value, tile.spec);
			notifyMessage(tile, messages);
			return !messages;
		}

		function validateEach(args, tile) {
			var valid = validateTile(tile, args.value);
			args.valid = args.valid && valid;
			return args;
		}

		function getModelValue(spec) {
			spec = juse.toRef(spec);
			var model = getModel(spec);
			return model.value && spec.member ? model.value[spec.member] : model.value;
		}

		function tileMatches(tile) {
			if (tile.link) return !!this.link;
			if (tile.spec.kind == "map") return true;
			if (tile.spec.kind == "input") return false;
			if (this === juse.global) return true;
			if (this !== tile && nameMatches.call(this.spec, tile.spec)) {
				return memberMatches.call(this.spec, tile.spec) || (juse.typeOf(tile.specs, "array") && tile.specs.some(memberMatches, this.spec));
			}
		}

		function nameMatches(spec) { return !this.name || !spec.name || this.name === spec.name; }

		function memberMatches(spec) { return !this.member || this.member === spec.member; }

	});

	this.juse(".binder", ["dom", "widget", "model", "teval"], function input($dom, $widget, $model, $teval){
		return juse.seal(
			function input(tile){
				tile.valid = juse.toRef($dom.data(tile.node, "data-valid", null));
				tile.event = juse.toRef($dom.data(tile.node, "data-event", null));
				var event = juse.toRef(":", tile.event, true);
				event.kind = event.kind || inputEvent(tile);
				$widget.bindEvent(tile.scope, tile.node, event, fireEvent, tile);
			}
			,render,clear
		);

		function fireEvent(tile) {
			$model.fireEvent(tile, valueOf(tile));
		}

		function inputEvent(tile) {
			switch (tile.node.type) {
			case "button": return "click";
			case "reset": return "click";
			case "checkbox": return "change";
			default: return ("form" in tile.node) ? "input" : "click";
			}
		}

		function valueOf(tile) {
			switch (tile.node.type) {
			case "button": return null;
			case "reset": return null;
			case "checkbox": return tile.node.checked;
			default: return tile.node.value;
			}
		}

		function render(tile, value, input) {
			value = (tile==input) ? value : $teval.call(tile.scope, tile.spec, tile.model.value);
			switch (tile.node.type) {
			case "button": break;
			case "reset": break;
			case "checkbox": tile.node.checked = !!value; break;
			default: tile.node.value = value||""; break;
			}
		}

		function clear(tile, value) {
			render(tile, null, tile);
			$model.notifyInput(tile, value);
		}
	});

	this.juse(".binder", ["dom", "widget", "model"], function link($dom, $widget, $model){
		return juse.seal(
			function link(tile){
				tile.link = $model.getModel(tile.spec.name, true);
				tile.event = juse.toRef($dom.data(tile.node, "data-event", null));
				$widget.bindEvent(tile.scope, tile.node, juse.toRef(":", tile.event, true), fireEvent, tile);
			}
			,notify,render
		);

		function fireEvent(tile) {
			$model.fireEvent(setIndex(tile), (tile.link.linkTile == tile) ? null : tile.model.value);
		}

		function notify(input, value) {
			if (input.model.linkTile) {
				$model.notifyModel(input.model, value, input);
				$model.notifyModel(input.model.linkTile.model.parentTile.model, value, input);
				resetLink(input.model, input.model.linkTile, value);
			} else if (input.link) {
				$model.notifyModel(input.link, value, input);
				if (input.model.spec) {
					$model.notifyModel(input.model, null, input);
				} else {
					render(input, value, input);
					resetLink(input.link, input, value);
				}
			}
		}

		function render(tile, value, input) {
			if (tile.model.spec && input) {
				tile.node.disabled = !!value;
			} else if (input) {
				if (tile.link.linkTile && tile.link.linkTile != tile) {
					$dom.toggleClass(tile.link.linkTile.node, "selected");
				}
				$dom.toggleClass(tile.node, "selected", !!value);
			}
		}

		function setIndex(input) {
			if (!input.model.spec) {
				input.model.parentTile.model.index = input.model.parentTile.models.indexOf(input.model);
			}
			return input;
		}

		function resetLink(model, linkTile, value) {
			if (value === null) {
				delete model.linkTile.model.parentTile.model.index;
				delete model.linkTile;
			} else {
				model.linkTile = linkTile;
			}
		}
	});

	this.juse(".binder", ["dom", "model"], function list($dom, $model){
		return juse.seal(
			function list(tile){
				tile.content = $dom.moveContent(tile.node);
				tile.models = [];
			}
			,update,render
		);

		function update(model, value, input) {
			var index = model.index;
			if (input && index >= 0) {
				if (input.spec.member) {
					// nothing
				} else if (value === null) {
					model.value.splice(index, 1);
				} else {
					model.value.splice(index, 1, value);
				}
			} else if (input && (input.model == model || input.link == model) && value) {
				model.value = model.value || [];
				model.value.push(value);
			} else {
				model.value = value || null;
			}
		}

		function render(tile, value, input) {
			var index = tile.model.index;
			if (input && index >= 0) {
				if (!input.spec.member) {
					tile.models[index].value = value;
				}
				$model.renderModel(tile.models[index], value, input);
				if (value === null) {
					$dom.removeContent(tile.models[index].nodes);
					tile.models.splice(index, 1);
				}
			} else if (input && (input.model == tile.model || input.link == tile.model) && value) {
				tile.models.push($model.renderChild(tile, value));
			} else {
				for (index = 0; index < tile.models.length; index++) {
					$dom.removeContent(tile.models[index].nodes);
				}
				if (tile.models.length) tile.models = [];
				if (tile.model.value) {
					for (index = 0; index < tile.model.value.length; index++) {
						tile.models.push($model.renderChild(tile, tile.model.value[index]));
					}
				}
			}
			tile.node.hidden = !tile.models.length;
			$dom.toggleClass(tile.node, "hidden", tile.node.hidden);
		}
	});

	this.juse(".binder", ["dom", "model"], function map($dom, $model){
		return juse.seal(
			function map(tile){
				tile.content = $dom.moveContent(tile.node);
				tile.models = [];
			}
			,update,render
		);

		function update(model, value, input) {
			var key = input && input.spec.name+"#"+input.spec.member;
			model.value = model.value || {};
			if (!key) {
				// nothing
			} else if (value) {
				model.value[key] = value;
			} else {
				delete model.value[key];
			}
		}

		function render(tile, value, input) {
			var key = input && input.spec.name+"#"+input.spec.member;
			var child = key && tile.models[key];
			if (value) {
				if (key && !child) {
					tile.models.push(tile.models[key] = $model.renderChild(tile, value));
				} else if (child) {
					child.value = value;
					$model.renderModel(child, value);
				}
			} else if (child) {
				var index = tile.models.indexOf(child);
				$dom.removeContent(tile.models[index].nodes);
				tile.models.splice(index, 1);
				delete tile.models[key];
			}
			tile.node.hidden = !tile.models.length;
			$dom.toggleClass(tile.node, "hidden", tile.node.hidden);
		}
	});

	this.juse(".binder", ["dom", "widget", "model", "request"], function remote($dom, $widget, $model, $request){
		return juse.seal(
			function remote(tile){
				tile.event = juse.toRef($dom.data(tile.node, "data-event", null));
				$widget.bindEvent(tile.scope, tile.node, juse.toRef(":", tile.event, true), fireEvent, tile);
				load(tile);
			}
			,notify,load
		);

		function fireEvent(tile) {
			$model.fireEvent(tile, tile.model.value);
		}

		function notify(input, value) {
			$model.notifyModel($model.getModel(input.spec), value, input);
		}

		function load(input){
			var args = {input:input};
			$request.call(input.scope, juse.toRef(".json", input.spec, true)).then($model.resolveEvent.bind(args), $model.rejectEvent.bind(args));
		}
	});

	this.juse(".binder", ["model", "teval"], function text($model, $teval){
		var $replaceFormat = /%\{([^\}]*)\}/g;

		return juse.seal(
			function text(tile, node, model){
				var scope = this;
				node.nodeValue = node.nodeValue.replace($replaceFormat, function(match, spec) {
					var tile = $model.addTile.call(scope, node, model, spec);
					if (tile) tile.content = node.nodeValue;
					return "";
				});
			}
			,render
		);

		function render(tile, value, input) {
			tile.node.nodeValue = tile.content.replace($replaceFormat, function(match, spec) {
				spec = juse.toRef(spec, tile.model.spec, true);
				var value = !spec.name ? tile.model.value : $model.getModelValue(spec.name);
				return $teval.call(tile.scope, spec, value) || "";
			});
		}
	});

	this.juse(".binder", ["dom", "teval"], function value($dom, $teval){
		return juse.seal(
			function value(tile){
				tile.length = tile.node.innerHTML.length;
			}
			,update,render
		);

		function update(model, value, input) {
			if (input && input.spec.member) {
				model.value = model.value || {};
				model.value[input.spec.member] = value;
			} else {
				model.value = value;
			}
		}

		function render(tile, value, input) {
			var value = $teval.call(tile.scope, tile.spec, tile.model.value);
			if (tile.length) {
				tile.node.hidden = (value == "hidden");
			} else {
				tile.node.hidden = !value;
				tile.node.innerHTML = value||"";
			}
			$dom.toggleClass(tile.node, "hidden", tile.node.hidden);
		}
	});
});