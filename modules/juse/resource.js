juse(".context", function resource(){

	this.juse(".classifier", function properties(){
		return function properties(value){
			this.context.cacheValue("properties", this.spec.name, value);
		};
	});

	this.juse(".classifier", function json(){
		return function json(value){
			return JSON.parse(value);
		};
	});

	this.juse(".classifier", function html(){
		return function html(value, name){
			var div = juse.global.document.createElement(name||"div");
			div.innerHTML = value;
			return div;
		};
	});
});
