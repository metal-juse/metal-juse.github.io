juse(".binder", ["dom", "widget", "model", "request"], function remote($dom, $widget, $model, $request){
	return juse.seal(
		function remote(tile){
			tile.event = juse.toRef($dom.data(tile.node, "data-event", null));
			$widget.bindEvent(tile.scope, tile.node, {kind:juse.memberValue(tile.event, "kind")}, fireInput, tile);
			load(tile);
		}
		,notify,load
	);

	function fireInput(input) {
		$model.fireInput(input, valueOf(input));
	}

	function valueOf(input) {
		return input.model.value;
	}

	function notify(input, value) {
		$model.notifyModel($model.getModel(input.spec), value, input);
	}

	function load(input){
		var args = {input:input};
		$request.call(input.scope, juse.toRef(".json", input.spec, true)).then($model.resolveEvent.bind(args), $model.rejectEvent.bind(args));
	}
});
