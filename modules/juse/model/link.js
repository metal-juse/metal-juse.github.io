juse(".binder", ["dom", "widget", "model"], function link($dom, $widget, $model){
	return juse.seal(
		function link(tile){
			tile.link = $model.getModel(tile.spec.name, true);
			tile.event = juse.toRef($dom.data(tile.node, "data-event", null));
			$widget.bindEvent(tile.scope, tile.node, {kind:juse.memberValue(tile.event, "kind")}, fireInput, tile);
		}
		,notify,renderTile
	);

	function fireInput(input) {
		$model.fireInput(setIndex(input), valueOf(input));
	}

	function valueOf(input) {
		return (input.link.linkTile == input) ? null : input.model.value;
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
				renderTile(input, value, input);
				resetLink(input.link, input, value);
			}
		}
	}

	function renderTile(tile, value, input) {
		if (tile.model.spec && input) {
			tile.node.disabled = !!value;
		} else if (input) {
			if (tile.link.linkTile && tile.link.linkTile != tile) {
				$dom.toggleStyle(tile.link.linkTile.node, "selected");
			}
			$dom.toggleStyle(tile.node, "selected", !!value);
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
