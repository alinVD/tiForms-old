var _ = require('lodash'), fs = require('fs'), webpage = require('webpage');
var page = webpage.create(), htmlpath = 'file:///home/tahsis/projects/tiForms/index.html', inputpath = '/home/tahsis/projects/tiForms/testing/input/', forms = _(fs.list(inputpath)).toArray().pull('.', '..').map(function (filename) { return fs.read(inputpath + filename); }).value();
console.log(phantom.libraryPath);
page.open(htmlpath, function (status) {
    if (status === 'fail')
        return console.log("Opening test page " + htmlpath + " failed");
    else if (status !== 'success')
        return console.log("Unexpected status " + status);
    else {
        _.forEach(forms, function (form) {
            var ret = page.evaluate(function (form) {
                var applied = false, timelimit = 10000;
                setTimeout(function () { return applied = true; }, timelimit);
                $('[ng-controller]').scope().$apply(function (scope) {
                    applied = true;
                    scope.testForm = form;
                });
                while (!applied)
                    angular.noop();
                return applied;
            }, JSON.parse(form.replace(/\n/g, "")));
            console.log(ret);
            page.render('test.png');
        });
    }
});
