angular.module('tiForms').directive('tiFormRender', ['tiForms',

	function(tiForms) {

		function compileForm(formObject, frameworks, parentElement, submitCB) {

			let form = _.cloneDeep(formObject),
				framework = frameworks instanceof Array ? frameworks[formObject.framework] : frameworks,
				globalOptions = _.merge({}, framework.options, formObject.options),
				elements = framework.elements,
				wrappers = framework.wrappers,
				inputs = {},
				validifers = [],
				$root;

			if(framework.root) $root = framework.root(globalOptions, parentElement);

			renderItems(form.elements, $root || parentElement);

			function renderItems(formItem, parentElement, advRender = true) {

				if (formItem instanceof Array) {
					_.forEach(formItem, (unwrappedItem) => renderItems(unwrappedItem, parentElement, advRender));
				} else {

					let $element = renderItem(formItem, advRender);

					parentElement.append($element);

				}

			}

			function renderItem(formItem, advRender, subtype) {

				//ensure that user's input item has a defined type, the one required field for user inputs

				let type = subtype || formItem.type;

				if (!type) {
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
				//continues disabling advanced rendering if already told to in the inheritance stack, otherwises uses the frameworkItem's value if it exists, finally defaults to allowing advanced rendering

				if (frameworkItem.sub) {
					$subElement = renderItem(
						formItem,
						advRender !== true ? advRender : (frameworkItem.advRender !== undefined ? frameworkItem.advRender : advRender),
						frameworkItem.sub
					);
				}

				//honor the frameworks default options for the input type.
				//Does not prevent type from being overwritten,
				//but there is no reason to overwrite type, as each set of defaults is already bound to a type and the related renderer can simply use a constant
				//regardless, type is not overwritten before calling the subrenderer, so renderers can change their behavior if they detect they are being called for inheritance

				let options = _.merge({}, frameworkItem.defaults, formItem)

				//generate all render functions, disabling certain behaviors if needed

				let boundRenderInput = _.wrap(formItem.name, renderInput),
					render = (advRender ? _.identity : _.mapValues)({
						input: boundRenderInput,
						submit: renderSubmit,
						items: renderItems,
						validity: renderValidity
					}, () => _.identity),
					wrap = makeWrappers(frameworkItem.wrapper, options);

				render.wrap = wrap; //added here to not be affected by advRender disabling

				//call the current renderer, passing in:
				//the options
				//the specialized renderers, either with their correct behavior or with all functions set as the identity function
				//the rendered element it inherits from (or nothing)
				//and setting this to options (to allow for the renderer function to have no arguments defined in the simplest case)

				let $element = frameworkItem.renderer.call(options, options, render, $subElement);
				
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
				if(_.isString(wrapper)) {
					let wrapperFn = framework.wrappers[wrapper];
					if(wrapperFn instanceof Function) {
						wrapperFn = _.wrap(options, _.wrap(globalOptions, wrapperFn)); 
						wrapperFn[wrapper] = wrapperFn //the function will have a property pointing to itself, to always allow wrap.wrapperName to be used even if it isnt an object from the array case 
						wrapper = wrapperFn;
					} else {
						console.error(`Unable to find wrapperFn ${wrapper}`);
						return null;
					}
				} else if(wrapper instanceof Array) { //if wrapper is an array, transform it into an object with (key, value)::(wrapperName, wrapperFn)
					wrapper = _.reduce(wrapper, function(agg, wrapperName) {
						let wrapperFn = framework.wrappers[wrapperName];
						if(wrapperFn instanceof Function) {
							agg[wrapperName] = _.wrap(options, _.wrap(globalOptions, wrapperFn)); ;
						} else {
							console.error(`Unable to find wrapperFn ${wrapperName}`);
						}
						return agg;
					}, {});
				} else { //no supported logic for input type (null, number and object)
					console.error(`Unable to process wrapper ${wrapper} (should be false, a string, an array, or undefined)`);
					return null;
				}

				return wrapper;
			}

			function renderInput(boundName, input, name = boundName) {

				//created output function should require no arguments (and should never be provided any to ensure val will work);

				let outputFn = $.noop;

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
					console.warn(`Render Warning: You are reusing the same name ${name} for an input`);
				}

				inputs[name] = outputFn;

				return input;
			}

			function renderSubmit(element, processorFn = _.identity) {

				function getValues() {
					return _.mapValues(inputs, (evalFn) => evalFn());
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

				if (validifer.reportValidity) validifer = validifer.reportValidity;
				else if (validifer.checkValidity) validifer = validifer.checkValidity;

				if (validifer instanceof Function) {
					validifers.push([validifer, validCB, invalidCB]);
				} else {
					console.error('Render error: Invalid validifer ', validifer, '. Must be a function or an element with browser input validation');
				}
			}


			//iterates through every validifier, calling the appropriate callback, then finally returns whether every validifer returned true or not
			function checkValidity() {
				return _.every(validifers, function([validifer, validCB, invalidCB]) {
					let valid = validifer(globalOptions);
					(valid ? validCB : invalidCB)();
					return valid;
				});
			}

			//defined in this block to avoid instantiating repeatedly

			function defaultInputFn(formElement) {
				return formElement.find('*').addBack().filter('input').val();
			}

		}

		return function(scope, element, attrs) {

			scope.$watch(attrs.tiFormRender, function(newForm) {
				element.empty();
				compileForm(newForm, tiForms.frameworks(), element, (output) => {
					scope.$apply((scope) => scope.output = output)
				});
			}, true);

		};
	}
]);