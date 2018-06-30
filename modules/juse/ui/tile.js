juse(".classifier", ["dom", "replace", "map"], function tile($dom, $replace, $map){

	return function tile(node, dataset){
		node = $dom.call(this, node);
		makeTile(node, dataset, this);
		return node;
	};

	function makeTile(node, dataset, scope, outertag) {
		$replace.call(scope, node, dataset);
		replaceTags.call(scope, node, dataset, outertag);
	}

	function replaceTags(tile, dataset, outertag) {
		var tiles = $dom.childNodes(outertag, "data-tile");
		var scope = {scope:this, dataset:dataset, outertag:outertag, tiles:tiles};
		$dom.filterNodes(tile, "[data-tag]").forEach(replaceTag, scope);
	}

	function replaceTag(tag) {
		var spec = tag.getAttribute("data-tag");
		var ref = spec && juse.toRef(spec);
		var tile = ref && juse.filter(juse.toRef(ref, ".html"), this.scope);
		if (!ref && this.outertag) {
			tile = this.outertag;
		} else if (this.tiles[ref.name]) {
			tile = this.tiles[ref.name];
		} else if (tile) {
			makeTile(tile, this.dataset||$map(ref.value), this.scope, tag);
		}
		$dom.replaceContent(tag, tile);
	}

});
