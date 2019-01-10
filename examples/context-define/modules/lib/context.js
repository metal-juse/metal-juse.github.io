juse(".context", function(){
	this.juse("canvas", ["jquery"], function(jquery){
		juse.log("callback:", this.spec.name, "<-", jquery);
		return this.spec.name;
	});
	this.juse("jquery", function(){
		juse.log("callback:", this.spec.name);
		return this.spec.name;
	});
});
