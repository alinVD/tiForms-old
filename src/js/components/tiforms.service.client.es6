angular.module('tiForms').factory('tiForms', [

	function() {
		function frameworks() {
			return {
				$root: (parentElement) => $('<div>').appendTo(parentElement),
				title: {
					$renderer: function() {
						return $(`<h${this.size}>${this.text}</h${this.size}>`).append(this.subtitle ? $(`<small> ${this.subtitle}</small>`) : null);
					},
					defaults: {
						text: 'Missing title text',
						size: 3
					}
				},
				text: {
					$evaluate: true,
					$renderer: function() {
						return $('<div class="form-group">').append(this.label ? $(`<label>${this.label}</div>`) : null).append($('<input type="text" class="form-control">').attr('placeholder', this.placeholder));
					}
				},
				number: {
					$evaluate: true,
					$renderer: function() {
						return $('<div class="form-group">').append(this.label ? $(`<label>${this.label}</div>`) : null).append($('<input type="number" class="form-control">'));
					}
				},
				input: {
					evaluate: true,
					$renderer: function() {
						let $input = $('<input>'),
							$label = this.label ? $(`<label>${this.label}<label>`) : $();

						$input.attr({
							placeholder: this.placeholder,
							type: this.type
						});

						$input.style(this.xStyle);
						$input.addClass(this.xClasses);
						$input.attr(this.xAttr);

						if(this.group) {
							let $group = $('<div class="input-group');

							if(this.group.left)
								$group.append($(`<span class="input-group-addon">${this.group.left}</span>`));

							$group.append($input);

							if(this.group.right)
								$group.append($(`<span class="input-group-addon">${this.group.right}</span>`));

							$input = $group;
						}

						return $('<div class="form-group">').append($label).append($input);
					}
				},
				submit: {
					$submit: true,
					$renderer: function() {
						return $('<div class="form-group">').append($(`<button class="btn btn-default">${this.text}</button>`));
					},
					defaults: {
						text: 'Submit'
					}
				}
			};
		}

		return {
			frameworks
		};
	}
]);