juse(".context", ["juse/remote", "juse/service", "juse/ui", "juse/valid", "juse/text"], function model(){
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

	this.juse(".classifier", ["dom", "tile", "provider", "validate"], function model($dom, $tile, $provider, $validate){
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
		renderChild, renderModel, fireInput, notifyInput, addTile, getModel, getModelValue, notifyModel, resolveEvent, rejectEvent);

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

		function fireInput(input, value) {
			var success = validateModel(input, value);
			if (success && input.event && (input.event.name||input.event.member)) {
				fireEvent(input, value);
			} else {
				notifyInput(input, value);
			}
		}

		function fireEvent(input, value) {
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

	this.juse(["input", "link", "list", "map", "remote", "text", "value"]);

});
