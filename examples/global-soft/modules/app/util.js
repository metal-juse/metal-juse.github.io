juse([":lib/jquery#jQuery", ":lib/canvas"], function(jquery, canvas){
	juse.log("callback:", this.spec.name, "<-", jquery, canvas);
	return this.spec.name;
});
