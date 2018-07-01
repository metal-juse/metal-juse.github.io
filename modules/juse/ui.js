juse(".context", ["juse/resource", "juse/text"], function ui(){
	var $view, $array = [];

	this.juse(["widget", "tile"]);

	this.juse(".classifier", function view($scope){
		/** @follow juse/app/load **/
		$view = $view || juse.global.document.body.querySelector("[data-view]") || juse.global.document.body;
		return juse.seal(
			function view(){
				$scope.context.cacheValue("views", this.spec.name, this.spec);
			},
			function follow(event, ref) {
				var value = juse.lookup(ref);
				if (juse.typeOf(value, "html", true)) {
					$view.setAttribute("data-view", juse.toSpec(ref));
					if ($view.lastElementChild) {
						$view.replaceChild(value, $view.lastElementChild);
					} else {
						$view.appendChild(value);
					}
					return true;
				}
			}
		);
	});

	this.juse(".classifier", ["html"], function dom($html){
		var $dom;
		return $dom = juse.seal(function dom(value, clone){
			return juse.typeOf(value, "string") ? $html.call(this, value) : clone ? value.cloneNode(true) : value;
		}, {
			TEXT_NODE: juse.global.document.TEXT_NODE,
			ELEMENT_NODE: juse.global.document.ELEMENT_NODE,
			ATTRIBUTE_NODE: juse.global.document.ATTRIBUTE_NODE },
			moveContent,
			replaceContent,
			removeContent,
			childNodes,
			forNodes,
			closest,
			filterNodes,
			data,
			textNode,
			forTextNodes,
			toggleStyle
		);

		function moveContent(a, b) {
			b = b || juse.global.document.createDocumentFragment();
			b = typeof(b) == "string" ? juse.global.document.createElement(b) : b;
			if (juse.typeOf(a, "array")) a.forEach(moveChild, b);
			else while (a.firstChild) moveChild.call(b, a.firstChild);
			return b;
		}

		function moveChild(child) {
			if (this.parentNode) this.parentNode.insertBefore(child, this);
			else this.insertBefore(child, null);
		}

		function replaceContent(a, b) {
			if (a && a.parentNode && b) {
				moveContent(b, a);
				a.parentNode.removeChild(a);
			}
		}

		function removeContent(node) {
			if (juse.typeOf(node, "array")) node.forEach(removeChild);
			else while (node.firstChild) removeChild(node.firstChild);
		}

		function removeChild(child) {
			if (child.parentNode) child.parentNode.removeChild(child);
		}

		function childNodes(node, name) {
			return name ? node ? visitNodes(node.childNodes, {name:name,nodes:{}}).nodes : {}
				: $array.slice.call(node.childNodes);
		}

		function forNodes(node, name, callback, args) {
			args = {name:name, nodes:[node.childNodes], callback:callback, scope:args};
			for (var i = 0; i < args.nodes.length; i++) {
				visitNodes(args.nodes[i], args);
			}
		}

		function visitNodes(nodes, args) {
			return $array.reduce.call(nodes, visitNode, args);
		}

		function visitNode(args, node) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				if (args.callback) {
					if (!args.name || node.hasAttribute(args.name)) args.callback.call(args.scope, node);
					args.nodes.push(node.childNodes);
				} else if (node.hasAttribute(args.name)) {
					args.nodes[node.getAttribute(args.name)] = node;
				}
			}
			return args;
		}

		function closest(node, selectors) {
			var args = { selectors:selectors };
			for (var parent = node.parentNode; parent; parent = parent.parentNode) {
				node = $array.some.call(parent.childNodes, matches, args) && args.node;
				if (node) return node;
			}
		}

		function matches(node) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				var matched = node.matches ? node.matches(this.selectors) : node.parentNode.querySelector(this.selectors) == node;
				return this.node = matched && node;
			}
		}

		function data(node, name, value) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				var data = node.getAttribute(name);
				if (value === null) {
					node.removeAttribute(name);
				} else if (value !== undefined) {
					node.setAttribute(name, value);
				}
				return data;
			}
		}

		function filterNodes(node, selector) {
			selector = selector || node.nodeType != $dom.ELEMENT_NODE && "*";
			var nodes = selector ? node.querySelectorAll(selector) : node.getElementsByTagName("*");
			return $array.slice.call(nodes);
		}

		function textNode(node) { return node.nodeType == $dom.ATTRIBUTE_NODE || node.nodeType == $dom.TEXT_NODE; }

		function forTextNodes(nodes, callback, scope) {
			nodes && $array.filter.call(nodes, textNode).forEach(callback, scope);
		}

		function toggleStyle(node, name, toggle) {
			var names = node.className ? node.className.split(" ") : [];
			var index = names.indexOf(name);
			if (toggle && index < 0) {
				names.push(name);
			} else if (!toggle && index >= 0) {
				names.splice(index, 1);
			}
			name = names.join(" ");
			if (node.className != name) {
				node.className = name;
			}
		}

	});

	this.juse(["dom", "replace@juse/text"], function replace($dom, $replace){
		return function replace(node, dataset) {
			var args = {scope:this, dataset:dataset};
			$dom.filterNodes(node).forEach(replaceTexts, args);
			replaceTexts.call(args, node);
			return node;
		};

		function replaceTexts(node) {
			if (node.nodeType == $dom.ELEMENT_NODE) {
				$array.forEach.call(node.attributes, replaceText, this);
				$array.forEach.call(node.childNodes, replaceText, this);
			}
		}

		function replaceText(node) {
			if (node.nodeType == $dom.ATTRIBUTE_NODE || node.nodeType == $dom.TEXT_NODE) {
				node.nodeValue = $replace.call(this.scope, node.nodeValue, this.dataset);
			}
		}
	});
});
