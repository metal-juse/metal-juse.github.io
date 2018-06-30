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
					seal,
					log
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
							log("error", ex);
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
			copyTo(def, {name:def.meta.name||def.spec.name, type:def.spec.type=="context"&&"context"});
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
		var scope = module.scope = {spec:copyTo({}, module.def, $refKeys), meta:copyTo({}, module.def.meta)};
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
