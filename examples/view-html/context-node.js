global.document = require("jsdom").jsdom("<!doctype html><html><body></body></html>");
juse.import("juse/resource").define(".context", {
	map: {
		"world.html": "html:app/world.html"
	}
});
