/**
 * Another AMD inspired JavaScript framework to load modules and manage dependencies.
 */
(function boot($scope){
	"use strict";
	var $defKeys = ["spec", "refs", "value"];
	var $refKeys = ["key", "kind", "name", "type", "member", "context"];
	var $specKeys = $refKeys.concat("pipe", "value");
	var $specFormatKeys = [""].concat($specKeys);
	var $specFormat = /(?:\s*([^.#@|;\s]*)\s*=)?(?:\s*([^.#@|;\s]*)\s*:)?\s*([^.#@|;]*)(?:\.([^#@|;\s]*))?(?:#([^@|;\s]*))?(?:@([^|;\s]*))?(?:\s*\|\s*([^;\s]*))?(?:\s*;\s*([\S\s]*))?/;
	var $specDelims = ["=", ":", "", ".", "#", "@", "|", ";"];
	var $fnFormatKeys = ["", "name", "value"];
	var $fnFormat = /function\s*([\S]*?)\s*\([^)]*\)\s*{\s*(?:\/\*\*+\s*([\S\s]*?)\s*\*\*+\/)?/;
	var $flushStates = enums(["BUFFER", "LOAD", "DEFINE", "RESOLVE", "READY", "FLUSH", "DONE", "ERROR"]);
	var $logKeys = enums(["error", "warn", "info", "debug"]);
	var $boot = {
		buffer: [], errors: [], flushCount: 0, moduleCount: 0,
		global: $scope.document ? $scope : global
	};

	/** @member boot */
	return function boot(){
		if ($boot.global.juse) return;
		copy($boot.global, {juse:juse, define:$boot.global.define||juse});
		if ($boot.global.document) {
			copy($boot, {doc:$boot.global.document, async:!!$boot.global.document.currentScript, script:currentScript()});
			copy($boot, {jusePath:slicePath($boot.script.getAttribute("src"), -1), app:spec($boot.script.getAttribute("data-app")||"")});
			if ($boot.doc.head != $boot.script.parentNode) {
				$boot.doc.head.appendChild($boot.script);
			}
		} else {
			copy($boot, {jusePath:__dirname, app:spec(process.argv[2]||"")});
		}

		loadRoot();
		if ($boot.doc) {
			juse.follow($boot.global, {"load":loadApp, "hashchange":loadApp});
		} else {
			loadApp();
		}
	};

	/** @member boot */
	function done() {
		if ($boot.doc) log($boot);
		else log($boot.jusePath, $boot.app);
		log("--done--");
	}

	/** @member boot */
	function loadApp() {
		getContext().scope.juse($boot.doc ? ["juse/core","juse/ui"] : ["juse/core"], function(){
			getContext().scope.juse(["map@juse/core"], function($map){
				var app = spec(currentHash(), currentApp());
				var context = spec(app.context||"");
				var properties = $map(app.value);
				$boot.appPath = context.kind || spec($boot.app.context||"").kind;
				copy(app, { context:context.name || app.context || "", value:"" }, null, true, true);
				getContext().scope.juse([spec(app.context, ".context")], function(){
					copy(getContext(currentApp(app)).scope.cacheEntry("properties"), properties);
					log("--load--");
					getContext().scope.juse([app, "load@juse/core"], function($app, $load){
						var value = typeOf($app, "function") ? $app() : $app;
						$load.fire("load", value);
						if (!$load.fire("done", app)) {
							setTimeout(done);
						}
					});
				});
			});
		});
	}

	/** @member boot */
	function loadRoot() {
		juse(".context", function root(){

			this.juse(function juse(){
				return seal(this.context.juse, {
					global: $boot.global,
					spec:spec,
					specs:specs,
					path:path,
					slicePath:slicePath,
					property:property,
					resolve:resolve,
					lookup:lookup,
					filter:filter,
					member:member,
					typeOf:typeOf,
					values:values,
					follow:follow,
					assign:assign,
					copy:copy,
					seal:seal,
					log:log
				});
			});

			this.juse("juse/cache", function cache(){
				assign(this, { init:init });
				return seal(function cache(value){
					copy(getModule(this.spec).cache, value);
				}, { init:init });

				function init() {
					getModule(this.spec).cache = {};
					assign(this, {cacheEntry:cacheEntry, cacheValue:cacheValue});
				}

				function cacheValue(name, member, value) {
					var cache = this.cacheEntry(name);
					if (value !== undefined) cache[member] = cache[member] || value;
					return cache[member];
				}

				function cacheEntry(name, value) {
					var cache = getModule(this.spec).cache;
					return cache[name] = cache[name] || value || {};
				}
			});

			this.juse("juse/context", ["cache"], function context($cache){
				assign(this, { init:init });
				init.call(this.context);
				$cache.call(this.context, initContext({
					map: { "*": "modules:", "context": "juse/context@", "cache": "juse/cache@", "juse": "juse@" },
					roots: [ "juse", "jx" ]
				}));
				return function context(value){
					copy(this.cacheEntry("properties"), member(value, "properties"));
					$cache.call(this, initContext(value));
					return {};
				};

				function init() {
					$cache.init.call(this);
					assign(this, {property:property});
				}

				function initContext(value) {
					if (value && value.map) initContextMap(value.map);
					if (value && value.remap) juse.values(value.remap).forEach(initContextMap);
					return value;
				}

				function initContextMap(map) {
					if (map) copy(map, juse.values(map).map(spec), Object.keys(map), true, true);
				}

				function property(ref, value) {
					ref = spec(ref);
					var properties = ref.kind ? this.cacheValue("properties", ref.kind, {}) : this.cacheEntry("properties");
					var property = member(properties, [ref.name, ref.member]);
					if (!property && value !== undefined) {
						property = properties[ref.name] = properties[ref.name] || (ref.member ? {} : value);
						if (ref.member) property = property[ref.member] = property[ref.member] || value;
					}
					return property;
				}
			});

			this.juse("juse/request", function request(){
				return function request(ref){
					if (!$boot.doc) return nodeRequest(ref);
					else if (ref.type == "css") return defaultRequest(ref);
					else if (ref.kind == "static") return staticRequest(ref);
					else return defaultRequest(ref);
				};

				function nodeRequest(ref) {
					var path = juse.path(ref);
					log("load:", specs(ref), "<-", path);
					$boot.currentSpec = ref;
					require(path);
					var module = findModule(ref);
					if (external(module)) {
						module.flushState = $flushStates.DEFINE;
					}
				}

				function defaultRequest(ref) {
					var path = juse.path(ref), spec = specs(ref);
					var tagName = ref.type == "css" ? "link" : "script";
					var tag = $boot.doc.createElement(tagName);
					tag.setAttribute("data-spec", spec);
					if (tagName == "link") {
						tag.rel = "stylesheet";
						tag.href = path;
						tag.title = spec;
					} else {
						tag.async = $boot.async;
						tag.src = path;
					}
					log("load:", spec, "<-", tag);
					juse.follow(tag, {"load":defaultResponse, "error":defaultResponse});
					$boot.script.parentNode.insertBefore(tag, $boot.script);
				}

				function defaultResponse(event) {
					var module = findModule(getSpec(event.target));
					if (event.type == "load") {
						if (module.type == "css") {
							module.flushState = $flushStates.DONE;
						} else if (external(module)) {
							module.flushState = $flushStates.DEFINE;
						}
					} else {
						failModule(module, null, null, Error("response " + event.type));
					}
					flush();
				}

				function staticRequest(ref) {
					var req = { ref:ref, xhr:new XMLHttpRequest() };
					try {
						req.xhr.open("GET", juse.path(ref), true);
						req.xhr.onreadystatechange = staticResponse.bind(req);
						req.xhr.send();
					} catch (ex) {
						req.error = ex;
						staticResponse.call(req);
					}
				}

				function staticResponse() {
					if (!this.error && this.xhr.readyState != 4) return;
					if (this.xhr.status == 200 || this.xhr.status == 0 && this.xhr.responseText) {
						this.value = this.xhr.responseText;
					} else if (!this.error) {
						this.error = Error(this.xhr.statusText||"Not Found");
						this.error.code = this.xhr.status||404;
					}
					var module = findModule(this.ref);
					if (!this.error) {
						module.def.args.value = this.value;
						module.flushState = $flushStates.DEFINE;
					} else {
						failModule(module, null, null, this.error);
					}
					flush();
				}
			});

			function property(ref, scope, properties) {
				return ref = spec(ref), getContext(scope && scope.spec || currentApp()).scope.property(ref) || member(properties, ref.name) || member(scope, ["properties", ref.name]);
			}

			function resolve(spec, scope) {
				return remap(spec, getModule(scope && scope.spec || currentApp()));
			}

			function lookup(spec, scope) {
				return spec = resolve(spec, scope), member(getModule(spec), ["value", spec.member]);
			}

			function follow(target, follower) {
				Object.keys(follower).forEach(addFollower, {target:target,follower:follower});
			}

			function addFollower(key) {
				this.target.addEventListener(key, this.follower[key]);
			}

			function values(value) {
				return Object.keys(value).map(valueOfKey, value);
			}

			function valueOfKey(name) {
				return this[name];
			}

			function filter(ref, scope, value) {
				ref = spec(ref);
				if (!ref) return;
				var module = getModule(scope && scope.spec || currentApp());
				if (value === undefined) {
					value = filterRefValue.call(module, resolve(ref, scope));
				} else {
					value = applyFilters(value, ref, "type", module);
					value = applyFilters(member(value, [ref.member]), ref, "pipe", module);
				}
				return value;
			}

			function path(ref) {
				ref = spec(ref);
				var path = ref.value;
				if (!path) {
					var context = getContext(ref);
					var name = getModuleName(ref, "js");
					name = context.kind ? [context.name, name].join("/") : name;
					var base = (juseRoot(name) || $boot.doc) ? "" : ".";
					path = juseRoot(name) ? $boot.jusePath : $boot.appPath;
					path = [base, path, ref.kind, name].filter(member).join("/");
				}
				return path;
			}
		});
	}

	/** @member define */
	function juse(spec, refs, value) {
		var scope = this||$boot.global;
		var def = resolveDef(currentSpec(), getDefArgs([spec, refs, value], arguments.length, scope), scope);
		var module = getModule(def);
		if (module && isError(module)) setModule(def);
		if (!module || isPending(module)) {
			log("define:", specs(def));
			module = makeModule(def, $flushStates.DEFINE);
			$boot.context = $boot.context || module;
			if ($boot.buffer.length == 1) {
				flush();
			}
		}
	}

	/** @member define */
	function resolveDef(ref, args, scope) {
		var def = scope ? {properties:{}, args:args, refs:[]} : {args:{}, spec:ref};
		if (scope) {
			var values = typeOf(def.args.value, "function") && $fnFormat.exec($boot.global.juse.toString.call(def.args.value));
			copy(def.properties, values, $fnFormatKeys);
		}
		if (scope == $boot.global) {
			def.spec = copy(spec(def.args.spec, ref), {name:def.properties.name});
			copy(def.spec, getRefMap(def.spec, def.spec, true));
		} else if (scope) {
			def.spec = spec(def.args.spec, {name:def.properties.name, context:scope.spec.name});
		}
		return copy(def, def.spec);
	}

	/** @member define */
	function makeModule(def, flushState) {
		var module = getModule(def) || {};
		copy(module, def, $specKeys, true, true);
		module.def = def;
		module.flushState = flushState;
		if (!getModule(def)) {
			module.id = $boot.moduleCount++;
			if (!setModule(def, module)) return;
			module.scope = {spec:copy({}, module.def.spec, $refKeys), properties:{}};
			$boot.buffer.push(module);
		}
		if (module.type == "context") {
			module.modules = {};
			module.scope.define = module.scope.juse = juse;
		} else {
			module.scope.context = getContext(module).scope;
		}
		return module;
	}

	/** @member define */
	function getDefArgs(args, count, scope) {
		if (count < $defKeys.length) {
			if (typeOf(args[0], "array")) {
				args.unshift("");
			} else if (count < 2 && (scope == $boot.global || typeOf(args[0], "function"))) {
				args.unshift("", null);
			} else if (!typeOf(args[1], "array")) {
				args.splice(1, 0, null);
			}
		}
		return copy({}, args, $defKeys);
	}

	/** @member module */
	function getContext(ref, context) {
		var name = typeOf(ref, "object") ? ref.context||context : ref;
		return name ? member($boot.context, ["modules", name]) : $boot.context;
	}

	/** @member module */
	function findModule(ref) {
		var args = {ref:ref};
		return getModule(ref) || $boot.buffer.some(matchModule, args) && args.module;
	}

	function matchModule(module) {
		this.module = module;
		return Object.keys(this.ref).every(refKeyMatches, this);
	}

	function refKeyMatches(key) {
		return this.ref[key] === this.module[key];
	}

	/** @member module */
	function getModule(ref, i, a, context) {
		return (ref.type == "context") ? getContext(ref.name) : typeOf(getModuleName(ref), "string") && member(getContext(ref, context), ["modules", getModuleName(ref)]);
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
		var ref = remap(spec, this);
		if (ref.value) {
			ref.value = juse.lookup("replace@juse/core")(ref.value, this.scope);
		}
		return ref;
	}

	/** @member resolve */
	function remapRef(spec) {
		return remap(spec, this, true);
	}

	/** @member resolve */
	function remap(ref, module, mapOnly) {
		ref = spec({}, ref);
		if (!ref.name || !module) return ref;
		var target = !mapOnly && getModule(ref, null, null, module.context);
		var map = getRefMap(ref, module, true);
		if (map || !target || target == module) {
			map = map || getRefMap(ref, module);
			if (mapOnly && !map) return;
			copy(ref, map, $specKeys, true, true);
			if (!map) {
				ref.name = getRefName(ref, module);
			}
		}
		if (ref.type) {
			copy(ref, getRefMap(getModuleName("*", ref.type), module));
		}
		if (ref.context || module.context || module.type == "context" || juseRoot(ref.name)) {
			copy(ref, getRefMap("*", module));
		}
		return copy(ref, {kind:module.kind||getContext(module).kind, context:module.context});
	}

	/** @member resolve */
	function getRefMap(ref, spec, remapOnly) {
		var refKey = typeOf(ref, "object") ? getModuleName(ref, ref.type) : ref;
		var moduleKey = getModuleName(spec, spec.type);
		var remap = member(getContext($boot.app), ["cache", "remap", moduleKey, refKey])
			|| member(getContext(spec), ["cache", "remap", moduleKey, refKey])
		return remapOnly ? remap : remap
			|| member(getContext($boot.app), ["cache", "map", refKey])
			|| member(getContext(spec), ["cache", "map", refKey])
			|| spec.name && contextRefMaps(spec, refKey)
			|| member(getContext(), ["cache", "map", refKey]);
	}

	/** @member resolve */
	function contextRefMaps(module, refKey) {
		var args = {refKey:refKey};
		return getContext(module).refs.some(contextRefMap, args) && args.value;
	}

	/** @member resolve */
	function contextRefMap(ref) {
		return this.value = member(getModule(ref), ["cache", "map", this.refKey]);
	}

	/** @member resolve */
	function getRefName(ref, spec) {
		var absolute = "context" in ref || ref.name.indexOf("/") >= 0;
		var base = absolute ? null : slicePath(spec.name, -1);
		return [base].concat(ref.name.split("/")).filter(member).join("/");
	}

	/** @member filter */
	function filterRefValue(ref) {
		var module = ref && getModule(ref);
		if (!module) return;
		var value = module.value;
		if (ref.member && ref.member != module.member) {
			value = member(value, [ref.member]);
		}
		return applyFilters(value, ref, "pipe", this);
	}

	/** @member filter */
	function resolveFilters(ref, key, module) {
		var delim = (key == "type") ? "." : "|";
		var mapper = (key == "type") ? remapRef : resolveRef;
		return (ref && ref[key]) ? ref[key].split(delim).map(mapper, module).filter(member) : [];
	}

	/** @member filter */
	function applyFilters(value, ref, key, module, kind) {
		return resolveFilters(ref, key, module).map(getModule).reduce(applyFilter, {scope:module.scope, value:value, kind:spec(kind)}).value;
	}

	/** @member filter */
	function applyFilter(args, filter) {
		filter = args.kind ? member(filter, [args.kind.name, args.kind.member]) : member(filter, "value");
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
		return isFlushed(module) && (!module.modules || juse.values(module.modules).every(isFlushed));
	}

	/** @member flush */
	function resolveRefs(module) {
		if (module.flushState == $flushStates.DEFINE || module.flushState == $flushStates.RESOLVE) {
			module.flushState = $flushStates.RESOLVE;
			if (module.def.spec.type) {
				copy(module.def.spec, getRefMap(getModuleName("*", module.def.spec.type), module));
			}
			module.refs = [];
			if (module.def.args.refs) {
				module.def.refs = module.def.args.refs.map(resolveRef, module);
				module.refs.push.apply(module.refs, module.def.refs.filter(member));
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
			if (typeOf(module.value, "string") && module.value && !external(module) || module.def.spec.kind == "static" && !module.def.args.value) {
				module.flushState = $flushStates.BUFFER;
			} else if (module.name && !module.type && module.scope.context.cacheValue) {
				module.scope.context.cacheValue("map", slicePath(module.name, -1, 1), module.scope.spec);
			}
		}
	}

	/** @member flush */
	function bufferModule(ref) {
		if (ref && !getModule(ref)) {
			log("buffer:", specs(ref), "by", specs(this));
			if (external(ref)) {
				makeModule(resolveDef(ref), $flushStates.DEFINE);
			} else if (!makeModule(resolveDef(ref), $flushStates.BUFFER)) {
				log("warn", "fail to buffer", specs(ref), "by", specs(this));
			}
		}
	}

	/** @member flush */
	function loadModule(module) {
		if (module.flushState == $flushStates.BUFFER) {
			module.flushState = $flushStates.LOAD;
			juse.lookup("juse/request@")(module.def.spec);
			return !$boot.async;
		}
	}

	/** @member flush */
	function failModule(module, i, a, error) {
		if (error || isPending(module)) {
			module.flushState = $flushStates.ERROR;
			module.value = error || Error("timeout error");
			$boot.errors.push(module.value);
			log("error", specs(module.def), module.value);
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
			var refs = module.refs.map(findModule).filter(member);
			if (module.flushState == $flushStates.READY) {
				if (!refs.every(isReady)) return;
				module.flushState = $flushStates.FLUSH;
				refs.forEach(flushModule);
			}
			if (module.flushState == $flushStates.DONE) return;
			if (!refs.every(isFlushed)) return;
			if (!getContext(module).refs.map(getModule).every(allFlushed)) return;
			try {
				log("init:", specs(module.def));
				initModule(module);
				module.flushState = $flushStates.DONE;
			} catch (e) {
				failModule(module, null, null, e);
			}
		}
	}

	/** @member flush */
	function initModule(module) {
		applyFilters(module.value, module.def.spec, "type", module, "scope#init");
		applyFilters(module.value, module.def.spec, "pipe", module, "scope#init");
		module.value = (typeOf(module.def.args.value, "function") ? module.def.properties.value : module.def.args.value) || external(module);
		if (typeOf(module.def.args.value, "function")) {
			var values = module.def.refs.map(filterRefValue, module);
			values.push(module.scope);
			module.scope.value = module.value;
			module.value = module.def.args.value.apply(module.scope, values) || module.value;
			delete module.scope.value;
		}
		module.value = applyFilters(module.value, module.def.spec, "type", module);
		module.value = applyFilters(module.value, module.def.spec, "pipe", module);
	}

	/** @member request */
	function getSpec(node) {
		return spec(node.getAttribute("data-spec"));
	}

	/** @member request */
	function currentScript(nodes) {
		return $boot.global.document.currentScript || ($boot.script && $boot.script.previousElementSibling) || (nodes = $boot.global.document.getElementsByTagName("script"), nodes[nodes.length-1]);
	}

	/** @member request */
	function currentHash() {
		return $boot.doc ? $boot.global.location.hash.substring(1) : "";
	}

	/** @member request */
	function currentSpec() {
		return $boot.doc ? getSpec(currentScript()) : $boot.currentSpec;
	}

	/** @member request */
	function currentApp(app) {
		$boot.currentApp = app||$boot.currentApp;
		return $boot.currentApp||$boot.app;
	}

	function juseRoot(name) {
		return !$boot.context.cache || $boot.context.cache.roots.indexOf(name.split("/")[0]) >= 0;
	}

	/** @member ref */
	function spec(spec, base, keys) {
		if (typeOf(spec, "string")) spec = copy({}, $specFormat.exec(spec), $specFormatKeys);
		if (typeOf(base, "string")) base = copy({}, $specFormat.exec(base), $specFormatKeys);
		if (!typeOf(base, "object")) base = null;
		keys = typeOf(keys, "array") && keys || keys && spec && Object.keys(spec) || $specKeys;
		spec = copy(spec, base, keys, true);
		if (spec && spec.name) spec.name = spec.name.trim();
		return spec;
	}

	/** @member ref */
	function specs(ref) {
		var parts = [];
		for (var i = 0; i < $specKeys.length; i++) {
			var value = ref[$specKeys[i]];
			var delim = $specDelims[i];
			if (value || typeof(value) == "string" && delim) {
				if (i>1) parts.push(delim, value);
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
	function seal(to, from) {
		return Object.freeze(assign.apply(this, arguments));
	}

	/** @member util */
	function assign(to, from) {
		if (!to || !from) return to;
		for (var i = 1; i < arguments.length; i++) {
			assignValue.call(to, arguments[i]);
		}
		return to;
	}

	function assignValue() {
		for (var i = 0; i < arguments.length; i++) {
			var value = arguments[i], name = typeOf(value, "function") && $fnFormat.exec($boot.global.juse.toString.call(value))[1];
			if (name) copyValue(this, name, value);
			else if (typeOf(value, ["array","arguments"])) assignValue.apply(this, value);
			else copy(this, value);
		}
	}

	function copy(to, from, names, override, positive) {
		if (!to || !from) return to;
		var keys = typeOf(from, ["array","arguments"]) ? names : Object.keys(from);
		for (var i = 0; i < keys.length; i++) {
			var name = keys[i], value = (keys === names) ? from[i] : from[name];
			copyValue(to, name, value, names, override, positive);
		}
		return to;
	}

	/** @member util */
	function copyValue(to, name, value, names, override, positive) {
		if (!name) return;
		if (names && names.indexOf(name) < 0) return;
		if (!value && typeof(value) != "string") return;
		if (to.propertyIsEnumerable(name) && !override) return;
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
	function external(ref) {
		return $boot.doc && $boot.doc.getElementById(ref.member||ref.name) || member($boot.global, ref.member||ref.name);
	}

	/** @member util */
	function member(value, names, nameOnly) {
		var name;
		names = typeOf(names, "string") ? names.split(".") : names;
		if (names) {
			for (var i = 0; i < names.length; i++) {
				name = names[i];
				if (!typeOf(name, "string") || !value) break;
				value = !typeOf(value, "string") && (name in value) ? value[name] : (name = null);
			}
		}
		return (nameOnly===true) ? typeOf(name, "string") && name : value;
	}

	/** @member util */
	function log(value) {
		if (typeof(console) == "undefined") return;
		var context = getContext(currentApp());
		var property = member(context, ["scope", "property"]);
		var dev = property && context.scope.property("app-mode") == "dev";
		if (!dev) return;
		if (typeof(value) == "string") {
			var i = $logKeys.indexOf(value);
			var log = (i<0) ? console.log : console[$logKeys[i]];
			log.apply(console, arguments);
		} else {
			console.dir(value);
		}
	}

})(this)();

juse("juse/resource.context", function resource(){

	this.juse("properties", function properties(){
		return function properties(value){
			if (juse.member(this.spec, "key", true)) {
				var key = this.spec.key || juse.slicePath(this.spec.name, -1, 1);
				juse.copy(this.context.cacheValue("properties", key, {}), value);
			} else {
				juse.copy(this.context.cacheEntry("properties"), value);
			}
		};
	});

	this.juse("json", function json(){
		return function json(value){
			return JSON.parse(value);
		};
	});

	this.juse("html", function html(){
		return function html(value, name){
			if (juse.typeOf(value, "html", true)) return value;
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

	this.juse("async", ["try"], function async($try){
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

	this.juse("promise", ["try", "async"], function promise($try, $async){

		var $outer, $error = {};

		return juse.seal(promise,
			{resolve: function resolve(value){
				return promise(function(resolve, reject){
					resolve(value);
				});
			},
			reject: function reject(reason){
				return promise(function(resolve, reject){
					reject(reason);
				});
			}}
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

	this.juse("request", ["promise"], function request($promise){
		return function request(spec, args/*data, method, headers*/) {
			var req = { spec:spec, url:juse.path(juse.resolve(spec, this)), args:args||{}, scope:this };
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
			this.xhr.open(method, [this.url, keyValues(this.args.data)].filter(juse.member).join("?"), true);
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

juse("juse/core.context", ["juse/run"], function core(){

	this.juse("replace", function replace(){
		var $replaceFormat = /\$\{([^\}]+)\}/g;
		var $testFormat = /\$\{([^\}]+)\}/;

		return function replace(text, scope) {
			if (!text || typeof(text) != "string" || !$testFormat.test(text)) return text;
			return text.replace($replaceFormat, function(match, spec) {
				return juse.property(spec, scope) || match;
			});
		};
	});

	this.juse("map", function map(){
		return function map(spec){
			var map = {};
			for (var ref = juse.spec(spec); ref && ref.name; ref = juse.spec(ref.value)) {
				map[ref.key||""] = ref.name;
			}
			return map;
		};
	});

	this.juse("event", ["cache"], function event($cache){
		juse.assign(this, {init:init});
		return juse.seal(function event(value){
			return juse.seal(value||function event(){}, {addEventListener:this.addEventListener.bind(this), follow:this.follow.bind(this), fire:this.fire.bind(this)});
		}, {init:init});

		function init(){
			$cache.init.call(this);
			juse.assign(this, {addEventListener:addEventListener, follow:follow, fire:fire});
		}

		function addEventListener(kind, callback){
			if (juse.typeOf(callback, "function")) {
				callbacks(kind, this).push(callback);
			}
		}

		function follow(follower) {
			juse.follow(this, juse.assign({}, arguments));
		}

		function fire(kind, value, error){
			var args = {value:value, error:error};
			callbacks(kind, this).forEach(notify, args);
			return args.result;
		}

		function notify(callback) {
			try {
				this.result = this.result || callback(this.value, this.error);
			} catch (ex) {
				juse.log("error", ex);
			}
		}

		function callbacks(kind, scope) {
			return scope.cacheValue("callbacks", kind, []);
		}
	});

	this.juse("load|event", function load(){});

	this.juse("service", ["event", "promise"], function service($event, $promise){
		juse.assign(this, {init:init});
		return function service(value){
			return juse.seal(value||function service(){}, {addEventListener:this.addEventListener.bind(this), follow:this.follow.bind(this), fire:this.fire.bind(this), provide:this.provide.bind(this), submit:this.submit.bind(this)});
		};

		function init(){
			$event.init.call(this);
			juse.assign(this, {provide:provide, submit:submit});
		}

		function provide(callbacks){
			return juse.assign(this.cacheEntry("providers"), arguments);
		}

		function submit(spec, value) {
			var ref = juse.spec(spec);
			var provide = juse.member(this.provide(), ref.member);
			var args = {value:value};
			return $promise(provide.bind(args)).then($promise.resolve, $promise.reject);
		}
	});
});

juse("juse/text.context", ["juse/core"], function text(){

	this.juse("replace", ["teval"], function replace($teval, $scope){
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

	this.juse("teval", ["replace", "map"], function teval($replace, $map, $scope){
		return function teval(spec, dataset) {
			var ref = juse.spec(spec);
			var value = juse.property(ref, this, dataset) || juse.filter(ref, this, dataset);
			var map = juse.filter(ref.value, this) || $map(ref.value);
			if (map) {
				value = (juse.typeOf(value, "array") && !value.length || juse.typeOf(value, "object") && !Object.keys(value).length) ? null : value;
				var value2 = juse.member(map, [value], true) ? juse.member(map, [value])
						: (value && "*" in map) ? map["*"]
								: (!value && "" in map) ? map[""] : value;
				if (value2 !== value) value = $replace.call(this, value2, value);
			}
			return value;
		};
	});

});

juse("juse/ui.context", ["juse/resource", "juse/text", "juse/core"], function ui(){
	var $view, $dom, $array = [];

	this.juse("view", ["html", "load"], function view($html, $load, $scope){
		$load.follow({load:load});
		return function view(){
			$scope.context.cacheValue("views", this.spec.name, this.spec);
		};

		function load(value) {
			$view = $view || juse.global.document.body.querySelector("[data-view]") || juse.global.document.body;
			value = $html(value);
			if ($dom.closest(value, $view)) {
			} else if ($view.lastElementChild) {
				$view.replaceChild(value, $view.lastElementChild);
			} else {
				$view.appendChild(value);
			}
		}
	});

	this.juse("dom", ["html", "replace@juse/text"], function dom($html, $replace){
		return $dom = juse.seal(function dom(value, clone){
			return juse.typeOf(value, "string") ? $html.call(this, value) : clone ? value.cloneNode(true) : value;
		}, {
			TEXT_NODE: juse.global.document.TEXT_NODE,
			ELEMENT_NODE: juse.global.document.ELEMENT_NODE,
			ATTRIBUTE_NODE: juse.global.document.ATTRIBUTE_NODE,
			moveContent:moveContent,
			replaceContent:replaceContent,
			replaceText:replaceText,
			removeContent:removeContent,
			childNodes:childNodes,
			forNodes:forNodes,
			closest:closest,
			filterNodes:filterNodes,
			data:data,
			textNode:textNode,
			forTextNodes:forTextNodes,
			toggleClass:toggleClass
		});

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
				var matched = (typeof(this.selectors) != "string") ? node === this.selectors : node.matches ? node.matches(this.selectors) : node.parentNode.querySelector(this.selectors) == node;
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

		function replaceText(node, dataset, scope) {
			var args = {dataset:dataset, scope:scope};
			filterNodes(node).forEach(replaceTexts, args);
			replaceTexts.call(args, node);
			return node;
		}

		function replaceTexts(node) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				$array.forEach.call(node.attributes, replaceTextContent, this);
				$array.forEach.call(node.childNodes, replaceTextContent, this);
			}
		}

		function replaceTextContent(node) {
			if (node.nodeType == $dom.ATTRIBUTE_NODE || node.nodeType == $dom.TEXT_NODE) {
				node.nodeValue = $replace.call(this.scope, node.nodeValue, this.dataset);
			}
		}
	});

	this.juse("tile", ["dom", "map"], function tile($dom, $map){

		return function tile(node, dataset){
			return makeTile(node, dataset, this);
		};

		function makeTile(node, dataset, scope, outertag) {
			$dom.replaceText(node, dataset, scope);
			replaceTags(node, dataset, scope, outertag);
			return node;
		}

		function replaceTags(node, dataset, scope, outertag) {
			var args = {dataset:dataset, scope:scope, outertag:outertag, tiles:$dom.childNodes(outertag, "data-tile")};
			$dom.filterNodes(node, "[data-tag]").forEach(replaceTag, args);
		}

		function replaceTag(tag) {
			var spec = tag.getAttribute("data-tag");
			var ref = spec && juse.spec(spec);
			var tile = ref && juse.filter(juse.spec(ref, ".html"), this.scope);
			if (!ref && this.outertag) {
				tile = this.outertag;
			} else if (this.tiles[ref.name]) {
				tile = this.tiles[ref.name];
			} else if (tile) {
				tile = makeTile(tile.cloneNode(true), this.dataset||$map(ref.value), this.scope, tag);
			}
			if (tile) $dom.replaceContent(tag, tile);
			else juse.log("warn", "tile not found", spec);
		}

	});

	this.juse("widget", ["dom"], function widget($dom){

		var $eventKeys = ["click","dblclick","mousedown","mouseenter","mouseleave","mousemove","mouseover","mouseout","mouseup","input","change","keyup","keydown","keypress"];
		var $eventMap = {
			enter: juse.spec("keyup:13")
		};

		return juse.seal(function widget(node, scope) {
			node = $dom.call(this, node);
			bindWidgets(node, scope||this);
			return node;
		}, {bindEvent:bindEvent});

		function bindWidgets(node, scope) {
			$dom.filterNodes(node, "[data-widget]").forEach(bindWidget, scope);
			applyBindings(scope, node);
		}

		function bindWidget(node) {
			var spec = juse.spec($dom.data(node, "data-widget", null));
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
				var ref = juse.spec(spec, this.base);
				if (!bindEvent(this.scope, node, ref)) {
					$dom.data(node, "data-event", spec);
					break;
				}
				spec = ref.value;
			}
		}

		function bindEvent(scope, node, spec, action, target) {
			var event = juse.spec(spec);
			if (event) {
				var map = eventMap(event);
				var kind = map && map.kind || event.kind || $eventKeys[0];
				var i = $eventKeys.indexOf(kind);
				if (i >= 0) {
					action = action || juse.lookup(event, scope);
					if (juse.typeOf(action, "function")) {
						var args = {action:action, target:target, event:event};
						var follower = {};
						follower[kind] = fire.bind(args);
						juse.follow(node, follower);
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

	this.juse("validator", function validator(){
		return function validator(value){
			$context.cacheValue("validators", this.spec.name, value);
		};
	});

	this.juse("validate", function validate(){
		return function validate(spec, value, ref){
			var messages;
			for (spec = juse.spec(spec); spec; spec = juse.spec(spec.value)) {
				var name = spec.kind || spec.name;
				var validator = $context.cacheValue("validators", name);
				var message = juse.typeOf(validator, "function") && validator.call(this, spec, value, ref);
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

	this.juse("required|validator", ["replace"], function required($replace){
		return function required(spec, value, ref) {
			return value ? "" : $replace(juse.property("#required.message", this) || "required: ${0}", juse.specs(ref));
		};
	});

});

juse("juse/model.context", ["juse/remote", "juse/core", "juse/ui", "juse/valid", "juse/text"], function model(){
	var $modelKeys = ["kind","name"], $context = this;

	this.juse("binder", function binder(){
		return function binder(){
			$context.cacheValue("binders", this.spec.name, this.spec);
		};
	});

	function getBinder(kind) {
		return juse.lookup($context.cacheValue("binders", kind)) || juse.lookup($context.cacheValue("binders", "value"));
	}

	function getModel(spec, create) {
		spec = juse.spec(spec);
		var model = spec && $context.cacheValue("models", spec.name);
		if (!model && create) {
			model = { tiles:[], value:null };
			if (spec) {
				model.spec = {};
				$context.cacheValue("models", spec.name, model);
			}
		}
		if (model && create) {
			juse.copy(model.spec, spec, $modelKeys);
			model.binder = getBinder(model.spec&&model.spec.kind);
		}
		return model;
	}

	this.juse("model", ["dom", "tile", "validate", "load"], function model($dom, $tile, $validate, $load){
		$load.follow({load:load});
		return juse.seal(function model(node) {
			node = $dom.call(this, node);
			makeModels.call(this, node);
			return node;
		},
		{renderChild:renderChild, renderModel:renderModel, fireEvent:fireEvent, notifyInput:notifyInput, addTile:addTile, getModel:getModel, getModelValue:getModelValue, notifyModel:notifyModel, resolveEvent:resolveEvent, rejectEvent:rejectEvent});

		function load() {
			var models = $context.cacheEntry("models");
			juse.values(models).forEach(renderDefault);
		}

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
			return spec && juse.spec(spec, base, true).kind || ($dom.textNode(node) ? "text" : ("form" in node) ? "input" : "");
		}

		function addTile(node, model, spec) {
			spec = juse.spec(spec, model && model.spec, true);
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
				juse.lookup(input.event.name, input.scope).submit(input.event, value).then(resolveEvent.bind(args), rejectEvent.bind(args));
			}
		}

		function resolveEvent(value) {
			notifyInput(this.input, value);
		}

		function rejectEvent(error) {
			notifyMessage(this.input, "event: " + juse.specs(this.input.event) + ", message: " + error.message);
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
				juse.log("error", messages);
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
			spec = juse.spec(spec);
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

	this.juse("input|binder", ["dom", "widget", "model", "teval"], function input($dom, $widget, $model, $teval){
		return juse.seal(
			function input(tile){
				tile.valid = juse.spec($dom.data(tile.node, "data-valid", null));
				tile.event = juse.spec($dom.data(tile.node, "data-event", null));
				var event = juse.spec(":", tile.event, true);
				event.kind = event.kind || inputEvent(tile);
				$widget.bindEvent(tile.scope, tile.node, event, fireEvent, tile);
			}
			,{render:render,clear:clear}
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

	this.juse("link|binder", ["dom", "widget", "model"], function link($dom, $widget, $model){
		return juse.seal(
			function link(tile){
				tile.link = $model.getModel(tile.spec.name, true);
				tile.event = juse.spec($dom.data(tile.node, "data-event", null));
				$widget.bindEvent(tile.scope, tile.node, juse.spec(":", tile.event, true), fireEvent, tile);
			}
			,{notify:notify,render:render}
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

	this.juse("list|binder", ["dom", "model"], function list($dom, $model){
		return juse.seal(
			function list(tile){
				tile.content = $dom.moveContent(tile.node);
				tile.models = [];
			}
			,{update:update,render:render}
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

	this.juse("map|binder", ["dom", "model"], function map($dom, $model){
		return juse.seal(
			function map(tile){
				tile.content = $dom.moveContent(tile.node);
				tile.models = [];
			}
			,{update:update,render:render}
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

	this.juse("remote|binder", ["dom", "widget", "model", "request"], function remote($dom, $widget, $model, $request){
		return juse.seal(
			function remote(tile){
				tile.event = juse.spec($dom.data(tile.node, "data-event", null));
				$widget.bindEvent(tile.scope, tile.node, juse.spec(":", tile.event, true), fireEvent, tile);
				load(tile);
			}
			,{notify:notify,load:load}
		);

		function fireEvent(tile) {
			$model.fireEvent(tile, tile.model.value);
		}

		function notify(input, value) {
			$model.notifyModel($model.getModel(input.spec), value, input);
		}

		function load(input){
			var args = {input:input};
			$request.call(input.scope, juse.spec(".json", input.spec, true)).then($model.resolveEvent.bind(args), $model.rejectEvent.bind(args));
		}
	});

	this.juse("text|binder", ["model", "teval"], function text($model, $teval){
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
			,{render:render}
		);

		function render(tile, value, input) {
			tile.node.nodeValue = tile.content.replace($replaceFormat, function(match, spec) {
				spec = juse.spec(spec, tile.model.spec, true);
				var value = !spec.name ? tile.model.value : $model.getModelValue(spec.name);
				return $teval.call(tile.scope, spec, value) || "";
			});
		}
	});

	this.juse("value|binder", ["dom", "teval"], function value($dom, $teval){
		return juse.seal(
			function value(tile){
				tile.length = tile.node.innerHTML.length;
			}
			,{update:update,render:render}
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
