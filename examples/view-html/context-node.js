global.document = require("jsdom").jsdom("<!doctype html><html><body></body></html>");
juse(".context", ["juse/resource"], {
	map: {
		"world.html": "html:app/world.html"
	}
});
