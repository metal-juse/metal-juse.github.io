juse.define(function(){
	function toggle(event){
		event.target.innerHTML = (event.target.innerHTML == "hello") ? "world" : "hello";
	}
	return { over: toggle, out: toggle };
});
