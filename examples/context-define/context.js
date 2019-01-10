juse(".context", ["app/context", "lib/context"], function(){

	this.juse("base", ["jquery", "canvas", "util"], function(jquery, canvas, util){
		juse.log("callback:", this.spec.name, "<-", jquery, canvas, util);
		return this.spec.name;
	});
	this.juse("main", ["jquery", "canvas", "util", "sub", "base"], function(jquery, canvas, util, sub, base){
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
