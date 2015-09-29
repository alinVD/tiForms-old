'use strict';

angular.module('tiForms', []);
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

angular.module('tiForms').directive('tiFormRender', ['tiForms', function (tiForms) {

	function compileForm(formObject, frameworks, parentElement, submitCB) {

		var form = _.cloneDeep(formObject),
		    framework = frameworks instanceof Array ? frameworks[formObject.framework] : frameworks,
		    globalOptions = _.merge({}, framework.options, formObject.options),
		    elements = framework.elements,
		    wrappers = framework.wrappers,
		    inputs = {},
		    validifers = [],
		    $root = undefined;

		if (framework.root) $root = framework.root(globalOptions, parentElement);

		renderItems(form.elements, $root || parentElement);

		function renderItems(formItem, parentElement) {
			var advRender = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

			if (formItem instanceof Array) {
				_.forEach(formItem, function (unwrappedItem) {
					return renderItems(unwrappedItem, parentElement, advRender);
				});
			} else {

				var $element = renderItem(formItem, advRender);

				parentElement.append($element);
			}
		}

		function renderItem(formItem, advRender, subtype) {

			//ensure that user's input item has a defined type, the one required field for user inputs

			var type = subtype || formItem.type;

			if (!type) {
				console.error('Render Error: Form item ', formItem, 'has no type');
				return $();
			}

			var frameworkItem = framework.items[type],
			    $subElement = $();

			//ensure that the framework being used has defined behavior for the input type

			if (!frameworkItem) {
				console.error('Render Error: Item type ' + type + ' is not defined in the framework');
				return $();
			}

			//ensure that the framework defined a renderer and that it is a function

			if (!(frameworkItem.renderer instanceof Function)) {
				console.error('Render Error: Framework item ', frameworkItem, ' is missing a renderer function');
			}

			//handle the framework item inheritance; all potential error in this process are handled in the recursive call and return an empty jQuery if it fails
			//continues disabling advanced rendering if already told to in the inheritance stack, otherwises uses the frameworkItem's value if it exists, finally defaults to allowing advanced rendering

			if (frameworkItem.sub) {
				$subElement = renderItem(formItem, advRender !== true ? advRender : frameworkItem.advRender !== undefined ? frameworkItem.advRender : advRender, frameworkItem.sub);
			}

			//honor the frameworks default options for the input type.
			//Does not prevent type from being overwritten,
			//but there is no reason to overwrite type, as each set of defaults is already bound to a type and the related renderer can simply use a constant
			//regardless, type is not overwritten before calling the subrenderer, so renderers can change their behavior if they detect they are being called for inheritance

			var options = _.merge({}, frameworkItem.defaults, formItem);

			//generate all render functions, disabling certain behaviors if needed

			var boundRenderInput = _.wrap(formItem.name, renderInput),
			    render = (advRender ? _.identity : _.mapValues)({
				input: boundRenderInput,
				submit: renderSubmit,
				items: renderItems,
				validity: renderValidity
			}, function () {
				return _.identity;
			}),
			    wrap = makeWrappers(frameworkItem.wrapper, options);

			render.wrap = wrap; //added here to not be affected by advRender disabling

			//call the current renderer, passing in:
			//the options
			//the specialized renderers, either with their correct behavior or with all functions set as the identity function
			//the rendered element it inherits from (or nothing)
			//and setting this to options (to allow for the renderer function to have no arguments defined in the simplest case)

			var $element = frameworkItem.renderer.call(options, options, render, $subElement);

			return $element;
		}

		function makeWrappers(wrapper, options) {
			//handle easiest case of false (no wrapper, only needs to be used for frameworks with no default wrapper)
			//otherwise, check if default wrapper should be used
			if (wrapper === false) {
				return null;
			} else if (wrapper === undefined) {
				wrapper = 'default';
			}

			//if input is a string (or default case), simply return the wrapperFn with that name
			if (_.isString(wrapper)) {
				var wrapperFn = framework.wrappers[wrapper];
				if (wrapperFn instanceof Function) {
					wrapperFn = _.wrap(options, _.wrap(globalOptions, wrapperFn));
					wrapperFn[wrapper] = wrapperFn; //the function will have a property pointing to itself, to always allow wrap.wrapperName to be used even if it isnt an object from the array case
					wrapper = wrapperFn;
				} else {
					console.error('Unable to find wrapperFn ' + wrapper);
					return null;
				}
			} else if (wrapper instanceof Array) {
				//if wrapper is an array, transform it into an object with (key, value)::(wrapperName, wrapperFn)
				wrapper = _.reduce(wrapper, function (agg, wrapperName) {
					var wrapperFn = framework.wrappers[wrapperName];
					if (wrapperFn instanceof Function) {
						agg[wrapperName] = _.wrap(options, _.wrap(globalOptions, wrapperFn));;
					} else {
						console.error('Unable to find wrapperFn ' + wrapperName);
					}
					return agg;
				}, {});
			} else {
				//no supported logic for input type (null, number and object)
				console.error('Unable to process wrapper ' + wrapper + ' (should be false, a string, an array, or undefined)');
				return null;
			}

			return wrapper;
		}

		function renderInput(boundName, input) {
			var name = arguments.length <= 2 || arguments[2] === undefined ? boundName : arguments[2];
			return (function () {

				//created output function should require no arguments (and should never be provided any to ensure val will work);

				var outputFn = $.noop;

				if (input instanceof Function) {
					outputFn = input;
				} else if (input instanceof $) {
					outputFn = input.val.bind(input);
				} else if (input instanceof HTMLElement) {
					outputFn = $(input).val.bind(input);
				} else {
					console.error('Render Error: Trying to register an input improperly (argument ', input, ' needs to be a function or browser element)');
				}

				if (inputs[name]) {
					console.warn('Render Warning: You are reusing the same name ' + name + ' for an input');
				}

				inputs[name] = outputFn;

				return input;
			})();
		}

		function renderSubmit(element) {
			var processorFn = arguments.length <= 1 || arguments[1] === undefined ? _.identity : arguments[1];

			function getValues() {
				return _.mapValues(inputs, function (evalFn) {
					return evalFn();
				});
			}

			if (element instanceof HTMLElement) {
				element = $(element);
			}

			if (element instanceof $) {
				element.click(_.flow(getValues, processorFn, submitCB));
			} else {
				console.error('Render Error: Trying to register a submit with a nonelement (argument ', element, ' should be $ or DOM element');
			}

			return element;
		}

		function renderValidity(validifer, validCB, invalidCB) {

			if (validifer[0]) validifer = validifer[0];

			if (validifer.reportValidity) validifer = validifer.reportValidity;else if (validifer.checkValidity) validifer = validifer.checkValidity;

			if (validifer instanceof Function) {
				validifers.push([validifer, validCB, invalidCB]);
			} else {
				console.error('Render error: Invalid validifer ', validifer, '. Must be a function or an element with browser input validation');
			}
		}

		//iterates through every validifier, calling the appropriate callback, then finally returns whether every validifer returned true or not
		function checkValidity() {
			return _.every(validifers, function (_ref) {
				var _ref2 = _slicedToArray(_ref, 3);

				var validifer = _ref2[0];
				var validCB = _ref2[1];
				var invalidCB = _ref2[2];

				var valid = validifer(globalOptions);
				(valid ? validCB : invalidCB)();
				return valid;
			});
		}

		//defined in this block to avoid instantiating repeatedly

		function defaultInputFn(formElement) {
			return formElement.find('*').addBack().filter('input').val();
		}
	}

	return function (scope, element, attrs) {

		scope.$watch(attrs.tiFormRender, function (newForm) {
			element.empty();
			compileForm(newForm, tiForms.frameworks(), element, function (output) {
				scope.$apply(function (scope) {
					return scope.output = output;
				});
			});
		}, true);
	};
}]);
'use strict';

