const _ = require('lodash'),
	fs = require('fs'),
	webpage = require('webpage');

const CURRENTPATH = phantom.libraryPath,
	HTMLPATH = CURRENTPATH + '/../testing.html',
	INPATH = CURRENTPATH + '/input/',
	OUTPATH = CURRENTPATH + '/output/';

var page = webpage.create(),
	forms = _(fs.list(INPATH)).toArray().pull('.', '..').map((filename) => ({ filename, content: JSON.parse(fs.read(INPATH + filename).replace(/\n/g, "")) })).value();

page.open(HTMLPATH, function(status) {
	if (status === 'success') {
		_.forEach(forms, function(form) {
			page.evaluate(function(json) {
				$('[ng-controller]').scope().$apply(function(scope) {
					scope.testForm = json;
				});
			}, form.content);
			page.render(OUTPATH + form.filename.replace(/[^.]*$/, 'png'));
		});
	} else {
		console.log(`Failed to open HTML file ${HTMLPATH} with status "${status}"`);
	}
	phantom.exit();
});