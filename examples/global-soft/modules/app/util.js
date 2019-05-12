juse.import(":lib/jquery#jQuery", ":lib/canvas").define(function(jquery, canvas){
	juse.log("callback:", this.spec.name, "<-", jquery, canvas);
	return this.spec.name;
});
