angular.module('tiForms').controller('testCtrl', ['$scope',
	function($scope) {
		$scope.testForm = {
			"name": "Test Inputs",
			"elements": [{
				"type": "text",
				"name": "text",
				"label": "Test Text"
			}, {
				"type": "email",
				"name": "email",
				"label": "Test email"
			}, {
				"type": "password",
				"name": "password",
				"label": "Test password"
			}, {
				"type": "number",
				"name": "number",
				"label": "Test Number"
			}, {
				"type": "submit",
				"text": "Test Submit"
			}]
		};
	}
]);