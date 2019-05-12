juse.import("request").define("|service", function($request, $scope){
	$scope.provide(addPerson, loadPersons);

	function addPerson(resolve, reject) {
		resolve(this.value);
	}
	function loadPersons(resolve, reject){
		$request.call($scope, "persons.json").then(resolve, reject);
	}
});
