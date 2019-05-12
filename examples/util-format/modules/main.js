juse.import("hello.txt").define(function(hello){
	juse.log("callback:", this.spec.name, "<-", hello);
	return this.spec.name;
});
