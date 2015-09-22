angular.module('tiForms').factory('tiForms', [

	function() {
		function frameworks() {
			return {
				items: {
					input: {
						renderer: function(options, render) {
							let $input = $('<input>');

							$input.attr({
								placeholder: options.placeholder,
								type: this.type
							});

							$input.addClass('form-control');

							render.input($input);

							render.validity($input, function() {
								$input.closest('form-group').removeClass('has-error').addClass('has-success');
							}, function() {
								$input.closest('form-group').addClass('has-error').removeClass('has-success');
							});

							if(options.group && options.group.left || options.group.right) {

								$input = $('<div class="input-group">').append($input);

								if(options.group.size) {
									if(_.includes(['l', 'lg', 'large'], options.group.size)) $input.addClass('input-group-lg');
									else if(_.includes(['s', 'sm', 'small'], options.group.size)) $input.addClass('input-group-sm');
								}

								if(options.group.left) $input.append($(`<span class="input-group-addon">${options.group.left}<span>`));
								if(options.group.right) $input.append($(`<span class="input-group-addon">${options.group.right}<span>`));
							} 

							return $input;
						}
					},
					text: {
						sub: input;
						renderer: function(options, render, $subElement) {
							return $subElement;
						}
					},
					password: {
						sub: input;
						renderer: function(options, render, $subElement) {
							return $subElement;
						}
					},
					email: {
						sub: input;
						renderer: function(options, render, $subElement) {
							return $subElement;
						}
					},
					select: {
						
					}
				},
				wrappers: {
					default: function($element, globalOptions, options) {
						let columnSize = globalOptions.columnSize,
							sizes = ['xs', 'sm', 'md', 'lg'];

						if(columnSize instanceof Array) columnSize = {xs: size});

						let $group = $('<div class="form-group">'),
							$label = $('<label class="control-label>').appendTo($group),
							$column = $('<div>').append($element).appendTo($group);

						_.forEach(sizes, function(size) {
							let arr = columnSize[size]
							if(arr && arr.length > 1) {
								$label.addClass(`col-${size}-${arr[0]}`);
								$column.addClass(`col-${size}.${arr[1]}`);
							}
						}

						return $group;
					}
				},
				options: {

				}
			};
		}

		return {
			frameworks
		};
	}
]);