juse(function(){
	return function(value, invalid){
		if (confirm(value)) return value;
		throw Error(value);
	}
});