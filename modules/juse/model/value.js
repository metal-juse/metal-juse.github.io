juse(".binder", ["dom", "teval"], function value($dom, $teval){
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
