juse(".classifier", ["dom"], function widget($dom){

	var $eventKeys = ["click","dblclick","mousedown","mouseenter","mouseleave","mousemove","mouseover","mouseout","mouseup","input","change","enter"];

	return juse.seal(function widget(node, scope) {
		node = $dom.call(this, node);
		bindWidgets(node, scope||this);
		return node;
	}, bindEvent);

	function bindWidgets(node, scope) {
		$dom.filterNodes(node, "[data-widget]").forEach(bindWidget, scope);
		applyBindings(scope, node);
	}

	function bindWidget(node) {
		var spec = juse.toRef($dom.data(node, "data-widget", null));
		var widget = juse.lookup(spec, this);
		if (typeof(widget) == "function") {
			widget.call(this, node);
		}
		applyBindings(this, node, spec);
	}

	function applyBindings(scope, node, base) {
		$dom.filterNodes(node, "[data-event]").forEach(applyEventBinding, {scope:scope, base:base});
	}

	function applyEventBinding(node) {
		var spec = $dom.data(node, "data-event", null);
		while (spec) {
			var ref = juse.toRef(spec, this.base);
			if (!bindEvent(this.scope, node, ref)) {
				$dom.data(node, "data-event", spec);
				break;
			}
			spec = ref.value;
		}
	}

	function bindEvent(scope, node, spec, action, target) {
		var event = juse.toRef(spec);
		if (event) {
			var kind = event.kind || $eventKeys[0];
			var i = $eventKeys.indexOf(kind);
			if (i >= 0) {
				action = action || juse.lookup(event, scope);
				if (juse.typeOf(action, "function")) {
					var args = {action:action, target:target, event:event};
					if (kind == "enter") kind = "keyup";
					node.addEventListener(kind, fire.bind(args));
					return true;
				}
			}
		}
	}

	function fire(event) {
		if (this.event.kind == "enter" && event.keyCode != 13) return;
		if (this.target) this.action.call(null, this.target, event);
		else this.action.call(null, event);
	}
});
