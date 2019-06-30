/*!
 * Another AMD inspired JavaScript framework to load modules and manage dependencies.
 */
(function boot($scope){
	"use strict";
	var $bootArgs = ["main", "base", "verbose", "import"];
	var $defArgs = ["spec", "value"];
	var $refKeys = ["key", "kind", "name", "type", "member", "context"];
	var $specKeys = $refKeys.concat("pipe", "value");
	var $specFormatKeys = [""].concat($specKeys);
	var $specFormat = /(?:\s*([^.#@|;\s]*)\s*=)?(?:\s*([^.#@|;\s]*)\s*:)?\s*([^.#@|;]*)(?:\.([^#@|;\s]*))?(?:#([^@|;\s]*))?(?:@([^|;\s]*))?(?:\s*\|\s*([^;\s]*))?(?:\s*;\s*([\S\s]*))?/;
	var $specDelims = ["=", ":", "", ".", "#", "@", "|", ";"];
	var $fnFormat = /function\s*(\S*)\s*\([^)]*\)\s*{\s*((?:\/\*+!(?:[^*]|\*(?!\/))*\*+\/\s*)*)/;
	var $propFormat = /\/\*+!\s*(?:@((?:[^\s*]|\*(?!\/))+))?\s*((?:[^*]|\*(?!\/))*)\*+\/\s*/;
	var $flushStates = enums(["BUFFER", "LOAD", "DEFINE", "RESOLVE", "FLUSH", "DONE", "FAIL"]);
	var $logKeys = enums(["error", "warn", "info", "debug"]);
	var $boot = {
		buffer:[], errors:[], flushCount:0, moduleCount:0,
		global: $scope.document ? $scope : global
	};

	/** @member boot */
	return function boot(){
		if ($boot.global.juse) return;
		$boot.global.juse = {};
		if ($boot.global.document) {
			copy($boot, {doc:$boot.global.document, script:currentScript(), async:!!$boot.global.document.currentScript});
			$boot.args = getBootArgs();
			$boot.args = copy({main:spec($boot.args.main||""), jusePath:slicePath($boot.script.getAttribute("src"), -1)}, $boot.args);
			if ($boot.doc.head != $boot.script.parentNode) {
				$boot.doc.head.appendChild($boot.script);
			}
			loadRoot().import("juse/core", $boot.args["import"]);
			juse.follow($boot.global, {"load":loadMain, "hashchange":loadMain});
		} else {
			$boot.args = getBootArgs();
			$boot.args = copy({main:spec($boot.args.main||""), jusePath:__dirname}, $boot.args);
			loadRoot().import("juse/core", $boot.args["import"]).then(loadMain);
		}
	};

	function getBootArgs() {
		if ($boot.doc) return $bootArgs.reduce(function(args, key){
			var name = "data-"+key;
			return (args[key] = $boot.script.getAttribute(name) || $boot.script.hasAttribute(name)), args;
		}, {});
		else return process.argv.reduce(function(args, arg, i){
			if (i < 2 || arg == "-" || arg.charAt(0) != "-") return args;
			var pair = arg.substring(1).split("=");
			return (args[pair[0]] = pair[1] || true), args;
		}, {});
	}

	/** @member boot */
	function done() {
		if ($boot.doc) log($boot);
		else log($boot.args);
		log("--done:", currentMain());
	}

	/** @member boot */
	function loadMain() {
		var main = currentMain(spec(currentHash(), currentMain()));
		log("--load:", main);
		impOrt(spec(main.context, ".context")).then(function(){
			impOrt(main, "onload").then(function($main, $onload){
				if (!$onload.fire("load", main)) {
					typeOf($main, "function") && $main();
				}
				if (!$onload.fire("done", main)) {
					setTimeout(done);
				}
			});
		});
	}

	/** @member boot */
	function loadRoot() {
		return define(".context", function(){

			define("juse", function(){
				$boot.global.juse = expOrt({
					global:$boot.global,
					define:define,
					import:impOrt,
					export:expOrt,
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

			define("juse/cache", function(){
				assign(this, { init:init });

				function init() {
					assign(this, {cacheInit:cacheInit, cacheEntry:cacheEntry, cacheValue:cacheValue});
					getModule(this.spec).cache = {};
				}

				function cacheInit(value) {
					if (!this.cacheInit) init.call(this);
					return copy(getModule(this.spec).cache, value);
				}

				function cacheEntry(name, value) {
					var cache = getModule(this.spec).cache;
					return cache[name] = cache[name] || value || {};
				}

				function cacheValue(name, member, value) {
					var cache = this.cacheEntry(name);
					if (value !== undefined) cache[member] = cache[member] || value;
					return cache[member];
				}
			});

			define("juse/context|juse/cache", function(){
				init.call(this.context);
				this.cacheInit.call(this.context, initContext({
					map: { "*": "modules:", "context": "juse/context@", "cache": "juse/cache@", "juse": "juse@" },
					roots: [ "juse", "jx" ]
				}));
				expOrt(function context(value){
					this.cacheInit(initContext(value));
					copy(this.cacheEntry("properties"), member(value, "properties"));
					return {};
				});
				assign(this, {init:init});

				function init() {
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

			define("juse/request", function(){
				expOrt(function request(ref){
					if (!$boot.doc) return nodeRequest(ref);
					else if (ref.type == "css") return defaultRequest(ref);
					else if (ref.kind == "static") return staticRequest(ref);
					else return defaultRequest(ref);
				});

				function nodeRequest(ref) {
					var path = juse.path(ref);
					log("load:", juse.specs(ref), "<-", path);
					$boot.currentSpec = ref;
					require(path);
					var module = unbufferModule(ref);
					if (external(module)) {
						module.flushState = $flushStates.DEFINE;
					}
				}

				function defaultRequest(ref) {
					var path = juse.path(ref), spec = juse.specs(ref);
					var tagName = ref.type == "css" ? "link" : "script";
					var tag = $boot.doc.createElement(tagName);
					tag.setAttribute("data-import", spec);
					if (tagName == "link") {
						copy(tag, {href:path, title:spec, rel:"stylesheet"}, null, true, true);
					} else {
						copy(tag, {src:path, async:$boot.async}, null, true, true);
					}
					log("load:", spec, "<-", tag);
					juse.follow(tag, {"load":defaultResponse, "error":defaultResponse});
					$boot.script.parentNode.insertBefore(tag, $boot.script);
				}

				function defaultResponse(event) {
					var module = unbufferModule(getSpec(event.target));
					if (event.type == "load") {
						if (module.type == "css") {
							module.flushState = $flushStates.DONE;
						} else if (external(module)) {
							module.flushState = $flushStates.DEFINE;
						}
					} else if (event.type == "error") {
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
					var module = unbufferModule(this.ref);
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
				return ref = spec(ref), getContext(scope && scope.spec || currentMain()).scope.property(ref) || member(properties, ref.name) || member(scope, ["properties", ref.name]);
			}

			function resolve(spec, scope) {
				return refmap(spec, getModule(scope && scope.spec || currentMain()));
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
				var module = getModule(scope && scope.spec || currentMain());
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
					var base = juseRoot(name) ? "" : $boot.doc ? $boot.args.base : [".", $boot.args.base].filter(member).join("/");
					path = juseRoot(name) ? $boot.args.jusePath : getContext(currentMain()).kind;
					path = [base, path, ref.kind, name].filter(member).join("/");
				}
				return path;
			}
		});
	}

	/** @member define */
	function impOrt(spec) {
		var flow = currentFlow(this);
		flow.imports = $boot.buffer.slice.call(arguments).filter(member);
		var def = resolveDef(currentSpec(flow), flow);
		flow.importer = defineModule(def, flow);
		return flow;
	}

	/** @member define */
	function define(spec, value) {
		var flow = currentFlow(this);
		var def = resolveDef(currentSpec(flow), flow, getDefArgs([spec, value], arguments.length));
		defineModule(def, flow);
		delete flow.importer;
		return flow;
	}

	function then(value) {
		return this.define(null, value);
	}

	function expOrt(value) {
		return $boot.exports = assign.apply(this, arguments);
	}

	function currentFlow(flow) {
		return (flow && "currentSpec" in flow) ? flow : {import:impOrt, then:then, define:define, currentSpec:currentSpec(flow)};
	}

	function currentSpec(flow) {
		return (flow && "currentSpec" in flow) ? flow.currentSpec : ($boot.doc && flow) ? getSpec(currentScript()) : $boot.currentSpec;
	}

	/** @member define */
	function resolveDef(ref, flow, args) {
		var def;
		if (args) {
			def = {importer:flow.importer, args:args};
			if ($boot.outerContext) {
				copy(def, spec(def.args.spec));
				def.context = $boot.outerContext.name;
			} else {
				copy(def, spec(def.args.spec, ref));
			}
			copy(def, resolveRefMap(def, def, true));
			copy(def, getDefProperties(args.value), null, true);
		} else if (flow) {
			def = {imports:flow.imports};
			if ($boot.outerContext) {
				def.importer = $boot.outerContext;
			} else if (ref) {
				def.importer = getContext(ref);
				def.currentSpec = ref;
			} else {
				def.importer = $boot.context;
			}
			copy(def, {context:def.importer.name});
		} else {
			def = copy({args:{}}, ref);
		}
		return def;
	}

	function bufferModule(ref) {
		if (ref && !getModule(ref)) {
			log("buffer:", specs(ref));
			if (external(ref)) {
				defineModule(resolveDef(ref));
			} else {
				var module = makeModule(resolveDef(ref), $flushStates.BUFFER);
				if (module) {
					$boot.buffer[specs(ref)] = module;
				} else {
					log("warn", "fail to buffer", specs(ref), "by", specs(this));
				}
			}
		}
	}

	/** @member define */
	function unbufferModule(ref) {
		var spec = specs(ref);
		var module = $boot.buffer[spec];
		if (module) delete $boot.buffer[spec];
		return module;
	}

	/** @member define */
	function defineModule(def, flow) {
		var module = getModule(def);
		if (module && isFailed(module)) setModule(def);
		if (!module || isPending(module)) {
			log("define:", specs(def));
			if (module) module.flushState = $flushStates.DONE;
			module = makeModule(def, $flushStates.DEFINE);
			module.flow = flow;
			$boot.context = $boot.context || module;
			if (!$boot.buffer.some(isResolved)) {
				flush();
			}
		}
		return module;
	}

	/** @member define */
	function makeModule(def, flushState) {
		var module = copy({}, def, $specKeys);
		if (!setModule(def, module)) return;
		$boot.buffer.push(module);
		module.id = $boot.moduleCount++;
		module.flushState = flushState;
		module.def = def;
		module.scope = {spec:copy({}, def, $refKeys), properties:copy({}, def.properties)};
		if (isContext(module)) {
			module.modules = {};
		} else {
			module.scope.context = getContext(module).scope;
		}
		return module;
	}

	/** @member define */
	function getDefArgs(args, count) {
		if (count < $defArgs.length && !typeOf(args[0], "string")) {
			args.unshift("");
		}
		return copy({}, args, $defArgs);
	}

	/** @member define */
	function getDefProperties(value) {
		var values = typeOf(value, "function") && $fnFormat.exec(done.toString.call(value));
		var def = {name:values[1], properties:{}};
		value = values[2] || "";
		if (value) while (values = $propFormat.exec(value)) {
			var name = values[1]||"value", val = values[2]||"";
			def.properties[name] = val.trim();
			value = value.substring(values.index + values[0].length);
		}
		return def;
	}

	/** @member module */
	function getContext(ref, context) {
		var name = typeOf(ref, "object") ? ref.context||context : ref;
		return name ? member($boot.context, ["modules", name]) : $boot.context;
	}

	/** @member module */
	function getModule(ref) {
		return ref && (isContext(ref) ? getContext(ref.name) : typeOf(getModuleName(ref), "string") && member(getContext(ref), ["modules", getModuleName(ref)]));
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
		var ref = refmap(spec, this.def.currentSpec||this);
		if (ref.value) {
			ref.value = juse.lookup("replace@juse/core")(ref.value, this.scope);
		}
		return ref;
	}

	/** @member resolve */
	function remapRef(spec) {
		return refmap(spec, this, true);
	}

	/** @member resolve */
	function refmap(ref, module, mapOnly) {
		ref = spec({}, ref);
		if (!ref.name || !module) return ref;
		var map = resolveRefMap(ref, module);
		if (mapOnly && !map) return;
		copy(ref, map, $specKeys, true, true);
		if (!map) {
			ref.name = getRefName(ref, module);
		}
		if (ref.type) {
			copy(ref, resolveRefMap(getModuleName("*", ref.type), module));
		}
		if (ref.context || module.context || isContext(module) || juseRoot(ref.name)) {
			copy(ref, resolveRefMap("*", module));
		}
		return copy(ref, {kind:module.kind||getContext(module).kind, context:module.context});
	}

	/** @member resolve */
	function getRefName(ref, spec) {
		var absolute = "context" in ref || ref.name.indexOf("/") >= 0;
		var base = absolute ? null : slicePath(spec.name, -1);
		return [base].concat(ref.name.split("/")).filter(member).join("/");
	}

	function sameRef(ref) {
		return ref.name == this.name && ref.type == this.type && ref.context == this.context;
	}

	function diffRef(ref) {
		return !sameRef.call(this, ref);
	}

	/** @member resolve */
	function resolveRefMap(ref, def, remapOnly) {
		var refKey = typeOf(ref, "object") ? getModuleName(ref, ref.type) : ref;
		var moduleKey = getModuleName(def, def.type);
		var remap = moduleKey && (member(getContext($boot.args.main), ["cache", "remap", moduleKey, refKey])
			|| member(getContext(def), ["cache", "remap", moduleKey, refKey]));
		return remapOnly ? remap : remap
			|| member(getContext($boot.args.main), ["cache", "map", refKey])
			|| member(getContext(def), ["cache", "map", refKey])
			|| member(getContext(), ["cache", "map", refKey])
			|| findRefMap(def, refKey);
	}

	/** @member resolve */
	function findRefMap(module, refKey) {
		if (!("context" in module)) return;
		var args = {refKey:refKey}, context = getContext(module);
		return (getRefMap.call(args, context) || context.imports.some(getRefMap, args)) && args.spec;
	}

	/** @member resolve */
	function getRefMap(ref) {
		var module = getModule(ref);
		return this.spec = isContext(module) && member(module, ["modules", this.refKey, "scope", "spec"]);
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
	function applyFilters(value, ref, key, module, filter) {
		return resolveFilters(ref, key, module).map(getModule).reduce(applyFilter, {module:module, filter:spec(filter), value:value}).value;
	}

	/** @member filter */
	function applyFilter(args, filter) {
		var filterDef = filter.def;
		filter = args.filter ? member(filter, [args.filter.name, args.filter.member]) : member(filter, "value");
		args.value = typeOf(filter, "function") && filter.call(args.module.scope, args.value) || args.value;
		if (args.filter) {
			applyFilters(args.value, filterDef, "pipe", args.module, args.filter);
		}
		return args;
	}

	/** @member flush */
	function flush() {
		clearTimeout($boot.flushTimeout);
		$boot.buffer.filter(isContext).forEach(resolveImports);
		if (!$boot.buffer.some(isContextResolved)) {
			$boot.buffer.forEach(resolveImports);
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
			if (!$boot.buffer.length) {
				$boot.flushCount = 0;
			} else if ($boot.currentMain && !$boot.buffer.some(isLoading)) {
				$boot.flushCount++;
				flush();
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
	function isFailed(module) {
		return module.flushState == $flushStates.FAIL;
	}

	/** @member flush */
	function isResolved(module) {
		return module.flushState >= $flushStates.RESOLVE;
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
	function isContextResolved(module) {
		return isContext(module) && isResolved(module);
	}

	/** @member flush */
	function allResolved(ref) {
		var module = ref.def ? ref : getModule(ref);
		return !module || module == this || (isContextResolved(module) ? juse.values(module.modules).every(isResolved) : !this.imports.some(sameRef, ref));
	}

	/** @member flush */
	function resolveImports(module) {
		if (module.flushState == $flushStates.DEFINE) {
			module.imports = module.def.imports ? module.def.imports.map(resolveRef, module) : module.def.importer ? module.def.importer.def.imports.map(resolveRef, module.def.importer) : [];
			if (!module.imports.every(getModule) && !getContext(module).imports.every(allResolved, module)) return;
			if (module.imports.length && !$boot.currentMain) return;
			module.flushState = $flushStates.RESOLVE;
			if (module.def.imports) {
				module.def.importer.imports.push.apply(module.def.importer.imports, module.imports.filter(diffRef, module.def.importer));
			} else if (module.def.type) {
				copy(module.def, resolveRefMap(getModuleName("*", module.def.type), module));
			}
			module.imports.forEach(bufferModule, module);

			if (module.def.imports) {
				module.flushState = $flushStates.DONE;
			} else if ((typeOf(module.value, "string") && module.value || module.def.kind == "static" && !module.def.args.value) && !external(module)) {
				module.flushState = $flushStates.BUFFER;
				$boot.buffer[specs(module.def)] = module;
			}
		}
	}

	/** @member flush */
	function loadModule(module) {
		if (module.flushState == $flushStates.BUFFER) {
			module.flushState = $flushStates.LOAD;
			juse.lookup("juse/request@")(module.def);
			return !$boot.async;
		}
	}

	/** @member flush */
	function failModule(module, i, a, error) {
		if (error || isPending(module)) {
			module.flushState = $flushStates.FAIL;
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
		if (module.flushState == $flushStates.RESOLVE || module.flushState == $flushStates.FLUSH) {
			var imports = module.imports.map(getModule).filter(member);
			if (module.flushState == $flushStates.RESOLVE) {
				if (!imports.every(isResolved)) return;
				module.flushState = $flushStates.FLUSH;
				imports.forEach(flushModule);
			}
			if (!imports.every(isFlushed)) return;
			if (module.flushState == $flushStates.DONE) return;
			try {
				log("init:", specs(module.def));
				$boot.outerContext = isContext(module) ? module : getContext(module);
				initModule(module);
				module.flushState = $flushStates.DONE;
			} catch (e) {
				failModule(module, null, null, e);
			} finally {
				delete $boot.outerContext;
			}
		}
	}

	/** @member flush */
	function initModule(module) {
		module.value = (typeOf(module.def.args.value, "function") ? module.def.properties.value : module.def.args.value) || external(module, true);
		applyFilters(module.value, module.def, "type", module, "scope#init");
		applyFilters(module.value, module.def, "pipe", module, "scope#init");
		delete $boot.exports;
		if (typeOf(module.def.args.value, "function")) {
			var values = module.imports.map(filterRefValue, module);
			if (!values.length && "exports" in module.flow) values.push(module.flow.exports);
			values.push(module.scope);
			module.scope.value = module.value;
			var exports = module.def.args.value.apply(module.scope, values) || $boot.exports;
			if (exports !== undefined) module.flow.exports = exports;
			module.value = exports || module.value;
			delete module.scope.value;
		}
		delete module.flow;
		delete $boot.exports;
		module.value = applyFilters(module.value, module.def, "type", module);
		module.value = applyFilters(module.value, module.def, "pipe", module);
	}

	/** @member request */
	function getSpec(node) {
		return spec(node.getAttribute("data-import"));
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
	function currentMain(main) {
		return ($boot.currentMain = main||$boot.currentMain) || $boot.args.main;
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
			var value = arguments[i], name = typeOf(value, "function") && $fnFormat.exec(done.toString.call(value))[1];
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
	function external(ref, remove) {
		var value = $boot.doc && $boot.doc.getElementById(getModuleName(ref));
		if (remove && value) value.parentNode.removeChild(value);
		return value || member($boot.global, ref.member||ref.name);
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
		if (!$boot.args.verbose || typeof(console) == "undefined") return;
		if (typeof(value) == "string") {
			var i = $logKeys.indexOf(value);
			var log = (i<0) ? console.log : console[$logKeys[i]];
			log.apply(console, arguments);
		} else {
			console.dir(value);
		}
	}

})(this)();

juse.define("juse/run.context", function(){

	juse.define("try", function(){
		juse.export(function $try(fn, args, error, target){
			try {
				return fn.apply(target, args);
			} catch (ex) {
				if (error) error.ex = ex;
				return error;
			}
		});
	}).define("async", function($try){
		var callAsync = (typeof setImmediate == "function") ? setImmediate : setTimeout;
		var $buffer = [];

		juse.export(function async(callback){
			if (!$buffer.length) {
				callAsync(flush);
			}
			$buffer.push(callback);
		});

		function flush() {
			var error = {};
			while ($buffer.length) {
				if ($try($buffer.shift(), null, error) === error) {
					juse.log("error", error.ex);
				}
			}
		}

	});

	juse.import("try", "async").define("promise", function($try, $async){

		var $outer, $error = {};

		juse.export(promise,
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

juse.import("juse/run").define("juse/core.context", function(){

	juse.define("replace", function(){
		var $format = /\$\{([^\}]+)\}/g;
		juse.export(function replace(text, scope) {
			if (!text || typeof(text) != "string" || !$format.test(text)) return text;
			return text.replace($format, function(match, spec) {
				return juse.property(spec, scope) || match;
			});
		});
	});

	juse.define("map", function(){
		juse.export(function map(spec){
			var map = {};
			for (var ref = juse.spec(spec); ref && ref.name; ref = juse.spec(ref.value)) {
				map[ref.key||""] = ref.name;
			}
			return map;
		});
	});

	juse.define("event|cache", function(){
		juse.export(function event(value){
			return juse.seal(value||function event(){}, {addEventListener:this.addEventListener.bind(this), follow:this.follow.bind(this), fire:this.fire.bind(this)});
		});

		juse.assign(this, {init:function init(){
			juse.assign(this, {addEventListener:addEventListener, follow:follow, fire:fire});
		}});

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

	juse.define("onload|event");

	juse.import("promise").define("service|event", function($promise){
		juse.export(function service(value){
			return juse.seal(value||function service(){}, {addEventListener:this.addEventListener.bind(this), follow:this.follow.bind(this), fire:this.fire.bind(this), provide:this.provide.bind(this), submit:this.submit.bind(this)});
		});

		juse.assign(this, {init:function init(){
			juse.assign(this, {provide:provide, submit:submit});
		}});

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

juse.import("juse/core").define("juse/text.context", function(){

	juse.import("teval").define("replace", function($teval, $scope){
		var $format = /\$\{([^\}]+)\}/g;
		juse.export(function replace(text, dataset){
			$teval = $teval || juse.lookup("teval", $scope);
			var scope = this;
			var args = arguments;
			if (!text || typeof(text) != "string" || !$format.test(text)) return text;
			return text.replace($format, function(match, spec) {
				var value = match;
				var idx = parseInt(spec)+1;
				if (idx) {
					if (idx in args) value = args[idx];
				} else {
					value = $teval.call(scope, spec, dataset) || value;
				}
				return value;
			});
		});
	});

	juse.import("replace", "map").define("teval", function($replace, $map, $scope){
		juse.export(function teval(spec, dataset) {
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
		});
	});

});

juse.define("juse/resource.context", function(){

	juse.define("properties", function(){
		juse.export(function properties(value){
			if (juse.member(this.spec, "key", true)) {
				var key = this.spec.key || juse.slicePath(this.spec.name, -1, 1);
				juse.copy(this.context.cacheValue("properties", key, {}), value);
			} else {
				juse.copy(this.context.cacheEntry("properties"), value);
			}
		});
	});

	juse.define("json", function(){
		juse.export(function json(value){
			return JSON.parse(value);
		});
	});

	juse.define("html", function(){
		juse.export(function html(value, name){
			if (juse.typeOf(value, "html", true)) return value;
			var div = juse.global.document.createElement(name||"div");
			div.innerHTML = value;
			return div;
		});
	});
});

juse.import("juse/run").define("juse/remote.context", function(){

	juse.import("promise").define("request", function($promise){
		juse.export(function request(spec, args/*data, method, headers*/) {
			var req = { spec:spec, url:juse.path(juse.resolve(spec, this)), args:args||{}, scope:this };
			return $promise(sendRequest.bind(req));
		});
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

juse.import("juse/resource", "juse/text", "juse/core").define("juse/ui.context", function(){
	var $view, $dom, $array = [];

	juse.import("html", "onload").define("view", function($html, $onload, $scope){
		$onload.follow({load:load});
		juse.export(function view(){
			$scope.context.cacheValue("views", this.spec.name, this.spec);
		});

		function load(main) {
			$view = $view || juse.global.document.body.querySelector("[data-view]") || juse.global.document.body;
			var value = $html(juse.lookup(main));
			if ($dom.closest(value, $view)) {
			} else if ($view.lastElementChild) {
				$view.replaceChild(value, $view.lastElementChild);
			} else {
				$view.appendChild(value);
			}
		}
	});

	juse.import("html").define("dom", function($html){
		$dom = juse.export(function dom(value, clone){
			return juse.typeOf(value, "string") ? $html.call(this, value) : clone ? value.cloneNode(true) : value;
		}, {
			TEXT_NODE: juse.global.document.TEXT_NODE,
			ELEMENT_NODE: juse.global.document.ELEMENT_NODE,
			ATTRIBUTE_NODE: juse.global.document.ATTRIBUTE_NODE,
			moveContent:moveContent,
			replaceContent:replaceContent,
			removeContent:removeContent,
			childNodes:childNodes,
			forNodes:forNodes,
			closest:closest,
			filterNodes:filterNodes,
			selectNodes:selectNodes,
			bindNodes:bindNodes,
			data:data,
			values:values,
			textNode:textNode,
			forTextNodes:forTextNodes,
			toggleClass:toggleClass,
			hasClass:hasClass,
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

		function values(node) {
			return $array.reduce.call(node.attributes, dataValue, {});
		}

		function dataValue(value, attr) {
			if (!attr.name.indexOf("data-")) {
				value[attr.name.substring(5)] = attr.value;
			}
			return value;
		}

		function filterNodes(node, name) {
			return selectNodes(node, "["+name+"]");
		}

		function selectNodes(node, selector) {
			selector = selector || node.nodeType != $dom.ELEMENT_NODE && "*";
			var nodes = selector ? node.querySelectorAll(selector) : node.getElementsByTagName("*");
			return $array.slice.call(nodes);
		}

		function bindNodes(node, selector, bind) {
			$array.forEach.call(node.querySelectorAll(selector), bind);
			return node;
		}

		function textNode(node) { return node.nodeType == $dom.ATTRIBUTE_NODE || node.nodeType == $dom.TEXT_NODE; }

		function forTextNodes(nodes, callback, scope) {
			nodes && $array.filter.call(nodes, textNode).forEach(callback, scope);
		}

		function toggleClass(node, name, toggle) {
			var names = node.className ? node.className.split(" ") : [];
			var index = names.indexOf(name);
			if (toggle != false && index < 0) {
				names.push(name);
			} else if (toggle != true && index >= 0) {
				names.splice(index, 1);
			}
			name = names.join(" ");
			if (node.className != name) {
				node.className = name;
			}
		}

		function hasClass(node, name) {
			return node.className && node.className.split(" ").indexOf(name) >= 0;
		}
	});

	juse.import("dom", "replace@juse/text").define("template", function($dom, $replace){
		var $array = [];

		juse.export(function template(node, dataset){
			return replaceText(node, dataset, this);
		});

		juse.assign(this, {init:function init(node){
			juse.copy(this.properties, $dom.values(node));
		}});

		function replaceText(node, dataset, scope) {
			var args = {dataset:dataset, scope:scope};
			$dom.selectNodes(node).forEach(replaceTexts, args);
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

	juse.import("dom", "widget", "map").define("tile", function($dom, $widget, $map){

		juse.export(function tile(node, tiles, dataset){
			return makeTile(node, tiles, dataset, this);
		});

		function makeTile(node, tiles, dataset, scope, outertag) {
			replaceTags(node, tiles, dataset, scope, outertag);
			return node;
		}

		function replaceTags(node, tiles, dataset, scope, outertag) {
			var names = tiles ? Object.keys(tiles).join(",") : null;
			var args = {dataset:dataset, names:names, scope:scope, outertag:outertag, tiles:tiles||$dom.childNodes(outertag, "data-tile")};
			if (names) {
				$dom.selectNodes(node, names).forEach(replaceTag, args);
			} else {
				$dom.filterNodes(node, "data-tag").forEach(replaceTag, args);
			}
		}

		function replaceTag(tag) {
			var spec = this.names && tag.tagName.toLowerCase() || tag.getAttribute("data-tag");
			var ref = spec && juse.spec(spec);
			var tile = null;
			if (!ref && this.outertag) {
				tile = this.outertag;
			} else if (this.tiles[ref.name]) {
				tile = $dom(this.tiles[ref.name]);
			} else {
				tile = ref && juse.filter(juse.spec(ref, ".html"), this.scope);
				tile = tile && tile.cloneNode(true);
			}
			if (tile) {
				var dataset = this.names ? $dom.values(tag) : $map(ref.value);
				tile = makeTile(tile, null, this.dataset||dataset, this.scope, tag);
				$dom.replaceContent(tag, $widget.call(this.scope, tile));
			}
			else juse.log("warn", "tile not found", spec);
		}

	});

	juse.import("dom").define("widget", function($dom){

		var $eventKeys = ["click","dblclick","mousedown","mouseenter","mouseleave","mousemove","mouseover","mouseout","mouseup","input","change","keyup","keydown","keypress"];
		var $eventMap = {
			enter: juse.spec("keyup:13")
		};

		juse.export(function widget(node, scope) {
			node = $dom.call(this, node);
			bindWidgets(node, scope||this);
			return node;
		}, {bindEvent:bindEvent});

		function bindWidgets(node, scope) {
			$dom.filterNodes(node, "data-widget").forEach(bindWidget, scope);
			applyBindings(scope, node);
		}

		function bindWidget(node) {
			var spec = juse.spec($dom.data(node, "data-widget", null));
			var widget = juse.lookup(spec, this);
			if (widget && juse.typeOf(widget.bindWidget, "function")) {
				widget.bindWidget.call(this, node);
			} else if (juse.typeOf(widget, "function")) {
				widget.call(this, node);
			}
			applyBindings(this, node, spec);
		}

		function applyBindings(scope, node, base) {
			$dom.filterNodes(node, "data-event").forEach(applyBinding, {scope:scope, base:base});
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

juse.import("juse/text").define("juse/valid.context", function($text, $context){

	juse.define("validator", function(){
		juse.export(function validator(value){
			$context.cacheValue("validators", this.spec.name, value);
		});
	});

	juse.define("validate", function(){
		juse.export(function validate(spec, value, ref){
			var messages;
			for (spec = juse.spec(spec); spec; spec = juse.spec(spec.value)) {
				var name = spec.kind || spec.name;
				var validator = $context.cacheValue("validators", name);
				var message = juse.typeOf(validator, "function") && validator.call(this, spec, value, ref);
				messages = addMessage(messages, message);
			}
			return messages;
		});

		function addMessage(messages, message) {
			if (message) {
				messages = messages || [];
				messages.push(message);
			}
			return messages;
		}
	});

	juse.import("replace").define("required|validator", function($replace){
		juse.export(function required(spec, value, ref) {
			return value ? "" : $replace(juse.property("#required.message", this) || "required: ${0}", juse.specs(ref));
		});
	});

});

juse.import("juse/remote", "juse/core", "juse/ui", "juse/valid", "juse/text").define("juse/model.context", function(){
	var $modelKeys = ["kind","name"], $context = this;

	juse.define("binder", function(){
		juse.export(function binder(){
			$context.cacheValue("binders", this.spec.name, this.spec);
		});
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

	juse.import("dom", "tile", "validate", "onload").define("model", function($dom, $tile, $validate, $onload){
		$onload.follow({load:load});
		juse.export(function model(node) {
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
			$dom.filterNodes(node, "data-model").forEach(makeModel, this);
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
			$dom.selectNodes(node).forEach(makeTextTiles, args);
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

	juse.import("dom", "widget", "model", "teval").define("input|binder", function($dom, $widget, $model, $teval){
		juse.export(
			function input(tile){
				tile.valid = juse.spec($dom.data(tile.node, "data-valid", null));
				tile.event = juse.spec($dom.data(tile.node, "data-service", null));
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

	juse.import("dom", "widget", "model").define("link|binder", function($dom, $widget, $model){
		juse.export(
			function link(tile){
				tile.link = $model.getModel(tile.spec.name, true);
				tile.event = juse.spec($dom.data(tile.node, "data-service", null));
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

	juse.import("dom", "model").define("list|binder", function($dom, $model){
		juse.export(
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

	juse.import("dom", "model").define("map|binder", function($dom, $model){
		juse.export(
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

	juse.import("dom", "widget", "model", "request").define("remote|binder", function($dom, $widget, $model, $request){
		juse.export(
			function remote(tile){
				tile.event = juse.spec($dom.data(tile.node, "data-service", null));
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

	juse.import("model", "teval").define("text|binder", function($model, $teval){
		var $replaceFormat = /%\{([^\}]*)\}/g;

		juse.export(
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

	juse.import("dom", "teval").define("value|binder", function($dom, $teval){
		juse.export(
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
