juse.import("lib/jquery#jQuery", "lib/canvas", "app/util").define(function(jquery, canvas, util){
	juse.log("callback:", this.spec.name, "<-", jquery, canvas, util);
	return this.spec.name;
});
