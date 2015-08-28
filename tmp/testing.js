var page = require('webpage').create();
page.open('http://github.com/', function() {
	console.log('a');
    page.render('github.png');
    phantom.exit();
});
