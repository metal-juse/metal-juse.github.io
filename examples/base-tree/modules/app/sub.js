juse([":lib/jquery", ":lib/canvas", "util", ":base"], function(jquery, canvas, util, base){
	juse.log("callback:", this.spec.name, "<-", jquery, canvas, util, base);
	return this.spec.name;
});
