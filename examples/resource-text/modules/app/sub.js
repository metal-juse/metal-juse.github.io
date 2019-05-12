juse.import("hello.txt", "world.txt").define(function(hello, world){
	juse.log("callback:", this.spec.name, "<-", hello, world);
	return this.spec.name;
});
