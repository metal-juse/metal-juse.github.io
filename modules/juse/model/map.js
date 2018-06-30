juse(".binder", ["dom", "model"], function map($dom, $model){
	return juse.seal(
		function map(tile){
			tile.content = $dom.moveContent(tile.node);
			tile.models = [];
		}
		,updateModel,renderTile
	);

	function updateModel(model, value, input) {
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

	function renderTile(tile, value, input) {
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
		$dom.toggleStyle(tile.node, "hidden", tile.node.hidden);
	}
});
