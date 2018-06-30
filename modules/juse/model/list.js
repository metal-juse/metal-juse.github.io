juse(".binder", ["dom", "model"], function list($dom, $model){
	return juse.seal(
		function list(tile){
			tile.content = $dom.moveContent(tile.node);
			tile.models = [];
		}
		,updateModel,renderTile
	);

	function updateModel(model, value, input) {
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
			model.value = value;
		}
	}

	function renderTile(tile, value, input) {
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
			if (value) {
				for (index = 0; index < value.length; index++) {
					tile.models.push($model.renderChild(tile, value[index]));
				}
			}
		}
		tile.node.hidden = !tile.models.length;
		$dom.toggleStyle(tile.node, "hidden", tile.node.hidden);
	}
});
