angular.module('tiForms').controller('testCtrl', ['$scope',
	function($scope) {
		$scope.testForm = {
			"name": "Test Inputs",
			"elements": [{
				"type": "input",
				"name": "text",
				"label": "Test Text"
			}, {
				"type": "input",
				"name": "test",
				"label": "Test Text"
			}]
		};
	}
]);