angular.module('tiForms').controller('testCtrl', ['$scope', function ($scope) {
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
}]);
'use strict';

angular.module('tiForms').factory('tiForms', [function () {
	function frameworks() {
		return {
			root: function root(globalOptions, $element) {
				$element.addClass('form-horizontal');
			},
			items: {
				submit: {
					renderer: function renderer(options, render) {
						var $submit = $('<button>');

						$submit.text(options.text);

						//adds classes btn and btn-${status} if it is recognized, otherwise btn-default
						$submit.addClass('btn btn-' + (_.includes(['default', 'primary', 'success', 'info', 'warning', 'danger', 'link'], options.status) ? options.status : 'default'));

						render.submit($submit);

						return render.wrap($submit);
					},
					defaults: {
						status: 'primary',
						size: '',
						label: '',
						text: 'Submit'
					}
				},
				input: {
					renderer: function renderer(options, render) {
						var $input = $('<input>');

						$input.attr({
							placeholder: options.placeholder,
							type: this.type
						});

						$input.addClass('form-control');

						render.input($input);

						render.validity($input, function () {
							$input.closest('form-group').removeClass('has-error').addClass('has-success');
						}, function () {
							$input.closest('form-group').addClass('has-error').removeClass('has-success');
						});

						if (options.group && (options.group.left || options.group.right)) {

							$input = $('<div class="input-group">').append($input);

							if (options.group.size) {
								if (_.includes(['l', 'lg', 'large'], options.group.size)) $input.addClass('input-group-lg');else if (_.includes(['s', 'sm', 'small'], options.group.size)) $input.addClass('input-group-sm');
							}

							if (options.group.left) $input.append($('<span class="input-group-addon">' + options.group.left + '<span>'));
							if (options.group.right) $input.append($('<span class="input-group-addon">' + options.group.right + '<span>'));
						}

						return render.wrap($input);
					}
				},
				text: {
					sub: 'input',
					renderer: function renderer(options, render, $subElement) {
						return $subElement;
					}
				},
				password: {
					sub: 'input',
					renderer: function renderer(options, render, $subElement) {
						return $subElement;
					}
				},
				email: {
					sub: 'input',
					renderer: function renderer(options, render, $subElement) {
						return $subElement;
					}
				},
				number: {
					sub: 'input',
					renderer: function renderer(options, render, $subElement) {
						return $subElement;
					}
				},
				select: {
					renderer: function renderer(options, render) {
						//figure out how to make this inherit from the input type properly even though a tag has to be swapped (and keep certain behavior)
					}
				},
				confirmPassword: {
					sub: 'password',
					renderer: function renderer(options, render, $sub) {
						var $original = $sub,
						    $confirm = $sub.clone(); //clone will have same elements as original, but not the validity or input behavior of the original element (this is good)

						render.validity(function () {
							return $origina.value() === $confirm.value();
						}, function () {
							//once wrappers have been switched into this function use separate wrappers for separate form-groups/validation for actual password/confirm password
						}, function () {
							//see above
						});
					}
				},
				confirmEmail: {
					sub: 'email',
					renderer: function renderer(options, render, $sub) {
						var $original = $sub,
						    $confirm = $sub.clone();

						render.validity(function () {
							return $origina.value() === $confirm.value();
						}, function () {
							//once wrappers have been switched into this function use separate wrappers for separate form-groups/validation for actual password/confirm password
						}, function () {
							//see above
						});
					}
				}
			},
			wrappers: {
				'default': function _default(globalOptions, options, $element) {
					var labelSizes = globalOptions.labelSize,
					    sizes = ['xs', 'sm', 'md', 'lg'];

					//standardize inputs as an object with (key, value)::(sizeName, sizeValue), size name is bootstrap size name e.g. 'xs'

					if (_.isNumber(labelSizes)) {
						//if only one number is given, assume it is meant for all displays
						labelSizes = { xs: labelSizes };
					} else if (labelSizes instanceof Array) {
						//if multiple numbers are given in sequence, assume they describe the sizes from xs up to lg
						labelSizes = _.reduce(labelSizes, function (agg, size, index) {
							return agg[sizes[index]] = size;
						}, {});
					}

					var $group = $('<div class="form-group">'),
					    $label = $('<label class="control-label">' + options.label + '</label>').appendTo($group),
					    $column = $('<div>').append($element).appendTo($group);

					_.forEach(labelSizes, function (size, sizeName) {
						$label.addClass('col-' + sizeName + '-' + size);
						$column.addClass('col-' + sizeName + '-' + (12 - size)); //magic number 12 comes from number of bootstrap columns
					});

					return $group;
				}
			},
			options: {
				labelSize: 4
			}
		};
	}

	return {
		frameworks: frameworks
	};
}]);
//# sourceMappingURL=tiForms.js.map