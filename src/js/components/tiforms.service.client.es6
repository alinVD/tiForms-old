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
					number: {
						sub: input;
						renderer: function(options, render, $subElement) {
							return $subElement;
						}
					},
					select: {
						renderer: function(options, render) {
							let $select = $('<select>');

							$select.attr({
								placeholder: options.placeholder,
								type: this.type
							});

							$select.addClass('form-control');

							_.forEach(options.options, function(optionName, optionValue) { //option name is the value in the options object, option value is the key, thus the key/value arguments appear transposed
								$(`<option value="${optionValue}">${optionName}</option>`).appendTo($select);
							});

							render.input($select);

							render.validity($select, function() {
								$select.closest('form-group').removeClass('has-error').addClass('has-success');
							}, function() {
								$select.closest('form-group').addClass('has-error').removeClass('has-success');
							});

							if(options.group && options.group.left || options.group.right) {

								$select = $('<div class="input-group">').append($select);

								if(options.group.size) {
									if(_.includes(['l', 'lg', 'large'], options.group.size)) $select.addClass('input-group-lg');
									else if(_.includes(['s', 'sm', 'small'], options.group.size)) $select.addClass('input-group-sm');
								}

								if(options.group.left) $select.append($(`<span class="input-group-addon">${options.group.left}<span>`));
								if(options.group.right) $select.append($(`<span class="input-group-addon">${options.group.right}<span>`));
							} 

							return $select;
						}
					},
					confirmPassword: {
						sub: 'password',
						renderer: function(options, render, $sub) {
							let $original = $sub,
								$confirm = $sub.clone(); //clone will have same elements as original, but not the validity or input behavior of the original element (this is good)

							render.validity(function() {
								return $origina.value() === $confirm.value();
							}, function() {
								//once wrappers have been switched into this function use separate wrappers for separate form-groups/validation for actual password/confirm password
							}, function() {
								//see above
							})
						}
					},
					confirmEmail: {
						sub: 'email',
						renderer: function(options, render, $sub) {
							let $original = $sub,
							$confirm = $sub.clone();

							render.validity(function() {
								return $origina.value() === $confirm.value();
							}, function() {
								//once wrappers have been switched into this function use separate wrappers for separate form-groups/validation for actual password/confirm password
							}, function() {
								//see above
							})
						}
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
					labelSize: 4,
					inputSize: 8
				}
			};
		}

		return {
			frameworks
		};
	}
]);