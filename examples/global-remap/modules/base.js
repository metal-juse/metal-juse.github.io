juse.import("jquery", "canvas", "app/util").define(function(jquery, canvas, util){
	juse.log("callback:", this.spec.name, "<-", jquery, canvas, util);
	return this.spec.name;
});
