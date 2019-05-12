juse.import("test-service").define(function($test){
	$test.provide(test1, test2);
	function test1(resolve, reject) {
		juse.log('----test1 resolve', this.value);
		resolve(this.value);
	}
	function test2(resolve, reject) {
		juse.log('----test2 reject', this.value);
		reject(this.value);
	}
});
