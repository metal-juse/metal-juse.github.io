juse(".binder", ["dom", "widget", "model", "teval"], function input($dom, $widget, $model, $teval){
	return juse.seal(
		function input(tile){
			tile.valid = juse.toRef($dom.data(tile.node, "data-valid", null));
			tile.event = juse.toRef($dom.data(tile.node, "data-event", null));
			$widget.bindEvent(tile.scope, tile.node, {kind:juse.memberValue(tile.event, "kind")||inputEvent(tile)}, fireInput, tile);
		}
		,render,clear
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
