juse(["jquery", "canvas", "util", "sub", "base"], function(jquery, canvas, util, sub, base){
	juse.log("callback:", this.spec.name, "<-", jquery, canvas, util, sub, base);
	return this.spec.name;
});
