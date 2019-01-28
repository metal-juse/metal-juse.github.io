juse(["tile"], function($tile){
	return juse.seal(function tree(node, dataset){
		return $tile.call(this, node, dataset, "tree");
	}, {bindWidget:bindWidget});

	function bindWidget(node) {
		[].forEach.call(node.querySelectorAll(".tree"), bind);
	}

	function bind(node) {
		switch (node.id) {
		case "toggle":
			juse.follow(node, {"click":toggle});
			break;
		case "label":
			juse.follow(node, {"dblclick":toggle});
			break;
		}
	}

	function toggle(event) {
		var node = event.target;
		switch (node.id) {
		case "toggle":
			toggleClass(node, "open");
			toggleClass(node.nextElementSibling, "open");
			toggleClass(node.nextElementSibling.nextElementSibling, "open");
			break;
		case "label":
			toggleClass(node, "open");
			toggleClass(node.nextElementSibling, "open");
			toggleClass(node.previousElementSibling, "open");
			break;
		}
	}

	function toggleClass(node, name) {
		var list = node.className.split(" ");
		var i = list.indexOf(name);
		if (i < 0) node.className = node.className + " " + name;
		else {
			list.splice(i,1);
			node.className = list.join(" ");
		}
	}

});
