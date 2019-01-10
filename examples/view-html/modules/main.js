juse(["app/sub"], function(sub){
	juse.log("callback:", this.spec.name, "<-", sub);
	return this.spec.name;
});
