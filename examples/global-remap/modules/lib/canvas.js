juse.import("jquery").define(function(jquery){
	juse.log("callback:", this.spec.name, "<-", jquery);
	return this.spec.name;
});
