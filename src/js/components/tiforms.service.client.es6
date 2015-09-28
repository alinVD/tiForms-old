angular.module('tiForms').factory('tiForms', [

	function() {
		function frameworks() {
			return {
				root: function(globalOptions, $element) {
					$element.addClass('form-horizontal');
				},
				items: {
					submit: {
						renderer: function(options, render) {
							let $submit = $('<button>');

							$submit.text(options.text);

							//adds classes btn and btn-${status} if it is recognized, otherwise btn-default
							$submit.addClass(`btn btn-${_.includes(['default', 'primary', 'success', 'info', 'warning', 'danger', 'link'], options.status) ? options.status : 'default'}`);

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

							if(options.group && (options.group.left || options.group.right)) {

								$input = $('<div class="input-group">').append($input);

								if(options.group.size) {
									if(_.includes(['l', 'lg', 'large'], options.group.size)) $input.addClass('input-group-lg');
									else if(_.includes(['s', 'sm', 'small'], options.group.size)) $input.addClass('input-group-sm');
								}

								if(options.group.left) $input.append($(`<span class="input-group-addon">${options.group.left}<span>`));
								if(options.group.right) $input.append($(`<span class="input-group-addon">${options.group.right}<span>`));
							} 

							return render.wrap($input);
						}
					},
					text: {
						sub: 'input',
						renderer: function(options, render, $subElement) {
							return $subElement;
						}
					},
					password: {
						sub: 'input',
						renderer: function(options, render, $subElement) {
							return $subElement;
						}
					},
					email: {
						sub: 'input',
						renderer: function(options, render, $subElement) {
							return $subElement;
						}
					},
					number: {
						sub: 'input',
						renderer: function(options, render, $subElement) {
							return $subElement;
						}
					},
					select: {
						renderer: function(options, render) {
							//figure out how to make this inherit from the input type properly even though a tag has to be swapped (and keep certain behavior)
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
					default: function(globalOptions, options, $element) {
						let labelSizes = globalOptions.labelSize,
							sizes = ['xs', 'sm', 'md', 'lg'];

						//standardize inputs as an object with (key, value)::(sizeName, sizeValue), size name is bootstrap size name e.g. 'xs'

						if(_.isNumber(labelSizes)) { //if only one number is given, assume it is meant for all displays
							labelSizes = {xs: labelSizes};
						} else if(labelSizes instanceof Array) { //if multiple numbers are given in sequence, assume they describe the sizes from xs up to lg
							labelSizes = _.reduce(labelSizes, (agg, size, index) => agg[sizes[index]] = size, {});
						}


						let $group = $('<div class="form-group">'),
							$label = $(`<label class="control-label">${options.label}</label>`).appendTo($group),
							$column = $('<div>').append($element).appendTo($group);

						_.forEach(labelSizes, function(size, sizeName) {
							$label.addClass(`col-${sizeName}-${size}`);
							$column.addClass(`col-${sizeName}-${12 - size}`); //magic number 12 comes from number of bootstrap columns
						})

						return $group;
					}
				},
				options: {
					labelSize: 4
				}
			};
		}

		return {
			frameworks
		};
	}
]);