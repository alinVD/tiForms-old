angular.module('tiForms').directive('tiFormRender', ['tiForms',

	function(tiForms) {

		function compileForm(formObject, parentElement, submitCB) {

			let form = _.cloneDeep(formObject),
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
				let itemFramework = framework[formItem.type],
					defaults = itemFramework.defaults,
					required = itemFramework.required === undefined ? [] : (itemFramework.required instanceof Array ? itemFramework.required : [itemFramework.required]);

				//dandle core ($) fields
				_.forEach(itemFramework, (val, key) => {
					if(key[0] === '$') {
						if(formItem[key] === undefined) {
							formItem[key] = val;
						} else {
							console.warn('Render Warning: You have overwritten a core field. Proper behavior not gauranteed');
						}
					}
				});

				//handle default fields
				_.forEach(defaults, (val, key) => {
					if(key[0] === '$') {
						console.warn('Framework Error: Core fields should be fields of the framework item, not subfields of its defaults object');
					} else {
						if(formItem[key] === undefined) {
							formItem[key] = val;
						}
					}
				});

				//handle required fields
				_.forEach(required, (val, key) => {
					if(formItem[key] === undefined) {
						console.error('Render Error: Required field not defined');
					}
				});
			}

			function compileItem(formItem, parentElement) {

				if(formItem instanceof Array) {
					_.forEach(formItem, (unwrappedItem) => compileItem(unwrappedItem, parentElement));
				} else {

					reconcileFramework(formItem);

					formItem.$element = renderElement(formItem);

					if(formItem.$evaluate) compileInput(formItem);

					if(formItem.$submit) compileSubmit(formItem);

					parentElement.append(formItem.$element);

				}

			}

			function renderElement(formItem) {

				if(formItem.$renderer instanceof Function) {
					return formItem.$renderer.call(formItem, renderElement);
				} else if(formItem.$renderer instanceof Array && _.every(formItem.$renderer, (renderer) => renderer instanceof Function)) {
					return _.reduce(formItem.$renderer, (renderedElement, renderer) => renderedElement.add(renderer.call(formItem, renderElement)), $());
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

				if(!_.isString(formItem.name)) {
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

				if(_.isString(formItem.$target)) {
					target = formItem.$element.find('*').addBack().filter(formItem.$target);
				} else if(formItem.$target instanceof Function) {
					target = formItem.$target.call(formItem, formItem.$element);
				} else if(formItem.$target === undefined) {
					target = formItem.$element.find('*').addBack().filter('button');
				}

				if(formItem.$submit instanceof Function) {
					target.click(() => formItem.$submit.call(formItem, inputs, submitCB));
				} else if(formItem.$submit === true) {
					target.click(() => submitCB(_.mapValues(inputs, (formItem) => formItem.$evaluate.call(formItem, formItem.$element))));
				}

			}

		}

		return function(scope, element, attrs) {

			scope.$watch(attrs.tiFormRender, function(newForm) {
				element.empty();
				compileForm(newForm, element, (output) => scope.$apply((scope) => scope.output = output));
			}, true);

		};
	}
]);