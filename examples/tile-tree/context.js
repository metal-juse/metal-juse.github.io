juse(".context", ["juse/ui", "juse/resource"], function(){
	this.juse("main.html|app/tree|widget", ["app/tree.html", "app/tree.css"]);
	return {
		map: {
			"*.html": "static:",
			"*.css": "static:"
		}
	};
});
