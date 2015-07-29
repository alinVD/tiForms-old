'use strict';

angular.module('tiForms', []);
'use strict';

angular.module('tiForms').directive('tiFormRender', [function () {

	return function (scope, $element, attrs) {

		/**
   * Base renderer function that defers the rendering to one of the built in renderers, and in the future will also be able to defer to custom element and framework renderers
   * @param  jQuery element  Container element.
   * @param  plainObject eOptions Options for the rendering element. Needs to have its type field be one of the currently defined types. In the future, custom types will be supported.
   * @param  plainObject fOptions Options for the form.
   * @return Null          No return
   */
		function render(element, eOptions, fOptions) {

			var renderFunction;

			if (eOptions === fOptions) {
				renderFunction = render.root;
			} else if (eOptions.type) {
				renderFunction = render[eOptions.type];
				if (!renderFunction) {
					console.error('Render Error: Element type \'' + eOptions.type + '\' has no defined renderer');
					return;
				}
			} else {
				console.error("Render Error: Element type is undefined (and element isn't root)");
				return;
			}

			render.defaults(renderFunction, eOptions, fOptions);
			renderFunction(element, eOptions, fOptions);
		}

		render.defaults = function (renderer, eOptions, fOptions) {

			function defaults(field, value) {
				if (!eOptions[field]) if (value === 'required') {
					console.error('Render Error: Required field ' + field + ' not defined');
					return;
				} else eOptions[field] = value;else if (eOptions[field] instanceof Array && value instanceof Array) {
					_.forEach(value, function (val) {
						if (!_.find(eOptions[field], val)) {
							eOptions[field].push(val);
						}
					});
				}
			}

			_.forEach(renderer.defaults, function (value, field) {
				defaults(field, value);
			});
		};

		/**
   * Basic wrapper function to call render over an array. Any renderer calling this is a container, and every container should call this.
   * @param  jQuery element  Container element.
   * @param  Array[plainObject] children Array of elements to render.
   * @param  plainObject fOptions Options for the form
   * @return Null          No return
   */
		render.children = function (element, children, fOptions) {
			_.forEach(children, function (eOptions) {
				render(element, eOptions, fOptions);
			});
		};

		render.input = function (element, name, fOptions) {
			if (fOptions.inputs[name]) {
				console.error("Render Error: Conflicting input names");
				return;
			}
			fOptions.inputs[name] = element;
		};

		/**
   * Renders the root form element. This should be the only renderer that calls render.chilren on the same element that it itself was called with (the element the directive is on)
   * @param  jQuery element  The root element of the form. The default root render function should only be called with the element the directive is on.
   * @param  plainObject eOptions Options for the root element. Will be the same as fOptions for this function; included for consistency.
   * @param  plainObject fOptions Options for the form.
   * @return Null          No return
   */
		render.root = function (element, eOptions, fOptions) {
			render.children(element, fOptions.elements, fOptions);
		};

		render.root.defaults = {
			name: 'required',
			elements: [{
				type: 'submit'
			}],
			inputs: {},
			submit: function submit(scope, element, fOptions) {
				//fOptions argument shouldn't be needed (the this keyword should be substituted in the fucntion body, but the transpiler doesn't work with it)
				scope[fOptions.name] = _.reduce(fOptions.inputs, function (output, inputElement, inputName) {
					output[inputName] = inputElement.val();
					return output;
				}, {});
			}
		};

		render.text = function (element, eOptions, fOptions) {
			var $container = $('<div class="form-group">'),
			    $input = $('<input type="text" id="' + fOptions.name + '.' + eOptions.value + '" />').addClass('form-control'),
			    $label = eOptions.label ? $('<label for="' + fOptions.name + '.' + eOptions.name + '">' + eOptions.label + '</label>') : null;

			$input.attr('placeholder', eOptions.placeholder);

			$container.appendTo(element).append($label).append($input);

			render.input($input, eOptions.name, fOptions);
		};

		render.text.defaults = {
			name: 'required'
		};

		render.title = function (element, eOptions, fOptions) {
			var $title = $('<h' + eOptions.size + '>' + eOptions.text + '<h' + eOptions.size + '>'),
			    $subtitle = eOptions.subtext ? $('<small> ' + eOptions.subtext + '</small>') : null,
			    $separator = eOptions.separator ? $("<hr>") : null;

			element.append($title.append($subtitle)).append($separator);
		};

		render.title.defaults = {
			size: 4,
			text: 'Title Text Missing'
		};

		render.submit = function (element, eOptions, fOptions) {
			var $submit = $('<button class="btn btn-default">' + eOptions.text + '</button>').click(function (event) {
				fOptions.submit(scope, element, fOptions);
			});

			element.append($submit);
		};

		render.submit.defaults = {
			text: "Submit"
		};

		scope.$watch(attrs.tiFormRender, function (newVal) {
			render($element, newVal, newVal);
		});
	};
}]);
'use strict';

angular.module('tiForms').controller('testCtrl', ['$scope', function ($scope) {
	$scope.testForm = {
		name: "Test Form",
		elements: [{
			type: 'title',
			size: 1,
			text: 'Test large title',
			separator: true
		}, {
			type: 'text',
			placeholder: 'test placeholder',
			label: 'test label',
			name: "input1"
		}]
	};
}]);
//# sourceMappingURL=tiForms.js.map