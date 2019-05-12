juse.import("juse/ui", "juse/resource").define(".context", function(){
	juse.import("app/tree").define("main.html|app/tree");
	return {
		map: {
			"*.html": "static:",
			"*.css": "static:"
		}
	};
});
