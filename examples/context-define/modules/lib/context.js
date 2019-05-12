juse.define(".context", function(){
	juse.import("jquery").define("canvas", function(jquery){
		juse.log("callback:", this.spec.name, "<-", jquery);
		return this.spec.name;
	});
	juse.define("jquery", function(){
		juse.log("callback:", this.spec.name);
		return this.spec.name;
	});
});
