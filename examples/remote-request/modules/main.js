juse.import("request").define(function($request){
	$request("service.json", {data:{q:"test"}}).then(function(value){
		return $request("service.json", {data:value});
	}).then(function(value){
		return $request("service.json", {data:value});
	}).then(function(value){
		return $request("service.json", {data:value});
	}).then(function(value){
		juse.log("value:", value);
	}, function(reason){
		juse.log("reason:", reason);
	});
});
