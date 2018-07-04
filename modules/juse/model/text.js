juse(".binder", ["model", "teval"], function text($model, $teval){
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
