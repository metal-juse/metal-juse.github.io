juse(["jquery"], function(jquery){
	juse.log("callback:", this.spec.name, "<-", jquery);
	return this.spec.name;
});
