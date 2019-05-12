juse.define(".context", function(){
	juse.import("jquery", "canvas", "util", "base@context").define("sub", function(jquery, canvas, util, base){
		juse.log("callback:", this.spec.name, "<-", jquery, canvas, util, base);
		return this.spec.name;
	});
	juse.import("jquery", "canvas").define("util", function(jquery, canvas){
		juse.log("callback:", this.spec.name, "<-", jquery, canvas);
		return this.spec.name;
	});
});
