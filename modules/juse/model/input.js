juse(".binder", ["dom", "widget", "model", "eval"], function input($dom, $widget, $model, $eval){
	return juse.seal(
		function input(tile){
			tile.valid = juse.toRef($dom.data(tile.node, "data-valid", null));
			tile.event = juse.toRef($dom.data(tile.node, "data-event", null));
			$widget.bindEvent(tile.scope, tile.node, {kind:juse.memberValue(tile.event, "kind")||inputEvent(tile)}, fireInput, tile);
		}
		,renderTile,clear
	);

	function fireInput(tile) {
		$model.fireInput(tile, valueOf(tile));
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

	function renderTile(tile, value, input) {
		value = (tile==input) ? value : $eval.call(tile.scope, tile.spec, tile.model.value);
		switch (tile.node.type) {
		case "button": break;
		case "reset": break;
		case "checkbox": tile.node.checked = !!value; break;
		default: tile.node.value = value||""; break;
		}
	}

	function clear(tile, value) {
		renderTile(tile, null, tile);
		$model.notifyInput(tile, value);
	}
});
