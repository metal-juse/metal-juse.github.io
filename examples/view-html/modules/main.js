juse.import("app/sub").define(function(sub){
	juse.log("callback:", this.spec.name, "<-", sub);
	return this.spec.name;
});
