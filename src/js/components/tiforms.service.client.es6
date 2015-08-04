angular.module('tiForms').factory('tiForms', [

	function() {
		function resolveFramework() {
			return {
				title: {
					size: 4,
					text: 'Missing Title Text',
					$structure: function(element, options) {
						return {
							title: options.subtitle ? ['subtitle'] : []
						};
					},
					$renderers: {
						title: function(element, options) {
							return $(`<h${options.size}>${options.text}</h${options.size}>`);
						},
						subtitle: function(element, options) {
							return $(`<small> ${options.subtitle}</small>`);
						}
					}
				},
				text: {
					$evaluate: true,
					$structure: 'input',
					$renderers: {
						input: function(element, options) {
							return $(`<input>`);
						}
					}
				},
				container: {
					margin: '0',
					border: '0px solid gray',
					borderWidth: '0px',
					padding: '0',
					$structure: {padding: '$children'},
					$renderers: {
						padding: function(element, options) {
							return $(`<div></div>`).css({
								margin: options.margin,
								border: options.border,
								borderWidth: options.borderWidth,
								padding: options.padding
							});
						}
					}
				},
				submit: {
					$structure: 'button',
					$renderers: {
						button: (element, options) => $('<div class="form-group">').append($(`<button>${options.text}</button>`)) 
					},
					text: 'Submit'
				}
			};
		}

		return {
			resolveFramework
		};
	}
]);