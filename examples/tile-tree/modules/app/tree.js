juse.
import("tree.css").
import("tile", "dom").
define(function tree($tile, $dom, $scope){
/*!@tree
<div class="tree">
	<span class="control toggle"></span>
	<span class="control header">${label}</span>
	<div class="content">
		<div data-tag></div>
	</div>
</div>
*/
	juse.export(function tree(node){
		$tile.call(this, node, $scope.properties);
		return $dom.bindNodes(node, ".tree > .control", bind);
	});

	function bind(node) {
		if ($dom.hasClass(node, "toggle")) {
			juse.follow(node, {"click":toggle});
		} else if ($dom.hasClass(node, "header")) {
			juse.follow(node, {"dblclick":toggle});
		}
	}

	function toggle(event) {
		$dom.toggleClass(event.target.parentNode, "open");
	}

});
