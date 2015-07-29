angular.module('tiForms').controller('testCtrl', ['$scope',
	function($scope) {
		$scope.testForm = {
			name: "Test Form",
			elements: [
				{
					type: 'title',
					size: 1,
					text: 'Test large title',
					separator: true
				},
				{
					type: 'text',
					placeholder: 'test placeholder',
					label: 'test label',
					name: "input1"
				}
			]
		};
	}
]);