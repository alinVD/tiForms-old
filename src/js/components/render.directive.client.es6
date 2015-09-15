angular.module('tiForms').directive('tiFormRender', ['tiForms',

	function(tiForms) {

		function compileForm(formObject, frameworks, parentElement, submitCB) {

			let form = _.cloneDeep(formObject),
				framework = frameworks instanceof Array ? frameworks[formObject.framework] : frameworks,
				globalOptions = _.merge({}, framework.options, formObject.options),
				elements = framework.elements,
				wrappers = framework.wrappers,
				inputs = {};

			renderItems(form.elements, attachTarget);

			function renderItems(formItem, parentElement) {

				if (formItem instanceof Array) {
					_.forEach(formItem, (unwrappedItem) => compileItem(unwrappedItem, parentElement));
				} else {

					let $element = renderItem(formItem);

					parentElement.append(formItem.$element);

				}

			}

			function renderItem(formItem, type = formItem.type) {

				//ensure that user's input item has a defined type, the one required field for user inputs

				if (!formItem.type) {
					console.error('Render Error: Form item ', formItem, 'has no type');
					return $();
				}

				let frameworkItem = framework.items[type],
					$subElement = $();

				//ensure that the framework being used has defined behavior for the input type

				if (!frameworkItem) {
					console.error(`Render Error: Item type ${type} is not defined in the framework`);
					return $();
				}

				//ensure that the framework defined a renderer and that it is a function

				if (!(frameworkItem.renderer instanceof Function)) {
					console.error('Render Error: Framework item ', frameworkItem, ' is missing a renderer function');
				}

				//handle the framework item inheritance; all potential error in this process are handled in the recursive call and return an empty jQuery if it fails

				if (frameworkItem.sub) {
					$subElement = renderItem(formItem, formItem.sub);
				}

				//honor the frameworks default options for the input type.
				//Does not prevent type from being overwritten,
				//but there is no reason to overwrite type, as each set of defaults is already bound to a type and the related renderer can simply use a constant
				//regardless, type is not overwritten before calling the subrenderer, so renderers can change their behavior if they detect they are being called for inheritance

				let options = _.merge({}, frameworkItem.defaults, formItem)

				//call the current renderer, passing in the options, the rendered element it inherits from (or nothing), and the specialized renderers, and setting this to options (to allow for the renderer function to have no arguments defined in the simplest case)

				let boundRenderInput = _.wrap(formItem.name, renderInput),
					renders = {input: boundRenderInput, submit: renderSubmit, items: renderItems},
					$element = frameworkItem.renderer.call(options, options, $subElement, renders);

				//handle input fields for noninheritance renders
				
				if(frameworkItem.input && type === formItem.type) {
					if(!formItem.name) {
						console.log('Render Error: Form item ', formItem, 'is an input element without a name');
					} else if (inputs[formItem.name]) {
						console.log('Render Error: Form item ', formitem, 'is an input element reusing a name (every single form item\'s name field must be unique)');
					} else {
						let inputFn = (frameworkItem.input instanceof Function ? frameworkItem.input : defaultInputFn);
						inputs[formItem.name] = function() {
							inputFn.call(formItem, formItem, $element);
						}
					}
				}

				//handle submit buttons

				if(frameworkItem.submit) {

				}

				//wrap the rendered element, with options and global options as arguments, and options as this

				if (frameworkItem.wrapper) {
					let wrapper = framework.wrappers[frameworkItem.wrapper];
					if (wrapper instanceof Function) {
						$element = wrapper.call(options, options, globalOptions, $element)
					} else {
						console.error(`Render Error: Wrapper ${frameworkItem.wrapper} missing`);
					}
				}


				return $element;


			}

			function renderInput(boundName, input, name = boundName) {

				//created output function should require no arguments (and should never be provided any to ensure val will work);

				let outputFn = $.noop;

				if(input instanceof Function) {
					outputFn = input;
				} else if (input instanceof $) {
					outputFn = input.val;
				} else if (input instance of HTMLElement) {
					outputFn = $(input).val;
				} else {
					console.error('Render Error: Trying to register an input improperly (argument ', input, ' needs to be a function or browser element)');
				}

				if(inputs[name]) {
					console.warn(`Render Warning: You are reusing the same name ${name} for an input`);
				}

				inputs[name] = outputFn;
			}

			function renderSubmit(element, intermediateFn = _.identity) {
				
				function getValues() {
					return _.mapValues(inputs, (evalFn) => eval());
				}

				if(element instanceof HTMLElement) {
					element = $(element);
				}

				if(element instanceof $) {
					element.click(_.flow(getValues, intermediateFn, submitCB));
				} else {
					console.error('Render Error: Trying to register a submit with a nonelement (argument ', element, ' should be $ or DOM element');
				}

			}

			//defined in this block to avoid instantiating repeatedly

			function defaultInputFn(formElement) {
				return formElement.find('*').addBack().filter('input').val();
			}

		}

		return function(scope, element, attrs) {

			scope.$watch(attrs.tiFormRender, function(newForm) {
				element.empty();
				compileForm(newForm, tiForms.frameworks(), element, (output) => scope.$apply((scope) => scope.output = output));
			}, true);

		};
	}
]);