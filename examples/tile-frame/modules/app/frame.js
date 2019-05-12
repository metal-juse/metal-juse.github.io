juse.import("dom").define(function($dom){

	var box = ["head","top","topLeft","topRight","bottom","bottomLeft","bottomRight","left","leftTop","leftBottom","right","rightTop","rightBottom"];
	var top = ["top","topLeft","topRight","leftTop","rightTop"];
	var bottom = ["bottom","bottomLeft","bottomRight","leftBottom","rightBottom"];
	var left = ["left","leftTop","leftBottom","topLeft","bottomLeft"];
	var right = ["right","rightTop","rightBottom","topRight","bottomRight"];
	var frame, target, nodes = {}, dataset = {};

	return function frame(node){
		return $dom.bindNodes(node, "[data-frame]", bind);
	};

	function bind(node) {
		if (some(node, "data-frame", box)) {
			juse.follow(node, {"mousedown":dispatch});
		}
	}

	function dispatch(event) {
		var name = valueOf(target||event.target, "data-frame");
		switch (event.type) {
		case "mousedown":
			trap(event);
			name == "head" ? startMove(event) : startResize(event);
			break;
		case "mousemove":
			name == "head" ? doMove(event) : doResize(event);
			break;
		case "mouseup":
			release(event);
			break;
		}
	}

	function trap(event) {
		target = event.target;
		frame = $dom.closest(target, "[class~=frame]");
		nodes = reduce(frame, "data-frame", nodes);
		juse.follow(juse.global.document, {"mousemove":dispatch, "mouseup":dispatch});
	}

	function release(event) {
		target = null;
		juse.global.document.removeEventListener("mousemove", dispatch);
		juse.global.document.removeEventListener("mouseup", dispatch);
	}

	function valueOf(node, name, value) {
		if (node && node.nodeType == 1 && node.hasAttribute(name)) {
			return node.getAttribute(name);
		}
		return value;
	}

	function some(node, name, values) {
		var value = valueOf(node, name);
		return values.indexOf(value) >= 0 && value;
	}

	function reduce(node, name, nodes) {
		[].reduce.call(node.childNodes, filter.bind(nodes), name);
		return nodes;
	}

	function filter(name, node) {
		var value = valueOf(node, name);
		if (value) this[value] = node;
		return name;
	}

	function startMove(event) {
		dataset.x = event.clientX;
		dataset.y = event.clientY;
		dataset.top = parseInt(frame.style.top) || frame.offsetTop;
		dataset.left = parseInt(frame.style.left) || frame.offsetLeft;
	}

	function doMove(event) {
		var dx = event.clientX - dataset.x;
		var dy = event.clientY - dataset.y;
		frame.style.top = "".concat(dataset.top + dy, "px");
		frame.style.left = "".concat(dataset.left + dx, "px");
	}

	function startResize(event) {
		dataset.x = event.clientX;
		dataset.y = event.clientY;
		dataset.top = parseInt(frame.style.top) || frame.offsetTop;
		dataset.left = parseInt(frame.style.left) || frame.offsetLeft;
		dataset.width = parseInt(frame.style.width) || frame.offsetWidth;
		dataset.height = parseInt(frame.style.height) || frame.offsetHeight;
		dataset.bodyHeight = nodes.body.offsetHeight;
		dataset.minWidth = 100;
		dataset.minHeight = 50;
	}

	function doResize(event) {
		var dx = event.clientX - dataset.x;
		var dy = event.clientY - dataset.y;
		if (some(target, "data-frame", top)) {
			setHeight(-dy, true);
		} else if (some(target, "data-frame", bottom)) {
			setHeight(dy);
		}
		if (some(target, "data-frame", left)) {
			setWidth(-dx, true);
		} else if (some(target, "data-frame", right)) {
			setWidth(dx);
		}
	}

	function setWidth(dx, isLeft) {
		if (dataset.width + dx <= dataset.minWidth) return;
		frame.style.width = "".concat(dataset.width + dx, "px");
		if (isLeft) frame.style.left = "".concat(dataset.left - dx, "px");
	}

	function setHeight(dy, isTop) {
		if (dataset.height + dy <= dataset.minHeight) return;
		frame.style.height = "".concat(dataset.height + dy, "px");
		if (isTop) frame.style.top = "".concat(dataset.top - dy, "px");
		nodes.body.style.height = "".concat(dataset.bodyHeight + dy, "px");
	}

});
