juse.import("lib/jquery", "lib/canvas", "util", "base@").define(function(jquery, canvas, util, base){
	juse.log("callback:", this.spec.name, "<-", jquery, canvas, util, base);
	return this.spec.name;
});
