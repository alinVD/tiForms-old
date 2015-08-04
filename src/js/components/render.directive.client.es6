angular.module('tiForms').directive('tiFormRender', ['tiForms',

	function(tiForms) {

		function renderForm(element, schema, evaluateCallback) {

			var framework = tiForms.resolveFramework(schema),
				rootElement = element,
				inputs = {};

			_.forEach(schema.elements, (options) => {
				renderElement(element, options)
			});

			function renderElement(element, iOptions) {
				resolveOptions(iOptions);

				var newElement = renderStructure(element, iOptions.$structure, iOptions);

				if(iOptions.$evaluate)
					renderInput(newElement, iOptions);

				if(iOptions.$submit)
					renderSubmit(newElement, iOptions);

			}

			function renderInput(renderedElement, formElement) {
				if(!formElement.name) {
					console.error(`Render Error: Input ${formElement} has no name`);
					return;
				}
				else if (inputs[formElement.name]) {
					console.error(`Render Error: Input name ${formElement.name} used on multiple inputs`);
					return;
				}
				else {
					var evaluator = formElement.$evaluate instanceof Function ? formElement.$evaluate : function() { return this.filter('input').val(); };
					inputs[formElement.name] = function() { return evaluator.call(renderedElement, formElement); };
					return;
				}
			}

			function renderSubmit(renderedElement, formElement) {
				var filter;

				if(formElement.$submit === true) {
					filter = 'button';
				}
				else if(typeof formElement.$submit === 'string') {
					filter = formElement.$submit;
				} else {
					console.error(`Render Error: Submit ${formElement.$submit} has invalid type`);
					return;
				}

				renderedElement.filter(filter).click(evaluateForm);
			}

			function evaluateForm() {
				var output = _.mapValues(inputs, (evaluator) => evaluator());

				evaluateCallback(output);
			}

			function renderStructure(element, structure, options) {

				function normalizeStructure(structure, nowrap) {
					var normalized;
					if (structure instanceof Function) {
						return normalizeStructure(structure(element, options), nowrap);
					} else if (structure instanceof Array) {
						if (nowrap) {
							console.error(`Render Error: Structure ${structure} has an array inside of an array, which is not parseable`);
						} else {
							return normalized = _.map(structure, (substructure) => {
								return normalizeStructure(substructure, true);
							});
						}
					} else if (typeof structure === 'string') {
						normalized = {
							[structure]: []
						};
					} else if (structure instanceof Object) {
						if (Object.keys(structure).length !== 1) {
							console.error(`Render Error: Structure ${structre} does not have exactly one key`);
						} else {
							normalized = structure;
						}
					} else {
						console.error(`Render Error: Structure ${structure} could not be normalized (needs to be an object with exactly one key-pair, a string, or an array containing only the former two types)`);
						return [];
					}

					if (nowrap)
						return normalized;
					else
						return [normalized]
				}

				var children = normalizeStructure(structure),
					output = $();



				/*
					children should now be an array of objects that have one field, the field name being the renderer name and the value being a substructure (though that substructure won't be normalized).
					Example:
					[{label: ["input"]}, {title: []}]
				 */

				_.forEach(children, (childElement) => {
					var keys = Object.keys(childElement),
						name = keys[0],
						substructure = childElement[name];

					if (keys.length !== 1) {
						console.error(`Render Error: Improper structure ${children} has element ${childElement} with too many keys (the element should have exactly one key-pair)`);
					} else if (name[0] === '$') {
						if (substructure)
							console.warn(`Render Warning: Structure ${structure} has a substructure for elements reference ${name}`);
						let subElements = options[name.substring(1)];
						_.forEach(subElements, (subElement) => {
							renderElement(element, subElement);
						});
					} else {
						let renderer = options.$renderers[name];
						if (!(renderer instanceof Function)) {
							console.error(`Render Error: Renderer ${name} resolved to ${typeof renderer} when a function was expected`);
						} else {
							let subElement = renderer(element, options);

							element.append(subElement);
							output.add(subElement);
							output.add(renderStructure(subElement, substructure, options));
						}
					}
				});
				
				return output;
			}

			function resolveOptions(iOptions) {
				var fOptions = framework[iOptions.type];

				if (!fOptions) {
					console.error(`Render Error: Type ${iOptions.type} not defined in framework ${framework}`);
				}
				/*
				if (_.some(required, (field) => !iOptions[field])) {
					console.error(`Render Error: Options ${iOptions} is missing required field ${field}`);
					return;
				}
				*/
				_.forEach(fOptions, (value, field) => {
					if (iOptions[field] === undefined)
						iOptions[field] = value;
					else if (field[0] === '$')
						console.warn(`Render Warning: You have overwritten core field ${field} on instance options ${iOptions}`);
				});

				return iOptions;
			}

		}

		return function(scope, $element, attrs) {

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
						console.error(`Render Error: Element type '${eOptions.type}' has no defined renderer`);
						return;
					}
				} else {
					console.error("Render Error: Element type is undefined (and element isn't root)");
					return;
				}

				render.defaults(renderFunction, eOptions, fOptions)
				renderFunction(element, eOptions, fOptions);
			}

			render.defaults = function(renderer, eOptions, fOptions) {

				function defaults(field, value) {
					if (!eOptions[field])
						if (value === 'required') {
							console.error(`Render Error: Required field ${field} not defined`);
							return;
						} else
							eOptions[field] = value;
					else if (eOptions[field] instanceof Array && value instanceof Array) {
						_.forEach(value, (val) => {
							if (!_.find(eOptions[field], val)) {
								eOptions[field].push(val);
							}
						});
					}
				}

				_.forEach(renderer.defaults, (value, field) => {
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
			render.children = function(element, children, fOptions) {
				_.forEach(children, (eOptions) => {
					render(element, eOptions, fOptions);
				});
			};

			render.input = function(element, name, fOptions) {
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
			render.root = function(element, eOptions, fOptions) {
				render.children(element, fOptions.elements, fOptions);
			};

			render.root.defaults = {
				name: 'required',
				elements: [{
					type: 'submit'
				}],
				inputs: {},
				submit: (scope, element, fOptions) => { //fOptions argument shouldn't be needed (the this keyword should be substituted in the fucntion body, but the transpiler doesn't work with it)
					scope[fOptions.name] = _.reduce(fOptions.inputs, (output, inputElement, inputName) => {
						output[inputName] = inputElement.val();
						return output;
					}, {});
				}
			};

			render.text = function(element, eOptions, fOptions) {
				var $container = $('<div class="form-group">'),
					$input = $(`<input type="text" id="${fOptions.name}.${eOptions.value}" />`).addClass('form-control'),
					$label = eOptions.label ? $(`<label for="${fOptions.name}.${eOptions.name}">${eOptions.label}</label>`) : null;

				$input.attr('placeholder', eOptions.placeholder);

				$container.appendTo(element).append($label).append($input);

				render.input($input, eOptions.name, fOptions);
			};

			render.text.defaults = {
				name: 'required'
			};

			render.title = function(element, eOptions, fOptions) {
				var $title = $(`<h${eOptions.size}>${eOptions.text}<h${eOptions.size}>`),
					$subtitle = eOptions.subtext ? $(`<small> ${eOptions.subtext}</small>`) : null,
					$separator = eOptions.separator ? $("<hr>") : null;

				element.append($title.append($subtitle)).append($separator);
			};

			render.title.defaults = {
				size: 4,
				text: 'Title Text Missing'
			};

			render.submit = function(element, eOptions, fOptions) {
				var $submit = $(`<button class="btn btn-default">${eOptions.text}</button>`).click((event) => {
					fOptions.submit(scope, element, fOptions);
				});

				element.append($submit);
			};

			render.submit.defaults = {
				text: "Submit"
			};

			scope.$watch(attrs.tiFormRender, (newVal) => {
				renderForm($element, newVal, function(formOutput) {
					scope.output = formOutput;
				});
			});
		};
	}
]);