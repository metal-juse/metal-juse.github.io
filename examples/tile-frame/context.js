juse.import("juse/ui", "juse/resource").define(".context", function(){
	juse.import("app/frame", "app/frame.html", "app/frame.css").define("main.html|tile|widget");
	return {
		map: {
			"*.html": "static:",
			"*.css": "static:"
		}
	};
});
