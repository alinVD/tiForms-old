'use strict';

angular.module('tiForms', []);
'use strict';

angular.module('tiForms').directive('tiFormRender', ['tiForms', function (tiForms) {

	function compileForm(formObject, parentElement, submitCB) {

		var form = _.cloneDeep(formObject),
		    framework = tiForms.resolveFramework(),
		    inputs = {},
		    attachTarget = framework.$root ? framework.$root.call(form, parentElement) : parentElement;
		/*
  formRoot = framework.$root(form).appendTo(parentElement),
  attachTarget = formRoot;
  if(framework.$attach === undefined) {
  let children = attachTarget.children();
  while(children.length) {
  	if(children.length > 1) {
  		console.warn('Framework Warning: $attach should be defined for non-linear root elements');
  	}
  	attachTarget = children.first();
  	children = attachTarget.children();
  }
  } else if(framework.$attach instanceof Function) {
  attachTarget = framework.$attach.call(form, formRoot);
  } else if(_.isString(framework.$attach)) {
  attachTarget = formRoot.find('*').filter(framework.$attach);
  } else {
  console.log('Framework Error: $attach field type not supported');
  return;
  }*/

		compileItem(form.elements, attachTarget);

		function reconcileFramework(formItem) {
			var itemFramework = framework[formItem.type],
			    defaults = itemFramework.defaults,
			    required = itemFramework.required === undefined ? [] : itemFramework.required instanceof Array ? itemFramework.required : [itemFramework.required];

			//dandle core ($) fields
			_.forEach(itemFramework, function (val, key) {
				if (key[0] === '$') {
					if (formItem[key] === undefined) {
						formItem[key] = val;
					} else {
						console.warn('Render Warning: You have overwritten a core field. Proper behavior not gauranteed');
					}
				}
			});

			//handle default fields
			_.forEach(defaults, function (val, key) {
				if (key[0] === '$') {
					console.warn('Framework Error: Core fields should be fields of the framework item, not subfields of its defaults object');
				} else {
					if (formItem[key] === undefined) {
						formItem[key] = val;
					}
				}
			});

			//handle required fields
			_.forEach(required, function (val, key) {
				if (formItem[key] === undefined) {
					console.error('Render Error: Required field not defined');
				}
			});
		}

		function compileItem(formItem, parentElement) {

			if (formItem instanceof Array) {
				_.forEach(formItem, function (unwrappedItem) {
					return compileItem(unwrappedItem, parentElement);
				});
			} else {

				reconcileFramework(formItem);

				formItem.$element = renderElement(formItem);

				if (formItem.$evaluate) compileInput(formItem);

				if (formItem.$submit) compileSubmit(formItem);

				parentElement.append(formItem.$element);
			}
		}

		function renderElement(formItem) {

			if (formItem.$renderer instanceof Function) {
				return formItem.$renderer.call(formItem, renderElement);
			} else if (formItem.$renderer instanceof Array && _.every(formItem.$renderer, function (renderer) {
				return renderer instanceof Function;
			})) {
				return _.reduce(formItem.$renderer, function (renderedElement, renderer) {
					return renderedElement.add(renderer.call(formItem, renderElement));
				}, $());
			} else {
				console.error('Render Error: Renderer not valid');
				return $('<div>Error renderering element</div>');
			}
			/*
   function actualRender(formItem) {
   	if(_.isString(formItem.$sub)) {
   		framework[formItem.$sub].$renderer
   	}
   }
   */
		}

		function compileInput(formItem) {

			if (!_.isString(formItem.name)) {
				console.error('Render Error: Form input missing required name field');
			} else if (inputs[formItem.name]) {
				console.error('Render Error: Form input name already in use');
			} else {
				formItem.$evaluate = formItem.$evaluate instanceof Function ? formItem.$evaluate : defaultEvaluate;
				inputs[formItem.name] = formItem;
			}

			function defaultEvaluate(formElement) {
				return formElement.find('*').addBack().filter('input').val();
			}
		}

		function compileSubmit(formItem) {

			var target;

			if (_.isString(formItem.$target)) {
				target = formItem.$element.find('*').addBack().filter(formItem.$target);
			} else if (formItem.$target instanceof Function) {
				target = formItem.$target.call(formItem, formItem.$element);
			} else if (formItem.$target === undefined) {
				target = formItem.$element.find('*').addBack().filter('button');
			}

			if (formItem.$submit instanceof Function) {
				target.click(function () {
					return formItem.$submit.call(formItem, inputs, submitCB);
				});
			} else if (formItem.$submit === true) {
				target.click(function () {
					return submitCB(_.mapValues(inputs, function (formItem) {
						return formItem.$evaluate.call(formItem, formItem.$element);
					}));
				});
			}
		}
	}

	return function (scope, element, attrs) {

		scope.$watch(attrs.tiFormRender, function (newForm) {
			element.empty();
			compileForm(newForm, element, function (output) {
				return scope.$apply(function (scope) {
					return scope.output = output;
				});
			});
		}, true);
	};
}]);
'use strict';

angular.module('tiForms').controller('testCtrl', ['$scope', function ($scope) {
	$scope.testForm = {
		name: "Test Form",
		elements: []
	};
}]);
'use strict';

angular.module('tiForms').factory('tiForms', [function () {
	function resolveFramework() {
		return {
			$root: function $root(parentElement) {
				return $('<div>').appendTo(parentElement);
			},
			title: {
				$renderer: function $renderer() {
					return $('<h' + this.size + '>' + this.text + '</h' + this.size + '>').append(this.subtitle ? $('<small> ' + this.subtitle + '</small>') : null);
				},
				defaults: {
					text: 'Missing title text',
					size: 3
				}
			},
			text: {
				$evaluate: true,
				$renderer: function $renderer() {
					return $('<div class="form-group">').append(this.label ? $('<label>' + this.label + '</div>') : null).append($('<input type="text" class="form-control">').attr('placeholder', this.placeholder));
				}
			},
			number: {
				$evaluate: true,
				$renderer: function $renderer() {
					return $('<div class="form-group">').append(this.label ? $('<label>' + this.label + '</div>') : null).append($('<input type="number" class="form-control">'));
				}
			},
			input: {
				evaluate: true,
				$renderer: function $renderer() {
					var $input = $('<input>'),
					    $label = this.label ? $('<label>' + this.label + '<label>') : $();

					$input.attr({
						placeholder: this.placeholder,
						type: this.type
					});

					$input.style(this.xStyle);
					$input.addClass(this.xClasses);
					$input.attr(this.xAttr);

					if (this.group) {
						var $group = $('<div class="input-group');

						if (this.group.left) $group.append($('<span class="input-group-addon">' + this.group.left + '</span>'));

						$group.append($input);

						if (this.group.right) $group.append($('<span class="input-group-addon">' + this.group.right + '</span>'));

						$input = $group;
					}

					return $('<div class="form-group">').append($label).append($input);
				}
			},
			submit: {
				$submit: true,
				$renderer: function $renderer() {
					return $('<div class="form-group">').append($('<button class="btn btn-default">' + this.text + '</button>'));
				},
				defaults: {
					text: 'Submit'
				}
			}
		};
	}

	return {
		resolveFramework: resolveFramework
	};
}]);
//# sourceMappingURL=tiForms.js.map