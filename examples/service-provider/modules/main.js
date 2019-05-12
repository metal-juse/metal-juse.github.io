juse.import("test-service").define(function($test){
	$test.follow(test1, test2);
	return function main(){
		juse.log("----submit #test1 hello");
		$test.submit("#test1", "hello").then(function(value) {
			juse.log("----then", value);
			$test.fire("test1", value);
		});

		juse.log("----submit #test2 hello");
		$test.submit("#test2", "hello").then(null, function(error) {
			juse.log("----catch", error);
			$test.fire("test2", null, error);
		});
	};

	function test1(value, error) {
		juse.log("----test1 resolved", value);
	}

	function test2(value, error) {
		juse.log("----test2 rejected", error);
	}
});
