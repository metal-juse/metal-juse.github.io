juse.import("app/context", "lib/context").define(".context", function(){

	juse.import("jquery", "canvas", "util").define("base", function(jquery, canvas, util){
		juse.log("callback:", this.spec.name, "<-", jquery, canvas, util);
		return this.spec.name;
	});
	juse.import("jquery", "canvas", "util", "sub", "base").define("main", function(jquery, canvas, util, sub, base){
		juse.log("callback:", this.spec.name, "<-", jquery, canvas, util, sub, base);
		return this.spec.name;
	});

	return {
		map: {
			sub: "sub@app/context",
			util: "util@app/context",
			jquery: "jquery@lib/context",
			canvas: "canvas@lib/context"
		}
	};
});
