juse(".binder", ["dom", "eval"], function value($dom, $eval){
	return juse.seal(
		function value(tile){
			tile.length = tile.node.innerHTML.length;
		}
		,updateModel,renderTile
	);

	function updateModel(model, value, input) {
		if (input && input.spec.member) {
			model.value = model.value || {};
			model.value[input.spec.member] = value;
		} else {
			model.value = value;
		}
	}

	function renderTile(tile, value, input) {
		var value = $eval.call(tile.scope, tile.spec, tile.model.value);
		if (tile.length) {
			tile.node.hidden = (value == "hidden");
		} else {
			tile.node.hidden = !value;
			tile.node.innerHTML = value||"";
		}
		$dom.toggleStyle(tile.node, "hidden", tile.node.hidden);
	}
});
