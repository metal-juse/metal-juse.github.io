juse(["jquery", "canvas", "util"], function(jquery, canvas, util){
	juse.log("callback:", this.spec.name, "<-", jquery, canvas, util);
	return this.spec.name;
});
