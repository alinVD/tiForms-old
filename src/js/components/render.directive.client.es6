angular.module('tiForms').directive('tiFormRender', ['tiForms',

	function(tiForms) {

		function compileForm(formObject, parentElement, submitCB) {

			let form = _.cloneDeep(formObject),
				framework = tiForms.resolveFramework(),
				globalOptions = _.merge({}, framework.options, formObject.options),
				elements = framework.elements,
				wrappers = framework.wrappers,
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

					let renderElement = renderItem(formItem);

					if(formItem.$evaluate) compileInput(formItem);

					if(formItem.$submit) compileSubmit(formItem);

					parentElement.append(formItem.$element);

				}

			}

			function renderItem(formItem, type = formItem.type) {

				//ensure that user's input item has a defined type, the one required field for user inputs

				if(!formItem.type) {
					console.error('Render Error: Form item ', formItem, 'has no type');
					return $();
				}

				let frameworkItem = framework.items[type],
					$subElement = $();

				//ensure that the framework being used has defined behavior for the input type
					
				if(!frameworkItem) {
					console.error(`Render Error: Item type ${type} is not defined in the framework`);
					return $();
				}

				//ensure that the framework defined a renderer and that it is a function

				if(!(frameworkItem.renderer instanceof Function)) {
					console.error('Render Error: Framework item ', frameworkItem, ' is missing a renderer function');
				}

				//handle the framework item inheritance; all potential error in this process are handled in the recursive call and return an empty jQuery if it fails

				if(frameworkItem.sub) {
					$subElement = renderElement(formItem, formItem.sub);
				}

				//honor the frameworks default options for the input type.
				//Does not prevent type from being overwritten,
				//but there is no reason to overwrite type, as each set of defaults is already bound to a type and the related renderer can simply use a constant
				//regardless, type is not overwritten before calling the subrenderer, so renderers can change their behavior if they detect they are being called for inheritance

				let options = _.merge({}, frameworkItem.defaults, formItem)

				//call the current renderer, passing in the options, the rendered element it inherits from (or nothing), and the ability to have child elements, and setting this to options (to allow for the renderer function to have no arguments defined in the simplest case)
			
				let $element = frameworkItem.renderer.call(options, options, $subElement, compileItem);

				//wrap the rendered element, with options and global options as arguments, as options as this

				if(frameworkItem.wrapper) {
					let wrapper = framework.wrappers[frameworkItem.wrapper];
					if(wrapper instanceof Function) {
						wrapper.call(options, options, globalOptions, $element)
					} else {
						console.error(`Render Error: Wrapper ${frameworkItem.wrapper} missing`);
					}
				}
			}

			function compileInput(formItem) {

				if(!_.isString(formItem.name)) {
					console.error('Render Error: Form input missing required String "name"');
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