juse(["hello.txt", "world.txt"], function(hello, world){
	juse.log("callback:", this.spec.name, "<-", hello, world);
	return this.spec.name;
});
