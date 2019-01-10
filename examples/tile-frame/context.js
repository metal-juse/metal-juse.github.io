juse(".context", ["juse/ui"], function(){
	this.juse("main.html|tile", ["app/frame", "app/frame.html|widget", "app/frame.css"]);
	return {
		map: {
			"*.html": "static:",
			"*.css": "static:"
		}
	};
});
