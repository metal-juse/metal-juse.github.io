juse(".context", function(){
	this.juse("sub", ["jquery", "canvas", "util", "base@context"], function(jquery, canvas, util, base){
		juse.log("callback:", this.spec.name, "<-", jquery, canvas, util, base);
		return this.spec.name;
	});
	this.juse("util", ["jquery", "canvas"], function(jquery, canvas){
		juse.log("callback:", this.spec.name, "<-", jquery, canvas);
		return this.spec.name;
	});
});
