juse(".context", ["juse/ui", "juse/resource"], function(){
	this.juse("main.html|tile|widget", ["app/tree", "app/tree.html", "app/tree.css"]);
	return {
		map: {
			"*.html": "static:",
			"*.css": "static:"
		}
	};
});
