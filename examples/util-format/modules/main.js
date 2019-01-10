juse(["hello.txt"], function(hello){
	juse.log("callback:", this.spec.name, "<-", hello);
	return this.spec.name;
});
