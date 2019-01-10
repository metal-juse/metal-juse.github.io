juse(["hello.html", "world.html"], function(hello, world){
	juse.log("callback:", this.spec.name, "<-", hello, world);
	juse.global.document.body.appendChild(hello);
	juse.global.document.body.appendChild(world);
	return this.spec.name;
});
