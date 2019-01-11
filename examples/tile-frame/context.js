juse(".context", ["juse/ui", "juse/resource"], function(){
	this.juse("main.html|tile|widget", ["app/frame", "app/frame.html", "app/frame.css"]);
	return {
		map: {
			"*.html": "static:",
			"*.css": "static:"
		}
	};
});
